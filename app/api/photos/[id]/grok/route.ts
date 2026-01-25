import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { readFile } from 'fs/promises';
import { join } from 'path';

export const runtime = 'nodejs';
export const maxDuration = 60;

// Helper function to process Gemini API response
async function processGeminiResponse(geminiData: any, photoId: number) {
  console.log('Gemini API response received:', JSON.stringify(geminiData).substring(0, 500));

  // Extract the response text
  let identification = '';
  
  // Check for errors in response
  if (geminiData.error) {
    console.error('Gemini API returned error:', geminiData.error);
    throw new Error(`Gemini API error: ${geminiData.error.message || JSON.stringify(geminiData.error)}`);
  }

  // Check for safety filters blocking the response
  if (geminiData.candidates && geminiData.candidates[0] && geminiData.candidates[0].finishReason) {
    const finishReason = geminiData.candidates[0].finishReason;
    if (finishReason !== 'STOP' && finishReason !== 'MAX_TOKENS') {
      console.warn('Gemini finish reason:', finishReason);
      if (finishReason === 'SAFETY') {
        throw new Error('Content was blocked by safety filters. Please try a different image.');
      }
    }
  }
  
  if (geminiData.candidates && geminiData.candidates[0] && geminiData.candidates[0].content) {
    const content = geminiData.candidates[0].content;
    if (content.parts && content.parts[0] && content.parts[0].text) {
      identification = content.parts[0].text;
    } else if (content.parts && content.parts[0]) {
      // Sometimes text might be directly in parts
      identification = content.parts[0].text || JSON.stringify(content.parts[0]);
    }
  }

  if (!identification) {
    console.error('No identification found in response. Full response:', JSON.stringify(geminiData));
    throw new Error(`No identification result from Gemini API. Response structure: ${JSON.stringify(geminiData).substring(0, 300)}`);
  }

  // Extract species from the identification text
  // Priority: Look for "Common Name:" pattern first
  let extractedSpecies: string | null = null;
  
  // Try to extract species from the response - prioritize "Common Name:" pattern
  const speciesPatterns = [
    /Common Name:\s*([^\n*]+)/i, // Primary pattern: "Common Name: Kori Bustard"
    /\*\*Common Name[:\*]?\*\*[:\s]*([^\n*]+)/i, // With markdown formatting
    /\*\*Most likely species[:\*]?\*\*[:\s]*([^\n*]+)/i,
    /\*\*Species[:\*]?\*\*[:\s]*([^\n*]+)/i,
    /(?:species|identified as|likely)[:\s]*([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/i,
    /^([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\s*\(/m, // Common name at start followed by scientific name
  ];
  
  for (const pattern of speciesPatterns) {
    const match = identification.match(pattern);
    if (match && match[1]) {
      extractedSpecies = match[1].trim()
        .replace(/\*\*/g, '') // Remove markdown bold
        .replace(/^\*\*|\*\*$/g, '') // Remove leading/trailing bold
        .replace(/^[-•*]\s*/, '') // Remove list markers
        .substring(0, 255); // Limit to 255 chars for VARCHAR
      if (extractedSpecies.length > 0) {
        console.log('Extracted species:', extractedSpecies);
        break;
      }
    }
  }
  
  // If no pattern matched, try to get the first line or first sentence
  if (!extractedSpecies) {
    const firstLine = identification.split('\n')[0].trim();
    if (firstLine.length > 0 && firstLine.length < 100) {
      extractedSpecies = firstLine.replace(/\*\*/g, '').substring(0, 255);
    }
  }

  // Save species and AI response to database
  try {
    const updateQuery = `
      UPDATE photos 
      SET species = COALESCE($1, species), 
          airesponse = $2
      WHERE id = $3
      RETURNING species, airesponse
    `;
    const updateResult = await pool.query(updateQuery, [
      extractedSpecies || null,
      identification,
      photoId
    ]);
    
    if (updateResult.rows.length > 0) {
      console.log('Saved species and AI response to database');
      if (updateResult.rows[0].species) {
        extractedSpecies = updateResult.rows[0].species;
      }
    }
  } catch (dbError) {
    console.error('Error saving to database:', dbError);
    // Continue even if database update fails
  }

  // Format the response
  const formattedIdentification = `**Bird Identification - AiID Analysis (Powered by Google Gemini)**\n\n${identification}\n\n---\n*Analysis provided by Google Gemini AI*\n*For additional verification, consider using the Merlin Bird ID app (merlin.allaboutbirds.org)*`;

  return NextResponse.json({
    identification: formattedIdentification,
    source: 'Google Gemini AI',
    imageProcessed: true,
    species: extractedSpecies
  });
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const photoId = parseInt(params.id);
    
    if (!photoId || isNaN(photoId)) {
      return NextResponse.json(
        { error: 'Invalid photo ID' },
        { status: 400 }
      );
    }

    // Get photo from database
    const photoResult = await pool.query(
      'SELECT image_url, location, species, airesponse FROM photos WHERE id = $1 AND approved = true',
      [photoId]
    );

    if (photoResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'Photo not found' },
        { status: 404 }
      );
    }

    const photo = photoResult.rows[0];
    const imageUrl = photo.image_url;
    const photoLocation = photo.location;
    const existingSpecies = photo.species;
    const existingAiResponse = photo.airesponse;

    // If AI response already exists, return it without calling Gemini
    if (existingAiResponse) {
      console.log('Returning cached AI response for photo:', photoId);
      const formattedIdentification = `**Bird Identification - AiID Analysis (Powered by Google Gemini)**\n\n${existingAiResponse}\n\n---\n*Analysis provided by Google Gemini AI*\n*For additional verification, consider using the Merlin Bird ID app (merlin.allaboutbirds.org)*`;
      
      return NextResponse.json({
        identification: formattedIdentification,
        source: 'Google Gemini AI (Cached)',
        imageProcessed: true,
        species: existingSpecies
      });
    }

    // Get the full URL for the image
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 
                    request.headers.get('origin') || 
                    'http://localhost:3000';
    const fullImageUrl = imageUrl.startsWith('http') 
      ? imageUrl 
      : `${baseUrl}${imageUrl}`;

    // Fetch the image
    let imageBuffer: Buffer;
    try {
      if (imageUrl.startsWith('http')) {
        // External URL - fetch it
        console.log('Fetching external image from:', fullImageUrl);
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
        const imageResponse = await fetch(fullImageUrl, {
          signal: controller.signal,
        });
        clearTimeout(timeoutId);
        if (!imageResponse.ok) {
          throw new Error(`Failed to fetch image: ${imageResponse.status} ${imageResponse.statusText}`);
        }
        imageBuffer = Buffer.from(await imageResponse.arrayBuffer());
        console.log('Successfully fetched external image, size:', imageBuffer.length);
      } else {
        // Local file - read from filesystem
        const imagePath = join(process.cwd(), 'public', imageUrl);
        console.log('Reading local image from:', imagePath);
        imageBuffer = await readFile(imagePath);
        console.log('Successfully read local image, size:', imageBuffer.length);
      }
      
      if (!imageBuffer || imageBuffer.length === 0) {
        throw new Error('Image buffer is empty');
      }
    } catch (error) {
      console.error('Error reading image:', error);
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      return NextResponse.json(
        { 
          error: 'Failed to process image',
          details: errorMsg,
          identification: `**Bird Identification - AiID Analysis**\n\n` +
            `**Error:** Unable to read the image file.\n\n` +
            `Please ensure the image is accessible and try again.`
        },
        { status: 500 }
      );
    }

    // Get Gemini API key from environment
    const geminiApiKey = process.env.GEMINI_API_KEY;
    
    if (!geminiApiKey || geminiApiKey.trim() === '') {
      console.error('GEMINI_API_KEY is not set in environment variables');
      return NextResponse.json(
        { 
          error: 'Gemini API key not configured',
          identification: `**Bird Identification - AiID Analysis**\n\n` +
            `**Error:** Gemini API key is not configured.\n\n` +
            `Please add GEMINI_API_KEY to your .env.local file:\n` +
            `\`\`\`\n` +
            `GEMINI_API_KEY=your-api-key-here\n` +
            `\`\`\`\n\n` +
            `Get your API key from: https://aistudio.google.com/app/apikey\n\n` +
            `After adding the key, restart your development server.`
        },
        { status: 500 }
      );
    }
    
    console.log('Gemini API key found, length:', geminiApiKey.length);

    // Convert image to base64 for Gemini API
    const imageBase64 = imageBuffer.toString('base64');
    
    // Determine image MIME type
    let mimeType = 'image/jpeg';
    if (imageUrl.toLowerCase().endsWith('.png')) {
      mimeType = 'image/png';
    } else if (imageUrl.toLowerCase().endsWith('.webp')) {
      mimeType = 'image/webp';
    } else if (imageUrl.toLowerCase().endsWith('.gif')) {
      mimeType = 'image/gif';
    }

    // Prepare prompt for bird identification
    let locationContext = '';
    if (photoLocation) {
      locationContext = ` The photo was taken in: ${photoLocation}.`;
    }

    const prompt = `Analyze this bird photograph and provide a detailed identification.${locationContext}

Please provide:
1. **Most likely species identification** (common name and scientific name if possible)
2. **Key identifying features** observed (size, colors, markings, bill shape, etc.)
3. **Confidence level** in the identification
4. **Similar species** that could be confused with this bird
5. **Habitat and behavior** characteristics visible in the image
6. **Additional notes** about the bird's appearance

Be specific and detailed. If you cannot confidently identify the species, suggest the most likely family or group and explain what additional information would help with identification.`;

    try {
      console.log('Sending image to Gemini API for bird identification...');
      console.log('Image size:', imageBuffer.length, 'bytes');
      console.log('MIME type:', mimeType);
      console.log('API key present:', !!geminiApiKey);
      
      // First, try to list available models to see what's supported
      console.log('Checking available Gemini models...');
      const listModelsUrl = `https://generativelanguage.googleapis.com/v1beta/models?key=${geminiApiKey}`;
      let availableModels: string[] = [];
      
      try {
        const listResponse = await fetch(listModelsUrl);
        if (listResponse.ok) {
          const listData = await listResponse.json();
          if (listData.models) {
            availableModels = listData.models
              .filter((m: any) => m.supportedGenerationMethods?.includes('generateContent'))
              .map((m: any) => m.name);
            console.log('Available models:', availableModels);
          }
        }
      } catch (e) {
        console.log('Could not list models, will try common model names');
      }
      
      // Try models in order of preference
      const modelsToTry = [
        'gemini-1.5-pro',
        'gemini-1.5-flash',
        'gemini-pro',
        'gemini-1.5-pro-latest',
        'gemini-1.5-flash-latest'
      ];
      
      // If we got available models, use those first
      if (availableModels.length > 0) {
        // Filter to vision-capable models and add to front of list
        const visionModels = availableModels.filter((name: string) => 
          name.includes('gemini') && !name.includes('embed')
        );
        modelsToTry.unshift(...visionModels.map((name: string) => name.replace('models/', '')));
      }
      
      const requestBody = {
        contents: [{
          parts: [
            {
              text: prompt
            },
            {
              inline_data: {
                mime_type: mimeType,
                data: imageBase64
              }
            }
          ]
        }],
        generationConfig: {
          temperature: 0.4,
          topK: 32,
          topP: 1,
          maxOutputTokens: 2048,
        }
      };
      
      let lastError: string = '';
      
      // Try each model until one works
      for (const modelName of modelsToTry) {
        const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${geminiApiKey}`;
        console.log(`Trying model: ${modelName}`);
        
        try {
          const geminiResponse = await fetch(apiUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestBody)
          });
          
          console.log(`Model ${modelName} response status:`, geminiResponse.status);
          
          if (geminiResponse.ok) {
            const geminiData = await geminiResponse.json();
            console.log(`Model ${modelName} succeeded!`);
            return await processGeminiResponse(geminiData, photoId);
          } else {
            const errorText = await geminiResponse.text();
            lastError = errorText;
            console.error(`Model ${modelName} failed:`, geminiResponse.status, errorText.substring(0, 200));
            // Continue to next model
          }
        } catch (e) {
          lastError = e instanceof Error ? e.message : 'Unknown error';
          console.error(`Model ${modelName} exception:`, lastError);
          // Continue to next model
        }
      }
      
      // If all models failed, throw error
      throw new Error(`All Gemini models failed. Last error: ${lastError.substring(0, 300)}`);

    } catch (error) {
      console.error('Error with Gemini API:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('Full error details:', errorMessage);
      
      // Provide more helpful error messages
      let userFriendlyError = errorMessage;
      if (errorMessage.includes('API key')) {
        userFriendlyError = 'Gemini API key is missing or invalid. Please check your GEMINI_API_KEY environment variable.';
      } else if (errorMessage.includes('SAFETY')) {
        userFriendlyError = 'The image was blocked by content safety filters. Please try a different image.';
      } else if (errorMessage.includes('400')) {
        userFriendlyError = 'Invalid request to Gemini API. The image format may not be supported.';
      } else if (errorMessage.includes('401') || errorMessage.includes('403')) {
        userFriendlyError = 'Authentication failed. Please check your Gemini API key.';
      } else if (errorMessage.includes('429')) {
        userFriendlyError = 'Rate limit exceeded. Please try again in a moment.';
      }
      
      return NextResponse.json(
        {
          error: 'Failed to identify bird',
          identification: `**Bird Identification - AiID Analysis**\n\n` +
            `**Error:** Unable to process image with Gemini API.\n\n` +
            `**Error Details:** ${userFriendlyError}\n\n` +
            `**Troubleshooting:**\n` +
            `- Verify your GEMINI_API_KEY is set in .env.local\n` +
            `- Check that your API key is valid at https://aistudio.google.com/app/apikey\n` +
            `- Ensure the image file is accessible and in a supported format (JPEG, PNG, WebP)\n\n` +
            `**Alternative Options:**\n` +
            `1. **Merlin Bird ID App** (Free) - merlin.allaboutbirds.org\n` +
            `   - Upload this photo using Photo ID feature\n` +
            `   - Get instant, accurate species identification\n\n` +
            `2. **Manual Identification Tips:**\n` +
            `   - Note the bird's size, colors, and markings\n` +
            `   - Check bill shape and size\n` +
            `   - Observe habitat and behavior\n` +
            `   - Use a field guide or online resource\n\n` +
            `3. **Community Help:**\n` +
            `   - Submit to ebird.org for community identification\n` +
            `   - Share in local birding groups`
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error identifying bird:', error);
    return NextResponse.json(
      { 
        error: 'Failed to identify bird',
        identification: `**Bird Identification - AiID Analysis**\n\n` +
          `An unexpected error occurred. Please try again or use the Merlin Bird ID app (merlin.allaboutbirds.org) for photo identification.`
      },
      { status: 500 }
    );
  }
}

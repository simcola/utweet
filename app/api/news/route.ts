import { NextResponse } from 'next/server';

interface NewsArticle {
  id: string;
  title: string;
  summary: string;
  url: string;
  source: string;
  published_at: string;
}

// Calculate date 28 days ago
function getTwentyEightDaysAgo(): Date {
  const date = new Date();
  date.setDate(date.getDate() - 28);
  return date;
}

// RSS feeds from major birding sites and news outlets
const RSS_FEEDS = [
  // Major Birding Organizations (all articles from these are birding-related)
  { url: 'https://www.audubon.org/news/rss.xml', name: 'Audubon', isBirdingSite: true },
  { url: 'https://www.birdlife.org/news/feed/', name: 'BirdLife International', isBirdingSite: true },
  { url: 'https://www.rspb.org.uk/about-the-rspb/at-home/news-and-features/rss/', name: 'RSPB', isBirdingSite: true },
  { url: 'https://www.allaboutbirds.org/news/feed/', name: 'All About Birds', isBirdingSite: true },
  { url: 'https://www.birdwatchingdaily.com/feed/', name: 'BirdWatching Daily', isBirdingSite: true },
  { url: 'https://www.birds.cornell.edu/home/feed/', name: 'Cornell Lab of Ornithology', isBirdingSite: true },
  
  // Major News Outlets (need relevance filtering)
  { url: 'https://www.bbc.co.uk/news/science_and_environment/rss.xml', name: 'BBC Science & Environment', isBirdingSite: false },
  { url: 'https://www.theguardian.com/environment/wildlife/rss', name: 'The Guardian Wildlife', isBirdingSite: false },
  { url: 'https://www.nationalgeographic.com/animals/rss/', name: 'National Geographic Animals', isBirdingSite: false },
  { url: 'https://rss.sciam.com/ScientificAmerican-News', name: 'Scientific American', isBirdingSite: false },
  { url: 'https://www.smithsonianmag.com/rss/science-nature/', name: 'Smithsonian Science', isBirdingSite: false },
  
  // Conservation and Wildlife News (need relevance filtering)
  { url: 'https://www.nature.com/nature.rss', name: 'Nature', isBirdingSite: false },
  { url: 'https://feeds.feedburner.com/ConservationMagazine', name: 'Conservation Magazine', isBirdingSite: false },
];

// Additional Google News searches for comprehensive coverage
const GOOGLE_NEWS_SEARCHES = [
  'bird watching OR birding OR bird conservation',
  'ornithology OR bird migration OR bird species',
  'endangered birds OR bird conservation OR wildlife protection',
];

// Parse RSS feed item
function parseRSSItem(item: any, index: number): NewsArticle | null {
  try {
    const title = item.title?.trim() || item['title']?.trim() || '';
    const link = item.link?.trim() || item['link']?.trim() || item.guid?.trim() || '';
    const pubDate = item.pubDate?.trim() || item['pubDate']?.trim() || item.published?.trim() || '';
    const description = item.description?.trim() || item['description']?.trim() || item.summary?.trim() || title;
    
    // Extract source from item or link
    let source = item.source || 'News Source';
    if (!source || source === 'News Source') {
      try {
        if (link) {
          const url = new URL(link);
          source = url.hostname.replace('www.', '').split('.')[0];
          source = source.charAt(0).toUpperCase() + source.slice(1);
        }
      } catch (e) {
        // Invalid URL, use default
      }
    }

    // Parse publication date
    let publishedDate: Date;
    if (pubDate) {
      publishedDate = new Date(pubDate);
      if (isNaN(publishedDate.getTime())) {
        publishedDate = new Date(); // Fallback to now if invalid
      }
    } else {
      publishedDate = new Date(); // Fallback to now if no date
    }

    // Check if article is within last 28 days
    const twentyEightDaysAgo = getTwentyEightDaysAgo();
    if (publishedDate < twentyEightDaysAgo) {
      return null; // Skip articles older than 28 days
    }

    if (!title || !link) {
      return null;
    }

    // Create a summary from description (limit to 200 chars)
    const summary = description.length > 200 
      ? description.substring(0, 200).trim() + '...'
      : description.trim();

    return {
      id: `news-${index}-${Date.now()}`,
      title,
      summary: summary || title,
      url: link,
      source,
      published_at: publishedDate.toISOString(),
    };
  } catch (error) {
    console.error('Error parsing RSS item:', error);
    return null;
  }
}

// Fetch articles from a single RSS feed
async function fetchRSSFeed(feedUrl: string, sourceName: string, isBirdingSite: boolean = false): Promise<NewsArticle[]> {
  try {
    const response = await fetch(feedUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
      cache: 'no-store',
    });

    if (!response.ok) {
      throw new Error(`RSS fetch failed: ${response.status}`);
    }

    const xmlText = await response.text();
    const items: NewsArticle[] = [];
    // Convert matchAll iterator to array
    const itemMatches = Array.from(xmlText.matchAll(/<item>([\s\S]*?)<\/item>/gi));
    
    let index = 0;
    for (const match of itemMatches) {
      const itemXml = match[1];
      
      // Extract fields using regex
      const titleMatch = itemXml.match(/<title>([\s\S]*?)<\/title>/i);
      const linkMatch = itemXml.match(/<link>([\s\S]*?)<\/link>/i);
      const pubDateMatch = itemXml.match(/<pubDate>([\s\S]*?)<\/pubDate>/i);
      const descriptionMatch = itemXml.match(/<description>([\s\S]*?)<\/description>/i);
      
      const item = {
        title: titleMatch ? titleMatch[1].replace(/<!\[CDATA\[(.*?)\]\]>/g, '$1').trim() : '',
        link: linkMatch ? linkMatch[1].trim() : '',
        pubDate: pubDateMatch ? pubDateMatch[1].trim() : '',
        description: descriptionMatch ? descriptionMatch[1].replace(/<!\[CDATA\[(.*?)\]\]>/g, '$1').replace(/<[^>]*>/g, '').trim() : '',
        source: sourceName, // Use provided source name
      };

      const parsedItem = parseRSSItem(item, index++);
      if (parsedItem) {
        // Override source with the feed's source name
        parsedItem.source = sourceName;
        // Store whether this is from a birding site for later filtering
        (parsedItem as any).isBirdingSite = isBirdingSite;
        items.push(parsedItem);
      }
      
      if (index > 100) {
        break; // Safety limit per feed
      }
    }

    return items;
  } catch (error) {
    // Silently fail individual feeds to not break the entire process
    // Only log in development to reduce noise in production logs
    if (process.env.NODE_ENV === 'development') {
      console.error(`Error fetching RSS feed ${feedUrl}:`, error);
    }
    return [];
  }
}

// Fetch news from Google News RSS searches
async function fetchGoogleNewsRSS(): Promise<NewsArticle[]> {
  const allArticles: NewsArticle[] = [];
  
  for (const searchQuery of GOOGLE_NEWS_SEARCHES) {
    try {
      const encodedQuery = encodeURIComponent(searchQuery);
      const rssUrl = `https://news.google.com/rss/search?q=${encodedQuery}&hl=en-US&gl=US&ceid=US:en`;
      
      const response = await fetch(rssUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        },
        cache: 'no-store',
      });

      if (!response.ok) {
        continue; // Skip this search if it fails
      }

      const xmlText = await response.text();
      // Convert matchAll iterator to array
      const itemMatches = Array.from(xmlText.matchAll(/<item>([\s\S]*?)<\/item>/gi));
      
      let index = 0;
      for (const match of itemMatches) {
        const itemXml = match[1];
        
        const titleMatch = itemXml.match(/<title>([\s\S]*?)<\/title>/i);
        const linkMatch = itemXml.match(/<link>([\s\S]*?)<\/link>/i);
        const pubDateMatch = itemXml.match(/<pubDate>([\s\S]*?)<\/pubDate>/i);
        const descriptionMatch = itemXml.match(/<description>([\s\S]*?)<\/description>/i);
        
        const item = {
          title: titleMatch ? titleMatch[1].replace(/<!\[CDATA\[(.*?)\]\]>/g, '$1').trim() : '',
          link: linkMatch ? linkMatch[1].trim() : '',
          pubDate: pubDateMatch ? pubDateMatch[1].trim() : '',
          description: descriptionMatch ? descriptionMatch[1].replace(/<!\[CDATA\[(.*?)\]\]>/g, '$1').replace(/<[^>]*>/g, '').trim() : '',
        };

        const parsedItem = parseRSSItem(item, index++);
        if (parsedItem) {
          allArticles.push(parsedItem);
        }
        
        if (index > 30) {
          break; // Limit per search
        }
      }
    } catch (error) {
      console.error(`Error fetching Google News search "${searchQuery}":`, error);
      continue; // Continue with next search
    }
  }

  return allArticles;
}

// Fetch from all RSS feeds in parallel
async function fetchAllRSSFeeds(): Promise<NewsArticle[]> {
  try {
    // Fetch from all RSS feeds in parallel
    const feedPromises = RSS_FEEDS.map(feed => 
      fetchRSSFeed(feed.url, feed.name, feed.isBirdingSite).catch(() => []) // Return empty array on error
    );
    
    const feedResults = await Promise.all(feedPromises);
    const allArticles = feedResults.flat();
    
    return allArticles;
  } catch (error) {
    console.error('Error fetching RSS feeds:', error);
    return [];
  }
}

// Try NewsAPI if API key is available
async function fetchNewsAPI(): Promise<NewsArticle[]> {
  const apiKey = process.env.NEWSAPI_KEY;
  if (!apiKey) {
    return [];
  }

  try {
    const twentyEightDaysAgo = getTwentyEightDaysAgo();
    const fromDate = twentyEightDaysAgo.toISOString().split('T')[0];
    const today = new Date().toISOString().split('T')[0];
    
    // Search from major news sources and birding topics
    const queries = [
      'bird watching OR birding OR bird conservation',
      'ornithology OR bird migration OR endangered birds',
    ];
    
    const allArticles: NewsArticle[] = [];
    
    for (const query of queries) {
      try {
        const encodedQuery = encodeURIComponent(query);
        const url = `https://newsapi.org/v2/everything?q=${encodedQuery}&from=${fromDate}&to=${today}&sortBy=publishedAt&language=en&pageSize=50&apiKey=${apiKey}`;
        
        const response = await fetch(url, {
          cache: 'no-store',
        });

        if (!response.ok) {
          continue;
        }

        const data = await response.json();
        
        if (data.status === 'ok' && data.articles) {
          const articles: NewsArticle[] = data.articles
            .filter((article: any) => article.title && article.url)
            .map((article: any, index: number) => ({
              id: `news-api-${Date.now()}-${index}`,
              title: article.title,
              summary: article.description || article.title,
              url: article.url,
              source: article.source?.name || 'News Source',
              published_at: article.publishedAt || new Date().toISOString(),
            }));
          
          allArticles.push(...articles);
        }
      } catch (error) {
        console.error(`Error fetching NewsAPI for query "${query}":`, error);
        continue;
      }
    }

    return allArticles;
  } catch (error) {
    console.error('Error fetching NewsAPI:', error);
    return [];
  }
}

// Check if article is relevant to birding
function isBirdingRelated(article: NewsArticle): boolean {
  const birdingKeywords = [
    'bird', 'avian', 'ornithology', 'ornithologist', 'migration', 'migratory',
    'species', 'conservation', 'endangered', 'habitat', 'nest', 'nesting',
    'fledge', 'fledgling', 'feather', 'beak', 'talon', 'wing', 'flight',
    'songbird', 'raptor', 'waterfowl', 'shorebird', 'warbler', 'sparrow',
    'eagle', 'hawk', 'owl', 'falcon', 'vulture', 'penguin', 'pelican',
    'crane', 'heron', 'egret', 'stork', 'ibis', 'flamingo', 'duck',
    'goose', 'swan', 'gull', 'tern', 'petrel', 'albatross', 'corvid',
    'crow', 'raven', 'jay', 'magpie', 'audubon', 'birdlife', 'rspb',
  ];
  
  const text = `${article.title} ${article.summary}`.toLowerCase();
  return birdingKeywords.some(keyword => text.includes(keyword));
}

// Deduplicate articles by URL
function deduplicateArticles(articles: NewsArticle[]): NewsArticle[] {
  const seen = new Set<string>();
  const unique: NewsArticle[] = [];
  
  for (const article of articles) {
    // Normalize URL for comparison
    let normalizedUrl = article.url.toLowerCase().trim();
    // Remove trailing slashes and common URL parameters
    normalizedUrl = normalizedUrl.replace(/\/$/, '').split('?')[0].split('#')[0];
    
    if (!seen.has(normalizedUrl)) {
      seen.add(normalizedUrl);
      unique.push(article);
    }
  }
  
  return unique;
}

export async function GET() {
  try {
    // Fetch from all sources in parallel
    const [rssArticles, googleNewsArticles, newsAPIArticles] = await Promise.all([
      fetchAllRSSFeeds(),
      fetchGoogleNewsRSS(),
      fetchNewsAPI(),
    ]);
    
    // Combine all articles
    const allArticles = [...rssArticles, ...googleNewsArticles, ...newsAPIArticles];
    
    // Deduplicate by URL
    const uniqueArticles = deduplicateArticles(allArticles);
    
    // Filter articles to last 28 days, filter for birding relevance, and sort by date (newest first)
    const twentyEightDaysAgo = getTwentyEightDaysAgo();
    const filteredArticles = uniqueArticles
      .filter((article) => {
        const articleDate = new Date(article.published_at);
        // Check date first
        if (articleDate < twentyEightDaysAgo) {
          return false;
        }
        // For articles from birding sites, skip relevance check (all are relevant)
        // For other articles, check if they're birding-related
        const isFromBirdingSite = (article as any).isBirdingSite;
        if (isFromBirdingSite) {
          return true;
        }
        return isBirdingRelated(article);
      })
      .sort((a, b) => {
        return new Date(b.published_at).getTime() - new Date(a.published_at).getTime();
      })
      .slice(0, 20); // Limit to top 20

    return NextResponse.json(filteredArticles);
  } catch (error) {
    console.error('Error fetching news:', error);
    // Return empty array on error
    return NextResponse.json([]);
  }
}

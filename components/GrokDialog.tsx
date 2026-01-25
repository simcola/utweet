'use client';

import { useState, useEffect } from 'react';
import { X, Loader2 } from 'lucide-react';

interface GrokDialogProps {
  isOpen: boolean;
  onClose: () => void;
  imageUrl: string;
  photoId: number;
}

export default function GrokDialog({ isOpen, onClose, imageUrl, photoId }: GrokDialogProps) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const identifyBird = async () => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch(`/api/photos/${photoId}/grok`, {
        method: 'POST',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to identify bird');
      }

      const data = await response.json();
      setResult(data.identification || 'Bird identification completed');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      // Reset state when dialog opens
      setResult(null);
      setError(null);
      setLoading(false);
      // Start identification
      identifyBird();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, photoId]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-emerald-900/95 backdrop-blur-md rounded-lg border border-emerald-500/20 max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-emerald-900/95 backdrop-blur-md border-b border-emerald-500/20 p-4 flex items-center justify-between">
          <h2 className="text-2xl font-semibold text-white">AiID - Bird Identification</h2>
          <button
            onClick={onClose}
            className="text-emerald-200 hover:text-white transition-colors"
          >
            <X size={24} />
          </button>
        </div>
        
        <div className="p-6 space-y-6">
          {/* Image */}
          <div className="bg-emerald-950/40 rounded-lg overflow-hidden border border-emerald-500/20">
            <img
              src={imageUrl}
              alt="Bird photo for identification"
              className="w-full h-auto max-h-96 object-contain"
            />
          </div>

          {/* Loading State */}
          {loading && (
            <div className="flex flex-col items-center justify-center py-12 space-y-4">
              <Loader2 className="text-emerald-400 animate-spin" size={48} />
              <p className="text-emerald-200/70">Analyzing bird image with Google Gemini AI...</p>
            </div>
          )}

          {/* Error State */}
          {error && !loading && (
            <div className="bg-red-900/30 border border-red-500/30 rounded-lg p-4">
              <p className="text-red-200 font-medium">Error</p>
              <p className="text-red-300/70 text-sm mt-1">{error}</p>
              <button
                onClick={identifyBird}
                className="mt-4 px-4 py-2 bg-red-700 text-white rounded-md hover:bg-red-600 transition-colors"
              >
                Try Again
              </button>
            </div>
          )}

          {/* Result */}
          {result && !loading && (
            <div className="bg-emerald-950/40 rounded-lg border border-emerald-500/20 p-6">
              <h3 className="text-lg font-semibold text-emerald-200 mb-4">Identification Result</h3>
              <div className="prose prose-invert max-w-none">
                <div className="text-emerald-100 whitespace-pre-wrap leading-relaxed space-y-4">
                  {result.split('\n\n').map((paragraph, idx) => {
                    // Handle markdown-style formatting
                    if (paragraph.startsWith('**') && paragraph.endsWith('**')) {
                      return (
                        <h4 key={idx} className="text-emerald-200 font-semibold text-base mt-4 mb-2">
                          {paragraph.replace(/\*\*/g, '')}
                        </h4>
                      );
                    }
                    if (paragraph.includes('**') && paragraph.includes('*')) {
                      // Handle bold and italic text
                      const parts = paragraph.split(/(\*\*[^*]+\*\*|\*[^*]+\*)/g);
                      return (
                        <p key={idx} className="mb-2">
                          {parts.map((part, partIdx) => {
                            if (part.startsWith('**') && part.endsWith('**')) {
                              return <strong key={partIdx} className="text-emerald-200">{part.slice(2, -2)}</strong>;
                            }
                            if (part.startsWith('*') && part.endsWith('*') && !part.startsWith('**')) {
                              return <em key={partIdx} className="text-emerald-200/90">{part.slice(1, -1)}</em>;
                            }
                            if (part.startsWith('- ')) {
                              return <li key={partIdx} className="ml-4 list-disc">{part.slice(2)}</li>;
                            }
                            return <span key={partIdx}>{part}</span>;
                          })}
                        </p>
                      );
                    }
                    if (paragraph.startsWith('- ')) {
                      return (
                        <ul key={idx} className="list-disc ml-6 mb-2">
                          <li>{paragraph.slice(2)}</li>
                        </ul>
                      );
                    }
                    if (paragraph.startsWith('---')) {
                      return <hr key={idx} className="border-emerald-500/30 my-4" />;
                    }
                    return (
                      <p key={idx} className="mb-2">
                        {paragraph.split(/(\*\*[^*]+\*\*|\*[^*]+\*)/g).map((part, partIdx) => {
                          if (part.startsWith('**') && part.endsWith('**')) {
                            return <strong key={partIdx} className="text-emerald-200">{part.slice(2, -2)}</strong>;
                          }
                          if (part.startsWith('*') && part.endsWith('*') && !part.startsWith('**')) {
                            return <em key={partIdx} className="text-emerald-200/90">{part.slice(1, -1)}</em>;
                          }
                          return <span key={partIdx}>{part}</span>;
                        })}
                      </p>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}


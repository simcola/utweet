'use client';

import { useState, useEffect, useRef } from 'react';
import { Photo } from '@/lib/types';
import { Heart, Upload, Grid, X, Image as ImageIcon, Sparkles } from 'lucide-react';
import PhotoUploadDialog from './PhotoUploadDialog';
import GrokDialog from './GrokDialog';

export default function PhotoGallery() {
  const [photoOfMonth, setPhotoOfMonth] = useState<Photo | null>(null);
  const [galleryPhotos, setGalleryPhotos] = useState<Photo[]>([]);
  const [showGallery, setShowGallery] = useState(false);
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [showGrokDialog, setShowGrokDialog] = useState(false);
  const [selectedPhotoForGrok, setSelectedPhotoForGrok] = useState<Photo | null>(null);
  const [loading, setLoading] = useState(true);
  const galleryDialogRef = useRef<HTMLDivElement>(null);

  // Close on Escape key
  useEffect(() => {
    if (showGallery) {
      const handleEscape = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          setShowGallery(false);
        }
      };
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
      
      return () => {
        document.removeEventListener('keydown', handleEscape);
        document.body.style.overflow = 'unset';
      };
    }
  }, [showGallery]);

  // Close when clicking outside
  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      setShowGallery(false);
    }
  };

  const fetchPhotoOfMonth = async () => {
    try {
      const response = await fetch('/api/photos?type=month');
      if (response.ok) {
        const data = await response.json();
        setPhotoOfMonth(data);
      }
    } catch (error) {
      console.error('Error fetching photo of the month:', error);
    }
  };

  const fetchGalleryPhotos = async () => {
    try {
      const response = await fetch('/api/photos');
      if (response.ok) {
        const data = await response.json();
        setGalleryPhotos(data);
      }
    } catch (error) {
      console.error('Error fetching gallery photos:', error);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([fetchPhotoOfMonth(), fetchGalleryPhotos()]);
      setLoading(false);
    };
    loadData();
  }, []);

  const handleLike = async (photoId: number) => {
    try {
      const response = await fetch(`/api/photos/${photoId}/like`, {
        method: 'POST',
      });

      if (response.ok) {
        // Refresh both photo of month and gallery
        await Promise.all([fetchPhotoOfMonth(), fetchGalleryPhotos()]);
      }
    } catch (error) {
      console.error('Error liking photo:', error);
    }
  };

  const handleUploadSuccess = () => {
    setShowUploadDialog(false);
    // Refresh gallery after upload
    fetchGalleryPhotos();
  };

  const handleGrokClick = (photo: Photo) => {
    setSelectedPhotoForGrok(photo);
    setShowGrokDialog(true);
  };

  return (
    <>
      {/* Button to open gallery popup */}
      <div className="bg-emerald-900/30 backdrop-blur-md rounded-lg border border-emerald-500/20 p-4">
        <button
          onClick={() => setShowGallery(true)}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-emerald-600 text-white rounded-md hover:bg-emerald-700 active:bg-emerald-800 transition-colors touch-manipulation font-semibold"
        >
          <Grid size={20} />
          <span>Photo Gallery</span>
        </button>
      </div>

      {/* Gallery Popup Modal */}
      {showGallery && (
        <div 
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-2 sm:p-4"
          onClick={handleBackdropClick}
          onTouchStart={(e) => {
            if (e.target === e.currentTarget) {
              setShowGallery(false);
            }
          }}
        >
          <div 
            ref={galleryDialogRef}
            className="bg-emerald-900/95 backdrop-blur-md rounded-lg border border-emerald-500/20 max-w-6xl w-full max-h-[95vh] sm:max-h-[90vh] overflow-y-auto shadow-2xl"
            onClick={(e) => e.stopPropagation()}
            onTouchStart={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="sticky top-0 bg-emerald-900/95 backdrop-blur-md border-b border-emerald-500/20 p-4 sm:p-6 flex items-center justify-between z-10">
              <h2 className="text-xl sm:text-2xl font-semibold text-white">Photo Gallery</h2>
              <div className="flex items-center gap-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    console.log('Upload button clicked');
                    setShowUploadDialog(true);
                  }}
                  className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700 active:bg-emerald-800 transition-colors touch-manipulation text-sm sm:text-base"
                >
                  <Upload size={18} />
                  <span className="hidden sm:inline">Upload Photo</span>
                  <span className="sm:hidden">Upload</span>
                </button>
                <button
                  onClick={() => setShowGallery(false)}
                  className="text-emerald-200 hover:text-white transition-colors p-2 -mr-2 touch-manipulation"
                  aria-label="Close gallery"
                >
                  <X size={24} />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="p-4 sm:p-6 space-y-6">
              {/* Photo of the Month */}
              <div>
                <h3 className="text-lg font-medium text-emerald-200 mb-4">Photo of the Month</h3>
                {loading ? (
                  <div className="bg-emerald-950/40 rounded-lg border border-emerald-500/20 p-12 text-center">
                    <div className="text-emerald-200/70">Loading...</div>
                  </div>
                ) : photoOfMonth ? (
                  <div className="bg-emerald-950/40 rounded-lg overflow-hidden border border-emerald-500/20">
                    <div className="relative w-full bg-emerald-950/60" style={{ minHeight: '200px', maxHeight: '400px' }}>
                      <img
                        src={photoOfMonth.image_url}
                        alt={`Photo by ${photoOfMonth.username}`}
                        className="w-full h-full object-contain"
                        style={{ maxHeight: '400px' }}
                      />
                    </div>
                    <div className="p-4 space-y-2">
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <div>
                          <p className="text-sm text-emerald-200 font-medium">{photoOfMonth.username}</p>
                          {photoOfMonth.location && (
                            <p className="text-xs text-emerald-300/70">{photoOfMonth.location}</p>
                          )}
                          {photoOfMonth.species && (
                            <p className="text-xs text-emerald-400 font-semibold mt-1">Species: {photoOfMonth.species}</p>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleGrokClick(photoOfMonth)}
                            className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-purple-700 text-white hover:bg-purple-600 active:bg-purple-800 transition-colors touch-manipulation"
                          >
                            <Sparkles size={16} />
                            <span className="text-sm">AiID</span>
                          </button>
                          <button
                            onClick={() => handleLike(photoOfMonth.id)}
                            disabled={photoOfMonth.is_liked}
                            className={`flex items-center gap-2 px-3 py-1.5 rounded-md transition-colors touch-manipulation ${
                              photoOfMonth.is_liked
                                ? 'bg-emerald-800/50 text-emerald-300 cursor-not-allowed'
                                : 'bg-emerald-700 text-white hover:bg-emerald-600 active:bg-emerald-800'
                            }`}
                          >
                            <Heart size={16} fill={photoOfMonth.is_liked ? 'currentColor' : 'none'} />
                            <span className="text-sm">{photoOfMonth.likes}</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="bg-emerald-950/40 rounded-lg border border-emerald-500/20 p-12 text-center">
                    <ImageIcon className="mx-auto text-emerald-500/50 mb-4" size={48} />
                    <p className="text-emerald-200/70">No photo of the month yet</p>
                    <p className="text-sm text-emerald-300/50 mt-2">Upload a photo to get started!</p>
                  </div>
                )}
              </div>

              {/* Gallery Grid */}
              <div>
                <h3 className="text-lg font-medium text-emerald-200 mb-4">Recent Photos (Last 30 Days)</h3>
                {loading ? (
                  <div className="text-center py-12">
                    <div className="text-emerald-200/70">Loading gallery...</div>
                  </div>
                ) : galleryPhotos.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {galleryPhotos.map((photo) => (
                      <div
                        key={photo.id}
                        className="bg-emerald-950/40 rounded-lg overflow-hidden border border-emerald-500/20"
                      >
                        <div className="relative w-full bg-emerald-950/60" style={{ minHeight: '200px', maxHeight: '300px' }}>
                          <img
                            src={photo.image_url}
                            alt={`Photo by ${photo.username}`}
                            className="w-full h-full object-contain"
                            style={{ maxHeight: '300px' }}
                          />
                        </div>
                        <div className="p-3 space-y-2">
                          <div className="flex items-center justify-between flex-wrap gap-2">
                            <div>
                              <p className="text-sm text-emerald-200 font-medium">{photo.username}</p>
                              {photo.location && (
                                <p className="text-xs text-emerald-300/70">{photo.location}</p>
                              )}
                              {photo.species && (
                                <p className="text-xs text-emerald-400 font-semibold mt-1">Species: {photo.species}</p>
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => handleGrokClick(photo)}
                                className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-purple-700 text-white hover:bg-purple-600 active:bg-purple-800 transition-colors touch-manipulation"
                              >
                                <Sparkles size={14} />
                                <span className="text-sm">AiID</span>
                              </button>
                              <button
                                onClick={() => handleLike(photo.id)}
                                disabled={photo.is_liked}
                                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md transition-colors touch-manipulation ${
                                  photo.is_liked
                                    ? 'bg-emerald-800/50 text-emerald-300 cursor-not-allowed'
                                    : 'bg-emerald-700 text-white hover:bg-emerald-600 active:bg-emerald-800'
                                }`}
                              >
                                <Heart size={14} fill={photo.is_liked ? 'currentColor' : 'none'} />
                                <span className="text-sm">{photo.likes}</span>
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <ImageIcon className="mx-auto text-emerald-500/50 mb-4" size={48} />
                    <p className="text-emerald-200/70">No photos in the gallery yet</p>
                    <p className="text-sm text-emerald-300/50 mt-2">Upload a photo to get started!</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Upload Dialog - Higher z-index than gallery */}
      {showUploadDialog && (
        <div style={{ zIndex: 60 }}>
          <PhotoUploadDialog
            onClose={() => {
              console.log('Closing upload dialog');
              setShowUploadDialog(false);
            }}
            onSuccess={handleUploadSuccess}
          />
        </div>
      )}

      {/* Grok Dialog */}
      {showGrokDialog && selectedPhotoForGrok && (
        <GrokDialog
          isOpen={showGrokDialog}
          onClose={() => {
            setShowGrokDialog(false);
            setSelectedPhotoForGrok(null);
          }}
          imageUrl={selectedPhotoForGrok.image_url}
          photoId={selectedPhotoForGrok.id}
        />
      )}
    </>
  );
}


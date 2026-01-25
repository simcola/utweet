'use client';

import { useState, useEffect } from 'react';
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

  if (loading) {
    return (
      <div className="bg-emerald-900/30 backdrop-blur-md rounded-lg border border-emerald-500/20 p-6">
        <div className="text-center text-emerald-200/70">Loading gallery...</div>
      </div>
    );
  }

  return (
    <>
      <div className="bg-emerald-900/30 backdrop-blur-md rounded-lg border border-emerald-500/20 p-6 space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-semibold text-white">Photo Gallery</h2>
          <div className="flex gap-2">
            <button
              onClick={() => setShowGallery(true)}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-700 text-white rounded-md hover:bg-emerald-600 transition-colors"
            >
              <Grid size={18} />
              View Gallery
            </button>
            <button
              onClick={() => setShowUploadDialog(true)}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700 transition-colors"
            >
              <Upload size={18} />
              Upload Photo
            </button>
          </div>
        </div>

        {/* Photo of the Month */}
        <div>
          <h3 className="text-lg font-medium text-emerald-200 mb-4">Photo of the Month</h3>
          {photoOfMonth ? (
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
                <div className="flex items-center justify-between">
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
                      className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-purple-700 text-white hover:bg-purple-600 transition-colors"
                    >
                      <Sparkles size={16} />
                      <span>AiID</span>
                    </button>
                    <button
                      onClick={() => handleLike(photoOfMonth.id)}
                      disabled={photoOfMonth.is_liked}
                      className={`flex items-center gap-2 px-3 py-1.5 rounded-md transition-colors ${
                        photoOfMonth.is_liked
                          ? 'bg-emerald-800/50 text-emerald-300 cursor-not-allowed'
                          : 'bg-emerald-700 text-white hover:bg-emerald-600'
                      }`}
                    >
                      <Heart size={16} fill={photoOfMonth.is_liked ? 'currentColor' : 'none'} />
                      <span>{photoOfMonth.likes}</span>
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
      </div>

      {/* Gallery Modal */}
      {showGallery && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-emerald-900/95 backdrop-blur-md rounded-lg border border-emerald-500/20 max-w-6xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-emerald-900/95 backdrop-blur-md border-b border-emerald-500/20 p-4 flex items-center justify-between">
              <h2 className="text-2xl font-semibold text-white">Photo Gallery (Last 30 Days)</h2>
              <button
                onClick={() => setShowGallery(false)}
                className="text-emerald-200 hover:text-white transition-colors"
              >
                <X size={24} />
              </button>
            </div>
            <div className="p-6">
              {galleryPhotos.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
                        <div className="flex items-center justify-between">
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
                              className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-purple-700 text-white hover:bg-purple-600 transition-colors"
                            >
                              <Sparkles size={14} />
                              <span className="text-sm">AiID</span>
                            </button>
                            <button
                              onClick={() => handleLike(photo.id)}
                              disabled={photo.is_liked}
                              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md transition-colors ${
                                photo.is_liked
                                  ? 'bg-emerald-800/50 text-emerald-300 cursor-not-allowed'
                                  : 'bg-emerald-700 text-white hover:bg-emerald-600'
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
      )}

      {/* Upload Dialog */}
      {showUploadDialog && (
        <PhotoUploadDialog
          onClose={() => setShowUploadDialog(false)}
          onSuccess={handleUploadSuccess}
        />
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


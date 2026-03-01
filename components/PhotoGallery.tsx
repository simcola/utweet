'use client';

import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Photo } from '@/lib/types';
import { Heart, Upload, Grid, X, Image as ImageIcon, Sparkles } from 'lucide-react';
import PhotoUploadDialog from './PhotoUploadDialog';
import GrokDialog from './GrokDialog';

export default function PhotoGallery() {
  const [mounted, setMounted] = useState(false);
  const [photoOfMonth, setPhotoOfMonth] = useState<Photo | null>(null);
  const [galleryPhotos, setGalleryPhotos] = useState<Photo[]>([]);
  const [showGallery, setShowGallery] = useState(false);
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [showGrokDialog, setShowGrokDialog] = useState(false);
  const [selectedPhotoForGrok, setSelectedPhotoForGrok] = useState<Photo | null>(null);
  const [loading, setLoading] = useState(true);
  const [clearingAi, setClearingAi] = useState(false);
  const galleryDialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Close on Escape key only (no body scroll lock - was breaking page scroll)
  useEffect(() => {
    if (!showGallery) return;
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setShowGallery(false);
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
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

  const fetchGalleryPhotos = async (all = false) => {
    try {
      const url = all ? '/api/photos?all=1' : '/api/photos';
      const response = await fetch(url);
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
      await Promise.all([fetchPhotoOfMonth(), fetchGalleryPhotos(true)]);
      setLoading(false);
    };
    loadData();
  }, []);

  const handleLike = async (photoId: number) => {
    // Optimistic update so UI responds immediately
    if (photoOfMonth?.id === photoId) {
      setPhotoOfMonth((prev) =>
        prev ? { ...prev, likes: prev.likes + 1, is_liked: true } : null
      );
    }
    setGalleryPhotos((prev) =>
      prev.map((p) =>
        p.id === photoId ? { ...p, likes: p.likes + 1, is_liked: true } : p
      )
    );

    try {
      const response = await fetch(`/api/photos/${photoId}/like`, {
        method: 'POST',
      });

      if (response.ok) {
        // Refetch to stay in sync (and get correct photo of month if it changed)
        await Promise.all([fetchPhotoOfMonth(), fetchGalleryPhotos(true)]);
      } else {
        // Revert optimistic update on failure
        await Promise.all([fetchPhotoOfMonth(), fetchGalleryPhotos(true)]);
      }
    } catch (error) {
      console.error('Error liking photo:', error);
      await Promise.all([fetchPhotoOfMonth(), fetchGalleryPhotos(true)]);
    }
  };

  const handleUploadSuccess = () => {
    setShowUploadDialog(false);
    // Refresh gallery after upload
    fetchGalleryPhotos(true);
  };

  const handleGrokClick = (photo: Photo) => {
    setSelectedPhotoForGrok(photo);
    setShowGrokDialog(true);
  };

  const handleClearAiData = async () => {
    if (!confirm('Clear all AiID results? You can run AiID again on each photo after this.')) return;
    setClearingAi(true);
    try {
      const res = await fetch('/api/photos/clear-ai', { method: 'POST' });
      const data = await res.json();
      if (res.ok) {
        alert(data.message || `Cleared AI data for ${data.cleared} photo(s).`);
        await Promise.all([fetchPhotoOfMonth(), fetchGalleryPhotos(true)]);
      } else {
        alert(data.error || 'Failed to clear AI data');
      }
    } catch (e) {
      alert('Failed to clear AI data');
    } finally {
      setClearingAi(false);
    }
  };

  const openGallery = () => {
    setShowGallery(true);
  };

  return (
    <>
      <div className="bg-emerald-900/30 backdrop-blur-md rounded-lg border border-emerald-500/20 p-4 space-y-4">
        <button
          type="button"
          onClick={openGallery}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-emerald-600 text-white rounded-md hover:bg-emerald-700 active:bg-emerald-800 transition-colors touch-manipulation font-semibold"
        >
          <Grid size={20} />
          <span>Photo Gallery</span>
        </button>

        {/* Photo of the Month - visible under the button */}
        <div>
          <h3 className="text-sm font-medium text-emerald-200 mb-2">Photo of the Month</h3>
          {loading ? (
            <div className="bg-emerald-950/40 rounded-lg border border-emerald-500/20 p-8 text-center">
              <span className="text-emerald-200/70 text-sm">Loading...</span>
            </div>
          ) : photoOfMonth ? (
            <div className="bg-emerald-950/40 rounded-lg overflow-hidden border border-emerald-500/20">
              <div className="relative w-full flex justify-center bg-emerald-950/60">
                <img
                  src={photoOfMonth.image_url}
                  alt={`Photo by ${photoOfMonth.username}`}
                  className="object-contain"
                  style={{ maxWidth: 250, maxHeight: 200 }}
                />
              </div>
              <div className="p-2 sm:p-3 space-y-2">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <p className="text-sm text-emerald-200 font-medium">{photoOfMonth.username}</p>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); handleGrokClick(photoOfMonth); }}
                      className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-purple-700 text-white border border-purple-600 hover:bg-purple-600 active:bg-purple-800 transition-colors touch-manipulation text-sm"
                    >
                      <Sparkles size={14} />
                      AiID
                    </button>
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); handleLike(photoOfMonth.id); }}
                      disabled={photoOfMonth.is_liked}
                      className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md transition-colors touch-manipulation text-sm border ${
                        photoOfMonth.is_liked
                          ? 'bg-emerald-800 text-emerald-100 border-emerald-600 cursor-not-allowed'
                          : 'bg-emerald-700 text-white border-emerald-600 hover:bg-emerald-600 active:bg-emerald-800'
                      }`}
                    >
                      <Heart size={14} fill={photoOfMonth.is_liked ? 'currentColor' : 'none'} />
                      {photoOfMonth.likes}
                    </button>
                  </div>
                </div>
                {photoOfMonth.location && (
                  <p className="text-xs text-emerald-300/70">{photoOfMonth.location}</p>
                )}
                {photoOfMonth.species && (
                  <p className="text-xs text-emerald-400 font-semibold">Species: {photoOfMonth.species}</p>
                )}
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); setShowUploadDialog(true); }}
                  className="w-full flex items-center justify-center gap-2 px-3 py-2 mt-1 bg-emerald-600 text-white rounded-md hover:bg-emerald-700 active:bg-emerald-800 transition-colors touch-manipulation text-sm font-medium"
                >
                  <Upload size={16} />
                  Upload your photo
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-emerald-950/40 rounded-lg border border-emerald-500/20 p-6 text-center space-y-3">
              <ImageIcon className="mx-auto text-emerald-500/50" size={32} />
              <p className="text-emerald-200/70 text-sm">No photo of the month yet</p>
              <button
                type="button"
                onClick={() => setShowUploadDialog(true)}
                className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700 active:bg-emerald-800 transition-colors touch-manipulation text-sm font-medium"
              >
                <Upload size={16} />
                Upload your photo
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Gallery popup modal - portal to body, solid background (same pattern as upload dialog) */}
      {mounted && showGallery && document.body && createPortal(
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="gallery-title"
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 99999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'rgb(2, 44, 34)', /* emerald-950 solid */
            padding: '1rem',
            overflow: 'hidden',
          }}
          onClick={handleBackdropClick}
          onTouchStart={(e) => {
            if (e.target === e.currentTarget) setShowGallery(false);
          }}
        >
          <div
            ref={galleryDialogRef}
            className="bg-emerald-900 rounded-lg border border-emerald-500/20 max-w-6xl w-full shadow-2xl flex flex-col min-h-0"
            style={{
              maxHeight: '95vh',
              overflowY: 'auto',
              WebkitOverflowScrolling: 'touch',
            }}
            onClick={(e) => e.stopPropagation()}
            onTouchStart={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="sticky top-0 bg-emerald-900 border-b border-emerald-500/20 p-4 sm:p-6 flex items-center justify-between z-10">
              <h2 id="gallery-title" className="text-xl sm:text-2xl font-semibold text-white">Photo Gallery</h2>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); handleClearAiData(); }}
                  disabled={clearingAi}
                  className="flex items-center gap-1.5 px-2.5 py-2 bg-amber-700 text-white rounded-md hover:bg-amber-600 active:bg-amber-800 disabled:opacity-60 transition-colors touch-manipulation text-sm"
                  title="Clear all AiID results so you can run identification again on each photo"
                >
                  {clearingAi ? 'Clearing…' : 'Reset AiID'}
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowUploadDialog(true);
                  }}
                  className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700 active:bg-emerald-800 transition-colors touch-manipulation text-sm sm:text-base"
                >
                  <Upload size={18} />
                  <span className="hidden sm:inline">Upload Photo</span>
                  <span className="sm:hidden">Upload</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowGallery(false)}
                  className="rounded-md p-2 -mr-2 touch-manipulation bg-emerald-800/90 text-emerald-100 hover:bg-emerald-700 hover:text-white transition-colors border border-emerald-600/50"
                  aria-label="Close gallery"
                >
                  <X size={24} />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="p-4 sm:p-6">
              {/* Gallery Grid */}
              <div>
                <h3 className="text-lg font-medium text-emerald-200 mb-4">All Photos</h3>
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
                        <div className="relative w-full flex justify-center bg-emerald-950/60 p-2">
                          <img
                            src={photo.image_url}
                            alt={`Photo by ${photo.username}`}
                            className="object-contain"
                            style={{ maxWidth: 250, maxHeight: 200 }}
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
                                className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-purple-700 text-white border border-purple-600 hover:bg-purple-600 active:bg-purple-800 transition-colors touch-manipulation"
                              >
                                <Sparkles size={14} />
                                <span className="text-sm">AiID</span>
                              </button>
                              <button
                                onClick={() => handleLike(photo.id)}
                                disabled={photo.is_liked}
                                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md transition-colors touch-manipulation border ${
                                  photo.is_liked
                                    ? 'bg-emerald-800 text-emerald-100 border-emerald-600 cursor-not-allowed'
                                    : 'bg-emerald-700 text-white border-emerald-600 hover:bg-emerald-600 active:bg-emerald-800'
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
        </div>,
        document.body
      )}

      {/* Upload dialog as popup overlay - portal to body only after client mount */}
      {mounted && showUploadDialog && document.body && createPortal(
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="upload-photo-title"
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 100000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'rgb(0,0,0)',
            padding: '1rem',
          }}
        >
          <PhotoUploadDialog
            onClose={() => setShowUploadDialog(false)}
            onSuccess={handleUploadSuccess}
          />
        </div>,
        document.body
      )}

      {/* Grok Dialog - portaled in a single wrapper so it always stacks above gallery (z 99999) */}
      {mounted && showGrokDialog && selectedPhotoForGrok && typeof document !== 'undefined' && document.body && createPortal(
        <div
          role="dialog"
          aria-modal="true"
          aria-label="AiID Bird Identification"
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 2147483647,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            pointerEvents: 'auto',
          }}
        >
          <GrokDialog
            isOpen={showGrokDialog}
            onClose={() => {
              setShowGrokDialog(false);
              setSelectedPhotoForGrok(null);
            }}
            imageUrl={selectedPhotoForGrok.image_url}
            photoId={selectedPhotoForGrok.id}
            onIdentificationComplete={(id, species) => {
              setPhotoOfMonth((prev) =>
                prev?.id === id ? { ...prev, species: species ?? prev.species } : prev
              );
              setGalleryPhotos((prev) =>
                prev.map((p) => (p.id === id ? { ...p, species: species ?? p.species } : p))
              );
            }}
          />
        </div>,
        document.body
      )}
    </>
  );
}


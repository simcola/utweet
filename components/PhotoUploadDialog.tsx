'use client';

import { useState, useRef, useEffect } from 'react';
import { X, Upload, Image as ImageIcon } from 'lucide-react';

interface PhotoUploadDialogProps {
  onClose: () => void;
  onSuccess: () => void;
}

export default function PhotoUploadDialog({ onClose, onSuccess }: PhotoUploadDialogProps) {
  const dialogRef = useRef<HTMLDivElement>(null);

  // Close on Escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    document.addEventListener('keydown', handleEscape);
    // Prevent body scroll when modal is open
    document.body.style.overflow = 'hidden';
    
    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [onClose]);

  // Close when clicking outside the dialog
  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [location, setLocation] = useState('');
  const [species, setSpecies] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (!selectedFile.type.startsWith('image/')) {
        setError('Please select an image file');
        return;
      }
      if (selectedFile.size > 10 * 1024 * 1024) {
        setError('File size must be less than 10MB');
        return;
      }
      setFile(selectedFile);
      setError('');
      
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(selectedFile);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!file || !username || !email) {
      setError('Please fill in all required fields');
      return;
    }

    setUploading(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('username', username);
      formData.append('email', email);
      formData.append('location', location);
      formData.append('species', species);

      const response = await fetch('/api/photos', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        onSuccess();
        // Reset form
        setUsername('');
        setEmail('');
        setLocation('');
        setSpecies('');
        setFile(null);
        setPreview(null);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to upload photo');
      }
    } catch (error) {
      console.error('Error uploading photo:', error);
      setError('Failed to upload photo. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-2 sm:p-4"
      onClick={handleBackdropClick}
      onTouchStart={(e) => {
        // Handle touch events for mobile
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div 
        ref={dialogRef}
        className="bg-emerald-900/95 backdrop-blur-md rounded-lg border border-emerald-500/20 max-w-2xl w-full max-h-[95vh] sm:max-h-[90vh] overflow-y-auto shadow-2xl"
        onClick={(e) => e.stopPropagation()}
        onTouchStart={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-emerald-500/20 sticky top-0 bg-emerald-900/95 backdrop-blur-md z-10">
          <h2 className="text-xl sm:text-2xl font-semibold text-white">Upload Photo</h2>
          <button
            onClick={onClose}
            className="text-emerald-200 hover:text-white transition-colors p-2 -mr-2 touch-manipulation"
            aria-label="Close dialog"
          >
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4">
          {error && (
            <div className="bg-red-500/20 border border-red-500/50 text-red-200 px-4 py-3 rounded-md text-sm">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-emerald-200 mb-2">
              Username *
            </label>
            <input
              type="text"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-3 sm:py-2 bg-emerald-950/50 border border-emerald-500/30 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-emerald-400 text-base sm:text-sm"
              placeholder="Enter your username"
              autoComplete="username"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-emerald-200 mb-2">
              Email *
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 sm:py-2 bg-emerald-950/50 border border-emerald-500/30 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-emerald-400 text-base sm:text-sm"
              placeholder="Enter your email"
              autoComplete="email"
              inputMode="email"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-emerald-200 mb-2">
              Location
            </label>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="w-full px-4 py-3 sm:py-2 bg-emerald-950/50 border border-emerald-500/30 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-emerald-400 text-base sm:text-sm"
              placeholder="Where was this photo taken? (optional)"
              autoComplete="off"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-emerald-200 mb-2">
              Species
            </label>
            <input
              type="text"
              value={species}
              onChange={(e) => setSpecies(e.target.value)}
              className="w-full px-4 py-3 sm:py-2 bg-emerald-950/50 border border-emerald-500/30 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-emerald-400 text-base sm:text-sm"
              placeholder="Bird species (optional - can be identified by AI)"
              autoComplete="off"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-emerald-200 mb-2">
              Photo *
            </label>
            <div className="space-y-2">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
                id="photo-upload"
              />
              <label
                htmlFor="photo-upload"
                className="flex items-center justify-center w-full px-4 py-8 sm:py-8 bg-emerald-950/50 border-2 border-dashed border-emerald-500/30 rounded-md cursor-pointer hover:border-emerald-500/50 active:border-emerald-500/70 transition-colors touch-manipulation"
              >
                {preview ? (
                  <div className="relative w-full">
                    <img
                      src={preview}
                      alt="Preview"
                      className="max-h-64 mx-auto rounded-md"
                    />
                  </div>
                ) : (
                  <div className="text-center">
                    <Upload className="mx-auto text-emerald-400 mb-2" size={32} />
                    <p className="text-emerald-200 text-sm">Tap to select a photo</p>
                    <p className="text-emerald-300/70 text-xs mt-1 hidden sm:block">or drag and drop</p>
                    <p className="text-emerald-300/50 text-xs mt-2">Max file size: 10MB</p>
                  </div>
                )}
              </label>
              {file && (
                <p className="text-xs text-emerald-300/70">
                  Selected: {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
                </p>
              )}
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-4">
            <button
              type="submit"
              disabled={uploading}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 sm:py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700 active:bg-emerald-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation text-base sm:text-sm font-semibold"
            >
              {uploading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Uploading...
                </>
              ) : (
                <>
                  <Upload size={18} />
                  Upload Photo
                </>
              )}
            </button>
            <button
              type="button"
              onClick={onClose}
              disabled={uploading}
              className="px-4 py-3 sm:py-2 bg-emerald-800/50 text-emerald-200 rounded-md hover:bg-emerald-800/70 active:bg-emerald-800/90 transition-colors disabled:opacity-50 touch-manipulation text-base sm:text-sm font-semibold"
            >
              Cancel
            </button>
          </div>

          <p className="text-xs text-emerald-300/50 text-center mt-4">
            Your photo will be reviewed before being published to the gallery.
          </p>
        </form>
      </div>
    </div>
  );
}





'use client';

import { useState, useRef, useEffect } from 'react';
import { X, Upload, Image as ImageIcon } from 'lucide-react';

interface PhotoUploadDialogProps {
  onClose: () => void;
  onSuccess: () => void;
}

export default function PhotoUploadDialog({ onClose, onSuccess }: PhotoUploadDialogProps) {
  const dialogRef = useRef<HTMLDivElement>(null);

  // Close on Escape key (no body scroll lock - keeps page scroll working)
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
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
  const [compressing, setCompressing] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Compress image so request body stays under 1MB (avoids 413 on Amplify/Lambda)
  const compressImage = (sourceFile: File, options?: { maxDim?: number; quality?: number }): Promise<File> => {
    const maxDim = options?.maxDim ?? 1200;
    const quality = options?.quality ?? 0.72;
    return new Promise((resolve, reject) => {
      const img = new Image();
      const url = URL.createObjectURL(sourceFile);
      img.onload = () => {
        URL.revokeObjectURL(url);
        let { width, height } = img;
        if (width > maxDim || height > maxDim) {
          if (width >= height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(sourceFile);
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              resolve(sourceFile);
              return;
            }
            const name = sourceFile.name.replace(/\.[^.]+$/, '.jpg');
            resolve(new File([blob], name, { type: 'image/jpeg' }));
          },
          'image/jpeg',
          quality
        );
      };
      img.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error('Failed to load image'));
      };
      img.src = url;
    });
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;
    if (!selectedFile.type.startsWith('image/')) {
      setError('Please select an image file');
      return;
    }
    if (selectedFile.size > 10 * 1024 * 1024) {
      setError('File size must be less than 10MB');
      return;
    }
    setError('');
    // Keep under 500KB so upload + FormData overhead stays under 1MB (avoids 413 on Amplify)
    const targetMaxBytes = 500 * 1024;
    if (selectedFile.size > targetMaxBytes) {
      setCompressing(true);
      try {
        let compressed = await compressImage(selectedFile);
        if (compressed.size > targetMaxBytes) {
          compressed = await compressImage(compressed, { maxDim: 900, quality: 0.58 });
        }
        if (compressed.size > targetMaxBytes) {
          setError('Image is too large for upload. Please choose a smaller photo (e.g. under 2MB).');
          return;
        }
        setFile(compressed);
        const reader = new FileReader();
        reader.onloadend = () => setPreview(reader.result as string);
        reader.readAsDataURL(compressed);
      } catch {
        setFile(selectedFile);
        const reader = new FileReader();
        reader.onloadend = () => setPreview(reader.result as string);
        reader.readAsDataURL(selectedFile);
      } finally {
        setCompressing(false);
      }
    } else {
      setFile(selectedFile);
      const reader = new FileReader();
      reader.onloadend = () => setPreview(reader.result as string);
      reader.readAsDataURL(selectedFile);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!file) {
      setError('Please select a photo to upload');
      return;
    }

    setUploading(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('username', username.trim() || '');
      formData.append('email', email.trim() || '');
      formData.append('location', location);
      formData.append('species', species);

      console.log('Uploading photo...', { username, email, fileSize: file.size, fileName: file.name });

      const response = await fetch('/api/photos', {
        method: 'POST',
        body: formData,
      });

      console.log('Upload response status:', response.status, response.statusText);

      if (response.ok) {
        const data = await response.json();
        console.log('Photo uploaded successfully:', data);
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
        const errorText = await response.text();
        let errorData;
        try {
          errorData = JSON.parse(errorText);
        } catch {
          errorData = { error: errorText || `Upload failed with status ${response.status}` };
        }
        console.error('Upload failed:', response.status, errorData);
        const msg = errorData.error || errorData.message || `Failed to upload photo (${response.status})`;
        setError(errorData.hint ? `${msg}. ${errorData.hint}` : msg);
      }
    } catch (error: any) {
      console.error('Error uploading photo:', error);
      setError(error.message || 'Failed to upload photo. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-black z-[60] flex items-center justify-center p-2 sm:p-4"
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
        className="bg-emerald-900 rounded-lg border border-emerald-500/30 max-w-2xl w-full max-h-[95vh] sm:max-h-[90vh] overflow-y-auto shadow-2xl"
        onClick={(e) => e.stopPropagation()}
        onTouchStart={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-emerald-500/30 sticky top-0 bg-emerald-900 z-10">
          <h2 className="text-xl sm:text-2xl font-semibold text-white">Upload Photo</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-2 -mr-2 touch-manipulation bg-emerald-800 text-emerald-100 hover:bg-emerald-700 hover:text-white transition-colors border border-emerald-600/50"
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
              Username
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-3 sm:py-2 bg-emerald-950 border border-emerald-500/30 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-emerald-400 text-base sm:text-sm"
              placeholder="Username (optional)"
              autoComplete="username"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-emerald-200 mb-2">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 sm:py-2 bg-emerald-950 border border-emerald-500/30 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-emerald-400 text-base sm:text-sm"
              placeholder="Email (optional)"
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
              className="w-full px-4 py-3 sm:py-2 bg-emerald-950 border border-emerald-500/30 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-emerald-400 text-base sm:text-sm"
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
              className="w-full px-4 py-3 sm:py-2 bg-emerald-950 border border-emerald-500/30 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-emerald-400 text-base sm:text-sm"
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
                className="flex items-center justify-center w-full px-4 py-8 sm:py-8 bg-emerald-950 border-2 border-dashed border-emerald-500/30 rounded-md cursor-pointer hover:border-emerald-500/50 active:border-emerald-500/70 transition-colors touch-manipulation"
              >
                {preview ? (
                  <div className="relative w-full flex justify-center">
                    <img
                      src={preview}
                      alt="Preview"
                      className="object-contain rounded-md"
                      style={{ maxWidth: 250, maxHeight: 200 }}
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
              {compressing && (
                <p className="text-xs text-emerald-400 mt-1">Compressing image for upload...</p>
              )}
              {file && !compressing && (
                <p className="text-xs text-emerald-300/70">
                  Selected: {file.name} ({file.size >= 1024 * 1024 ? `${(file.size / 1024 / 1024).toFixed(2)} MB` : `${(file.size / 1024).toFixed(0)} KB`})
                </p>
              )}
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-4">
            <button
              type="submit"
              disabled={uploading}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 sm:py-2 rounded-md bg-emerald-600 text-white border border-emerald-500 hover:bg-emerald-700 active:bg-emerald-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation text-base sm:text-sm font-semibold"
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
              className="px-4 py-3 sm:py-2 rounded-md touch-manipulation text-base sm:text-sm font-semibold bg-emerald-800 text-emerald-50 border border-emerald-600 hover:bg-emerald-700 hover:text-white active:bg-emerald-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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





import React, { useState, useRef, useEffect } from 'react';
import { Event, EventSegment } from '../../../types/event';
import Modal from '../../../components/Modal';

interface SlideShowProps {
  event: Event;
  isOpen: boolean;
  onClose: () => void;
  onSave: (segment: EventSegment) => void;
  initialSegment?: EventSegment; // Add support for editing mode
}

const SlideShow: React.FC<SlideShowProps> = ({
  isOpen,
  onClose,
  onSave,
  initialSegment
}) => {
  const [photos, setPhotos] = useState<File[]>([]);
  const [photoUrls, setPhotoUrls] = useState<string[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load existing photos when editing
  useEffect(() => {
    if (initialSegment && initialSegment.content && initialSegment.title === 'Slide Show') {
      try {
        const contentData = JSON.parse(initialSegment.content);
        if (contentData.photoUrls && Array.isArray(contentData.photoUrls)) {
          setPhotoUrls(contentData.photoUrls);
          console.log('Loaded', contentData.photoUrls.length, 'existing photos');
        }
      } catch (error) {
        console.error('Error parsing slide show content:', error);
      }
    }
  }, [initialSegment]);

  // Convert file to base64 data URL
  const fileToDataUrl = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleFileSelect = async (files: FileList | null) => {
    if (!files) return;

    setIsLoading(true);
    try {
      const newPhotos: File[] = [];
      const newUrls: string[] = [];

      for (const file of Array.from(files)) {
        if (file.type.startsWith('image/')) {
          newPhotos.push(file);
          // Convert to base64 data URL instead of blob URL
          const dataUrl = await fileToDataUrl(file);
          newUrls.push(dataUrl);
        }
      }

      setPhotos(prev => [...prev, ...newPhotos]);
      setPhotoUrls(prev => [...prev, ...newUrls]);
    } catch (error) {
      console.error('Error processing images:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFileSelect(e.dataTransfer.files);
  };

  const removePhoto = (index: number) => {
    setPhotos(prev => prev.filter((_, i) => i !== index));
    setPhotoUrls(prev => prev.filter((_, i) => i !== index));
  };

  const handleSave = () => {
    if (photoUrls.length === 0) return;

    // Create a segment with photo data URLs
    const segment: EventSegment = {
      id: Date.now().toString(),
      title: 'Slide Show',
      type: 'activity',
      description: `${photoUrls.length} photos in slideshow`,
      duration: photoUrls.length * 3, // 3 seconds per photo
      content: JSON.stringify({
        photoUrls: photoUrls, // Store the base64 data URLs
        photos: photos.map(file => ({
          name: file.name,
          size: file.size,
          type: file.type
        }))
      }),
      order: 0,
      isCustom: true,
    };

    onSave(segment);
  };

  const handleClose = () => {
    setPhotos([]);
    setPhotoUrls([]);
    onClose();
  };

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={handleClose} 
      title="Create Slide Show" 
      maxWidth="max-w-2xl"
      onSave={handleSave}
      saveDisabled={photoUrls.length === 0 || isLoading}
      showSaveHint={true}
    >
      <div className="space-y-6">
        {/* Upload Area */}
        <div
          className={`border-2 border-dashed rounded-xl p-8 text-center transition-all duration-300 ${
            isDragging
              ? 'border-dark-royalty bg-dark-royalty/5'
              : 'border-deep-sea/30 hover:border-deep-sea/50'
          }`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <div className="text-4xl mb-4">📸</div>
          <h3 className="text-lg font-semibold text-dark-royalty mb-2">
            {initialSegment ? 'Re-upload Photos for Slideshow' : 'Upload Photos for Slideshow'}
          </h3>
          {initialSegment && (
            <p className="text-deep-sea/70 mb-4">
              Please re-upload the photos for this slideshow
            </p>
          )}
          <p className="text-deep-sea/70 mb-4">
            Drag and drop photos here, or click to browse
          </p>
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isLoading}
            className={`px-6 py-3 bg-dark-royalty text-white rounded-xl hover:bg-dark-royalty/90 transition-all duration-300 font-medium ${
              isLoading ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            {isLoading ? 'Processing...' : 'Choose Photos'}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*"
            onChange={(e) => handleFileSelect(e.target.files)}
            className="hidden"
          />
        </div>

        {/* Photo Preview */}
        {photoUrls.length > 0 && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-dark-royalty">
              Photos ({photoUrls.length})
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 max-h-64 overflow-y-auto">
              {photoUrls.map((url, index) => (
                <div key={index} className="relative group">
                  <img
                    src={url}
                    alt={`Photo ${index + 1}`}
                    className="w-full h-24 object-cover rounded-lg border border-deep-sea/20"
                    loading="lazy"
                  />
                  <button
                    onClick={() => removePhoto(index)}
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
            <p className="text-sm text-deep-sea/60">
              Each photo will be shown for 3 seconds in the slideshow
            </p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex justify-end space-x-4 pt-4">
          <button
            onClick={handleClose}
            className="px-6 py-3 bg-white/50 text-dark-royalty rounded-xl hover:bg-white/70 transition-all duration-300 font-medium border border-dark-royalty/20"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={photoUrls.length === 0 || isLoading}
            className={`px-6 py-3 rounded-xl transition-all duration-300 font-medium ${
              photoUrls.length === 0 || isLoading
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-dark-royalty text-white hover:bg-dark-royalty/90'
            }`}
          >
            {initialSegment ? 'Update Slide Show' : 'Create Slide Show'}
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default SlideShow; 
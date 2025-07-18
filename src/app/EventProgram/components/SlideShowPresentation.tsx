import React, { useState, useEffect, useRef, useCallback } from 'react';

interface SlideShowPresentationProps {
  photoUrls: string[];
}

const SlideShowPresentation: React.FC<SlideShowPresentationProps> = ({
  photoUrls
}) => {
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [showControls, setShowControls] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Auto-advance slides every 3 seconds
  useEffect(() => {
    if (photoUrls.length <= 1) return;

    intervalRef.current = setInterval(() => {
      setCurrentPhotoIndex(prev => {
        if (prev >= photoUrls.length - 1) {
          return 0; // Loop back to first photo
        }
        return prev + 1;
      });
    }, 3000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [photoUrls.length]);

  // Handle manual navigation
  const goToNext = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    
    setIsTransitioning(true);
    setTimeout(() => {
      setCurrentPhotoIndex(prev => {
        if (prev >= photoUrls.length - 1) {
          return 0; // Loop back to first photo
        }
        return prev + 1;
      });
      setIsTransitioning(false);
    }, 300);

    // Restart auto-advance
    intervalRef.current = setInterval(() => {
      setCurrentPhotoIndex(prev => {
        if (prev >= photoUrls.length - 1) {
          return 0;
        }
        return prev + 1;
      });
    }, 3000);
  }, [photoUrls.length]);

  const goToPrevious = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    
    setIsTransitioning(true);
    setTimeout(() => {
      setCurrentPhotoIndex(prev => {
        if (prev <= 0) {
          return photoUrls.length - 1; // Loop to last photo
        }
        return prev - 1;
      });
      setIsTransitioning(false);
    }, 300);

    // Restart auto-advance
    intervalRef.current = setInterval(() => {
      setCurrentPhotoIndex(prev => {
        if (prev >= photoUrls.length - 1) {
          return 0;
        }
        return prev + 1;
      });
    }, 3000);
  }, [photoUrls.length]);

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        goToPrevious();
      } else if (e.key === 'ArrowRight' || e.key === ' ') {
        e.preventDefault();
        goToNext();
      }
    };

    document.addEventListener('keydown', handleKeyPress);
    return () => document.removeEventListener('keydown', handleKeyPress);
  }, [goToNext, goToPrevious]);

  if (photoUrls.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-6xl mb-4">📸</div>
        <h2 className="text-2xl font-bold text-dark-royalty mb-2">No Photos Available</h2>
        <p className="text-deep-sea/70">Please add photos to the slideshow</p>
      </div>
    );
  }

  return (
    <div 
      className="fixed inset-0 bg-black flex items-center justify-center"
      onMouseEnter={() => setShowControls(true)}
      onMouseLeave={() => setShowControls(false)}
    >
      {/* Full-screen Photo Display */}
      <div className="relative w-full h-full flex items-center justify-center">
        <img
          src={photoUrls[currentPhotoIndex]}
          alt={`Slide ${currentPhotoIndex + 1}`}
          className={`max-w-full max-h-full object-contain transition-opacity duration-300 ${
            isTransitioning ? 'opacity-50' : 'opacity-100'
          }`}
          loading="lazy"
        />
        
        {/* Navigation Overlay - Always visible but subtle */}
        <div className={`absolute inset-0 flex items-center justify-between p-8 transition-opacity duration-300 ${
          showControls ? 'opacity-100' : 'opacity-0'
        }`}>
          <button
            onClick={goToPrevious}
            className="bg-black/50 text-white rounded-full p-4 hover:bg-black/70 transition-all duration-300 backdrop-blur-sm"
          >
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M15 18l-6-6 6-6"/>
            </svg>
          </button>
          <button
            onClick={goToNext}
            className="bg-black/50 text-white rounded-full p-4 hover:bg-black/70 transition-all duration-300 backdrop-blur-sm"
          >
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 18l6-6-6-6"/>
            </svg>
          </button>
        </div>

        {/* Photo Counter - Top right */}
        <div className={`absolute top-8 right-8 bg-black/50 text-white px-4 py-2 rounded-xl backdrop-blur-sm transition-opacity duration-300 ${
          showControls ? 'opacity-100' : 'opacity-0'
        }`}>
          <p className="text-lg font-semibold">
            {currentPhotoIndex + 1} / {photoUrls.length}
          </p>
        </div>

        {/* Auto-advance indicator - Bottom center */}
        <div className={`absolute bottom-8 left-1/2 transform -translate-x-1/2 bg-black/50 text-white px-4 py-2 rounded-xl backdrop-blur-sm transition-opacity duration-300 ${
          showControls ? 'opacity-100' : 'opacity-0'
        }`}>
          <p className="text-sm">
            Auto-advancing every 3 seconds • Use arrow keys to navigate
          </p>
        </div>

        {/* Photo Thumbnails - Bottom */}
        {photoUrls.length > 1 && (
          <div className={`absolute bottom-20 left-1/2 transform -translate-x-1/2 transition-opacity duration-300 ${
            showControls ? 'opacity-100' : 'opacity-0'
          }`}>
            <div className="flex space-x-2 bg-black/50 backdrop-blur-sm p-2 rounded-xl">
              {photoUrls.map((url, index) => (
                <button
                  key={index}
                  onClick={() => {
                    if (intervalRef.current) {
                      clearInterval(intervalRef.current);
                    }
                    setCurrentPhotoIndex(index);
                    
                    // Restart auto-advance
                    intervalRef.current = setInterval(() => {
                      setCurrentPhotoIndex(prev => {
                        if (prev >= photoUrls.length - 1) {
                          return 0;
                        }
                        return prev + 1;
                      });
                    }, 3000);
                  }}
                  className={`flex-shrink-0 w-12 h-12 rounded-lg overflow-hidden border-2 transition-all duration-300 ${
                    index === currentPhotoIndex
                      ? 'border-white'
                      : 'border-transparent hover:border-white/50'
                  }`}
                >
                  <img
                    src={url}
                    alt={`Thumbnail ${index + 1}`}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SlideShowPresentation; 
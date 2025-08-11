import React, { useState, useRef, useEffect } from "react";
import Image from "next/image";
import { Event as TMEvent, EventSegment } from "../../../types/event";
import Modal from "../../../components/Modal";
import { imageService } from "../../../services/imageService";

interface SlideShowProps {
  event: TMEvent;
  isOpen: boolean;
  onClose: () => void;
  onSave: (segment: EventSegment) => void;
  initialSegment?: EventSegment; // Add support for editing mode
}

const SlideShow: React.FC<SlideShowProps> = ({
  event,
  isOpen,
  onClose,
  onSave,
  initialSegment,
}) => {
  const [photos, setPhotos] = useState<File[]>([]);
  const [photoUrls, setPhotoUrls] = useState<string[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load existing photos when editing
  useEffect(() => {
    if (
      initialSegment &&
      initialSegment.content &&
      initialSegment.title === "Slide Show"
    ) {
      try {
        const contentData = JSON.parse(initialSegment.content);
        if (contentData.photoUrls && Array.isArray(contentData.photoUrls)) {
          setPhotoUrls(contentData.photoUrls);
          console.log(
            "Loaded",
            contentData.photoUrls.length,
            "existing photos",
          );
        }
      } catch (error) {
        console.error("Error parsing slide show content:", error);
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
        if (file.type.startsWith("image/")) {
          newPhotos.push(file);
          // Convert to base64 data URL instead of blob URL
          const dataUrl = await fileToDataUrl(file);
          newUrls.push(dataUrl);
        }
      }

      setPhotos((prev) => [...prev, ...newPhotos]);
      setPhotoUrls((prev) => [...prev, ...newUrls]);
    } catch (error) {
      console.error("Error processing images:", error);
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
    setPhotos((prev) => prev.filter((_, i) => i !== index));
    setPhotoUrls((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    if (photos.length === 0 && photoUrls.length === 0) return;

    setIsLoading(true);
    try {
      // First try to upload to server storage for best performance
      const uploadedUrls: string[] = [];

      for (let i = 0; i < photos.length; i++) {
        const originalFile = photos[i];

        try {
          // Try server-side upload with original file first (best quality)
          const ext = originalFile.name?.split(".").pop() || "jpg";
          const path = `slideshow-images/${event.id}/${Date.now()}_${i}.${ext}`;
          const form = new FormData();
          form.append("file", originalFile);
          form.append("path", path);

          let url: string | null = null;
          let uploadError: string | null = null;

          try {
            const res = await fetch("/api/upload", {
              method: "POST",
              body: form,
            });
            if (res.ok) {
              const data = (await res.json()) as { url: string };
              url = data.url;
              console.log("✅ Uploaded to cloud storage:", originalFile.name);
            } else {
              const errorData = await res.json();
              uploadError = errorData.error || "Unknown server error";
            }
          } catch (e) {
            uploadError = e instanceof Error ? e.message : "Network error";
          }

          if (url) {
            uploadedUrls.push(url);
          } else {
            // If server upload fails, compress and use base64 as fallback
            console.warn(
              `⚠️ Cloud upload failed for ${originalFile.name}: ${uploadError}`,
            );
            console.log("📦 Compressing image for local storage fallback...");

            const compressed = await imageService.compressImage(
              originalFile,
              1200,
              800,
              0.85,
            );
            const compressedDataUrl = await fileToDataUrl(compressed);
            uploadedUrls.push(compressedDataUrl);
          }
        } catch (e) {
          console.error("Failed to process slideshow image", e);
        }
      }

      // Use existing URLs if we're editing and no new photos were added
      const finalUrls = uploadedUrls.length > 0 ? uploadedUrls : photoUrls;

      // Create a segment with HTTPS URLs only (no base64)
      const segment: EventSegment = {
        id: initialSegment?.id || Date.now().toString(),
        title: "Slide Show",
        type: "activity",
        description: `${finalUrls.length} photos in slideshow`,
        duration: finalUrls.length * 3, // 3 seconds per photo
        content: JSON.stringify({
          photoUrls: finalUrls,
          photos: photos.map((file) => ({
            name: file.name,
            size: file.size,
            type: file.type,
          })),
        }),
        order: initialSegment?.order ?? 0,
        isCustom: true,
      };

      onSave(segment);
    } finally {
      setIsLoading(false);
    }
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
      saveDisabled={
        (photos.length === 0 && photoUrls.length === 0) || isLoading
      }
      showSaveHint={true}
    >
      <div className="space-y-6">
        {/* Upload Area */}
        <div
          className={`border-2 border-dashed rounded-xl p-8 text-center transition-all duration-300 ${
            isDragging
              ? "border-dark-royalty bg-dark-royalty/5"
              : "border-deep-sea/30 hover:border-deep-sea/50"
          }`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <div className="text-4xl mb-4">📸</div>
          <h3 className="text-lg font-semibold text-dark-royalty mb-2">
            {initialSegment
              ? "Re-upload Photos for Slideshow"
              : "Upload Photos for Slideshow"}
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
              isLoading ? "opacity-50 cursor-not-allowed" : ""
            }`}
          >
            {isLoading ? "Processing & Compressing..." : "Choose Photos"}
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
                  <Image
                    src={url}
                    alt={`Photo ${index + 1}`}
                    width={200}
                    height={96}
                    className="w-full h-24 object-cover rounded-lg border border-deep-sea/20"
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
                ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                : "bg-dark-royalty text-white hover:bg-dark-royalty/90"
            }`}
          >
            {initialSegment ? "Update Slide Show" : "Create Slide Show"}
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default SlideShow;

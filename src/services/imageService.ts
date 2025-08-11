import { ref, getDownloadURL, uploadBytesResumable } from "firebase/storage";
import { storage } from "../constants/firebaseConfig";

export interface ImageService {
  uploadImage: (
    file: File,
    userId: string,
    eventId: string,
    onProgress?: (progress: number) => void,
  ) => Promise<string>;
  uploadMultipleImages: (
    files: File[],
    userId: string,
    eventId: string,
    onProgress?: (progress: number) => void,
  ) => Promise<string[]>;
  compressImage: (
    file: File,
    maxWidth?: number,
    maxHeight?: number,
    quality?: number,
  ) => Promise<File>;
}

// Compress image before upload
const compressImage = (
  file: File,
  maxWidth = 1920,
  maxHeight = 1080,
  quality = 0.8,
): Promise<File> => {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const img = new Image();

    img.onload = () => {
      // Calculate new dimensions while maintaining aspect ratio
      let { width, height } = img;

      if (width > maxWidth) {
        height = (height * maxWidth) / width;
        width = maxWidth;
      }

      if (height > maxHeight) {
        width = (width * maxHeight) / height;
        height = maxHeight;
      }

      canvas.width = width;
      canvas.height = height;

      // Draw and compress
      ctx?.drawImage(img, 0, 0, width, height);

      canvas.toBlob(
        (blob) => {
          if (blob) {
            const compressedFile = new File([blob], file.name, {
              type: file.type,
              lastModified: Date.now(),
            });
            console.log(
              `Compressed ${file.name}: ${file.size} -> ${compressedFile.size} bytes`,
            );
            resolve(compressedFile);
          } else {
            reject(new Error("Failed to compress image"));
          }
        },
        file.type,
        quality,
      );
    };

    img.onerror = () => reject(new Error("Failed to load image"));
    img.src = URL.createObjectURL(file);
  });
};

export const imageService: ImageService = {
  // Compress image helper
  async compressImage(
    file: File,
    maxWidth = 1920,
    maxHeight = 1080,
    quality = 0.8,
  ): Promise<File> {
    return compressImage(file, maxWidth, maxHeight, quality);
  },

  // Upload a single image with progress tracking
  async uploadImage(
    file: File,
    userId: string,
    eventId: string,
    onProgress?: (progress: number) => void,
  ): Promise<string> {
    try {
      console.log(`Starting upload for ${file.name} (${file.size} bytes)`);

      // Compress image before upload
      const compressedFile = await this.compressImage(file);

      const timestamp = Date.now();
      const fileName = `${userId}/${eventId}/${timestamp}_${file.name}`;
      const storageRef = ref(storage, `slideshow-images/${fileName}`);

      console.log(`Uploading to path: slideshow-images/${fileName}`);

      // Use resumable upload for progress tracking
      const uploadTask = uploadBytesResumable(storageRef, compressedFile);

      return new Promise((resolve, reject) => {
        uploadTask.on(
          "state_changed",
          (snapshot) => {
            const progress =
              (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
            console.log(
              `Upload progress for ${file.name}: ${progress.toFixed(1)}%`,
            );
            onProgress?.(progress);
          },
          (error) => {
            console.error(`Error uploading ${file.name}:`, error);
            console.error("Error code:", error.code);
            console.error("Error message:", error.message);
            reject(
              new Error(`Failed to upload ${file.name}: ${error.message}`),
            );
          },
          async () => {
            try {
              console.log(`Upload completed for ${file.name}`);
              const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
              console.log(`Download URL for ${file.name}:`, downloadURL);
              resolve(downloadURL);
            } catch (error) {
              console.error(
                `Error getting download URL for ${file.name}:`,
                error,
              );
              reject(error);
            }
          },
        );
      });
    } catch (error) {
      console.error(`Error in uploadImage for ${file.name}:`, error);
      throw new Error(
        `Failed to upload ${file.name}: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  },

  // Upload multiple images with overall progress tracking
  async uploadMultipleImages(
    files: File[],
    userId: string,
    eventId: string,
    onProgress?: (progress: number) => void,
  ): Promise<string[]> {
    try {
      console.log(`Starting upload of ${files.length} images`);
      const downloadURLs: string[] = [];
      let completedUploads = 0;

      for (const file of files) {
        try {
          console.log(
            `Uploading file ${completedUploads + 1}/${files.length}: ${file.name}`,
          );
          const downloadURL = await this.uploadImage(
            file,
            userId,
            eventId,
            (progress) => {
              // Calculate overall progress
              const overallProgress =
                ((completedUploads + progress / 100) / files.length) * 100;
              onProgress?.(overallProgress);
            },
          );
          downloadURLs.push(downloadURL);
          completedUploads++;
          console.log(`Successfully uploaded ${file.name}`);
        } catch (error) {
          console.error(`Failed to upload ${file.name}:`, error);
          // Continue with other files even if one fails
        }
      }

      if (downloadURLs.length === 0) {
        throw new Error("No images were uploaded successfully");
      }

      console.log(
        `Upload completed: ${downloadURLs.length}/${files.length} images uploaded successfully`,
      );
      return downloadURLs;
    } catch (error) {
      console.error("Error uploading multiple images:", error);
      throw new Error("Failed to upload images");
    }
  },
};

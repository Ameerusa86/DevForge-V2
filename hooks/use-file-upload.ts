import { useState } from "react";

export interface UploadedFile {
  file: File;
  preview?: string;
}

export interface S3UploadResponse {
  url: string;
  key: string;
  publicUrl?: string;
}

export function useFileUpload() {
  const [uploadedImage, setUploadedImage] = useState<File | null>(null);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const handleImageUpload = (
    file: File,
    onImageLoaded: (dataUrl: string) => void
  ) => {
    setUploadedImage(file);
    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      onImageLoaded(dataUrl);
    };
    reader.readAsDataURL(file);
  };

  const handleFileUpload = (files: FileList): File[] => {
    const newFiles = Array.from(files).filter(
      (file) =>
        file.type === "application/json" ||
        file.type === "text/markdown" ||
        file.name.endsWith(".mdx") ||
        file.name.endsWith(".md") ||
        file.name.endsWith(".json")
    );

    if (newFiles.length === 0) {
      return [];
    }

    setUploadedFiles((prev) => [...prev, ...newFiles]);
    return newFiles;
  };

  const removeFile = (index: number) => {
    setUploadedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const removeImage = () => {
    setUploadedImage(null);
  };

  const readFileAsText = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        resolve(event.target?.result as string);
      };
      reader.onerror = reject;
      reader.readAsText(file);
    });
  };

  const getS3PresignedUrl = async (
    file: File,
    isImage: boolean = false
  ): Promise<S3UploadResponse> => {
    try {
      setIsUploading(true);
      setUploadError(null);

      const response = await fetch("/api/S3/upload", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          fileName: file.name,
          contentType: file.type,
          isImage,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.details || "Failed to get presigned URL");
      }

      const data: S3UploadResponse = await response.json();
      return data;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error occurred";
      setUploadError(errorMessage);
      throw error;
    } finally {
      setIsUploading(false);
    }
  };

  const uploadFileToS3 = async (
    file: File,
    presignedUrl: string
  ): Promise<void> => {
    try {
      setIsUploading(true);
      setUploadError(null);

      const response = await fetch(presignedUrl, {
        method: "PUT",
        headers: {
          "Content-Type": file.type,
        },
        body: file,
      });

      if (!response.ok) {
        const errorText = await response.text().catch(() => "Unknown error");
        throw new Error(
          `Failed to upload file to S3: ${response.status} - ${errorText}`
        );
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error occurred";
      setUploadError(errorMessage);
      throw error;
    } finally {
      setIsUploading(false);
    }
  };

  const handleS3Upload = async (
    file: File,
    isImage: boolean = false
  ): Promise<S3UploadResponse> => {
    try {
      const { url, key, publicUrl } = await getS3PresignedUrl(file, isImage);
      await uploadFileToS3(file, url);
      return { url, key, publicUrl };
    } catch (error) {
      throw error;
    }
  };

  return {
    uploadedImage,
    uploadedFiles,
    isUploading,
    uploadError,
    handleImageUpload,
    handleFileUpload,
    removeFile,
    removeImage,
    readFileAsText,
    getS3PresignedUrl,
    uploadFileToS3,
    handleS3Upload,
  };
}

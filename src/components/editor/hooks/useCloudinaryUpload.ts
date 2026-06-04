"use client";

import { useState, useCallback } from "react";

interface UploadResult {
  url: string;
  publicId: string;
}

interface UseCloudinaryUploadReturn {
  upload: (file: File) => Promise<UploadResult | null>;
  uploading: boolean;
  progress: number;
  error: string | null;
  reset: () => void;
}

export function useCloudinaryUpload(): UseCloudinaryUploadReturn {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const reset = useCallback(() => {
    setUploading(false);
    setProgress(0);
    setError(null);
  }, []);

  const upload = useCallback(
    async (file: File): Promise<UploadResult | null> => {
      setUploading(true);
      setProgress(0);
      setError(null);

      return new Promise((resolve) => {
        const formData = new FormData();
        formData.append("file", file);

        const xhr = new XMLHttpRequest();

        xhr.upload.addEventListener("progress", (event) => {
          if (event.lengthComputable) {
            const percent = Math.round((event.loaded / event.total) * 100);
            setProgress(percent);
          }
        });

        xhr.addEventListener("load", () => {
          setUploading(false);
          if (xhr.status >= 200 && xhr.status < 300) {
            try {
              const data = JSON.parse(xhr.responseText);
              setProgress(100);
              resolve({ url: data.url, publicId: data.public_id });
            } catch {
              setError("Failed to parse upload response");
              resolve(null);
            }
          } else {
            setError(`Upload failed with status ${xhr.status}`);
            resolve(null);
          }
        });

        xhr.addEventListener("error", () => {
          setUploading(false);
          setError("Network error during upload");
          resolve(null);
        });

        xhr.addEventListener("abort", () => {
          setUploading(false);
          setError("Upload cancelled");
          resolve(null);
        });

        xhr.open("POST", "/api/upload");
        xhr.send(formData);
      });
    },
    []
  );

  return { upload, uploading, progress, error, reset };
}

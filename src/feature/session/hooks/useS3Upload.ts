/**
 * S3 업로드를 위한 React Hook
 * Module 1: AWS S3 Upload
 */

import { useState } from 'react';

import { s3UploadService } from '../services/s3UploadService';
import type {
  S3UploadError,
  UploadToS3Response,
} from '../types/s3Upload.types';

interface UseS3UploadReturn {
  uploadAudio: (file: File, userId: number) => Promise<UploadToS3Response>;
  isUploading: boolean;
  progress: number;
  error: S3UploadError | null;
  reset: () => void;
}

/**
 * S3 오디오 파일 업로드 Hook
 *
 * @example
 * const { uploadAudio, isUploading, progress, error } = useS3Upload();
 *
 * const handleUpload = async () => {
 *   try {
 *     const result = await uploadAudio(file, userId);
 *     console.log('업로드 완료:', result.audio_url);
 *   } catch (err) {
 *     console.error('업로드 실패:', err);
 *   }
 * };
 */
export function useS3Upload(): UseS3UploadReturn {
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<S3UploadError | null>(null);

  const uploadAudio = async (
    file: File,
    userId: number
  ): Promise<UploadToS3Response> => {
    setIsUploading(true);
    setProgress(0);
    setError(null);

    try {
      const result = await s3UploadService.uploadAudio({
        file,
        user_id: userId,
        onProgress: (progress) => {
          setProgress(progress);
        },
      });

      setIsUploading(false);
      return result;
    } catch (err) {
      setIsUploading(false);
      const uploadError = err as S3UploadError;
      setError(uploadError);
      throw uploadError;
    }
  };

  const reset = () => {
    setIsUploading(false);
    setProgress(0);
    setError(null);
  };

  return {
    uploadAudio,
    isUploading,
    progress,
    error,
    reset,
  };
}

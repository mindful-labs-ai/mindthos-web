import { useCallback, useMemo, useState } from 'react';

import {
  FILE_UPLOAD_LIMITS,
  MULTI_UPLOAD_LIMITS,
} from '../constants/fileUpload';
import type { MultiFileInfo } from '../types';

interface UseMultiFileUploadReturn {
  files: MultiFileInfo[];
  validFiles: MultiFileInfo[];
  invalidFiles: MultiFileInfo[];
  addFiles: (files: File[]) => void;
  removeFile: (fileId: string) => void;
  clearFiles: () => void;
  isProcessing: boolean;
  canAddMore: boolean;
  remainingSlots: number;
}

const generateId = (): string => {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
};

const getFileExtension = (filename: string): string => {
  return filename.split('.').pop()?.toUpperCase() || '';
};

const isValidAudioFormat = (filename: string): boolean => {
  const ext = getFileExtension(filename);
  return (FILE_UPLOAD_LIMITS.AUDIO.FORMATS as readonly string[]).includes(ext);
};

const isFileSizeValid = (size: number): boolean => {
  const sizeMB = size / (1024 * 1024);
  return sizeMB <= FILE_UPLOAD_LIMITS.AUDIO.MAX_SIZE_MB;
};

const extractAudioDuration = (file: File): Promise<number> => {
  return new Promise((resolve, reject) => {
    const audio = new Audio();
    const objectUrl = URL.createObjectURL(file);

    audio.src = objectUrl;

    audio.addEventListener('loadedmetadata', () => {
      URL.revokeObjectURL(objectUrl);
      resolve(Math.floor(audio.duration));
    });

    audio.addEventListener('error', () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error('오디오 파일을 읽을 수 없습니다.'));
    });
  });
};

export function useMultiFileUpload(): UseMultiFileUploadReturn {
  const [files, setFiles] = useState<MultiFileInfo[]>([]);
  const [processingIds, setProcessingIds] = useState<Set<string>>(new Set());

  const isProcessing = processingIds.size > 0;
  const remainingSlots = MULTI_UPLOAD_LIMITS.MAX_FILES - files.length;
  const canAddMore = remainingSlots > 0;

  const validFiles = useMemo(
    () => files.filter((f) => f.validationStatus === 'valid'),
    [files]
  );

  const invalidFiles = useMemo(
    () =>
      files.filter(
        (f) =>
          f.validationStatus === 'invalid_type' ||
          f.validationStatus === 'size_exceeded'
      ),
    [files]
  );

  const validateAndProcessFile = useCallback(
    async (file: File): Promise<MultiFileInfo> => {
      const id = generateId();
      const baseInfo: MultiFileInfo = {
        id,
        file,
        name: file.name,
        size: file.size,
        validationStatus: 'pending',
      };

      // 파일 형식 검증
      if (!isValidAudioFormat(file.name)) {
        return {
          ...baseInfo,
          validationStatus: 'invalid_type',
          errorMessage: '지원하지 않는 파일 형식',
        };
      }

      // 파일 크기 검증
      if (!isFileSizeValid(file.size)) {
        return {
          ...baseInfo,
          validationStatus: 'size_exceeded',
          errorMessage: '파일 용량 초과',
        };
      }

      // duration 추출
      try {
        const duration = await extractAudioDuration(file);
        return {
          ...baseInfo,
          duration,
          validationStatus: 'valid',
        };
      } catch {
        return {
          ...baseInfo,
          validationStatus: 'invalid_type',
          errorMessage: '오디오 파일을 읽을 수 없습니다',
        };
      }
    },
    []
  );

  const addFiles = useCallback(
    async (newFiles: File[]) => {
      // 최대 개수 제한
      const availableSlots = MULTI_UPLOAD_LIMITS.MAX_FILES - files.length;
      const filesToAdd = newFiles.slice(0, availableSlots);

      if (filesToAdd.length === 0) return;

      // 임시 pending 상태로 추가
      const pendingFiles: MultiFileInfo[] = filesToAdd.map((file) => ({
        id: generateId(),
        file,
        name: file.name,
        size: file.size,
        validationStatus: 'pending' as const,
      }));

      setFiles((prev) => [...prev, ...pendingFiles]);
      setProcessingIds(
        (prev) => new Set([...prev, ...pendingFiles.map((f) => f.id)])
      );

      // 비동기로 각 파일 처리
      for (const pendingFile of pendingFiles) {
        const processedFile = await validateAndProcessFile(pendingFile.file);

        setFiles((prev) =>
          prev.map((f) =>
            f.id === pendingFile.id
              ? { ...processedFile, id: pendingFile.id }
              : f
          )
        );

        setProcessingIds((prev) => {
          const next = new Set(prev);
          next.delete(pendingFile.id);
          return next;
        });
      }
    },
    [files.length, validateAndProcessFile]
  );

  const removeFile = useCallback((fileId: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== fileId));
    setProcessingIds((prev) => {
      const next = new Set(prev);
      next.delete(fileId);
      return next;
    });
  }, []);

  const clearFiles = useCallback(() => {
    setFiles([]);
    setProcessingIds(new Set());
  }, []);

  return {
    files,
    validFiles,
    invalidFiles,
    addFiles,
    removeFile,
    clearFiles,
    isProcessing,
    canAddMore,
    remainingSlots,
  };
}

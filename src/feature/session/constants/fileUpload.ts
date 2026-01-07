export const MULTI_UPLOAD_LIMITS = {
  MAX_FILES: 10,
} as const;

export const FILE_UPLOAD_LIMITS = {
  AUDIO: {
    MAX_SIZE_MB: 500,
    FORMATS: ['MP3', 'WAV', 'M4A', 'MP4', 'WEBM', 'OGG', 'AAC', 'FLAC', 'WMA'],
  },
  PDF: {
    MAX_SIZE_MB: 500,
    FORMATS: ['PDF'],
  },
} as const;

export const getFileUploadText = (
  type: 'audio' | 'pdf'
): { formats: string; maxSize: string } => {
  if (type === 'audio') {
    return {
      formats: FILE_UPLOAD_LIMITS.AUDIO.FORMATS.join(', '),
      maxSize: `${FILE_UPLOAD_LIMITS.AUDIO.MAX_SIZE_MB} MB`,
    };
  }
  return {
    formats: FILE_UPLOAD_LIMITS.PDF.FORMATS.join(', '),
    maxSize: `${FILE_UPLOAD_LIMITS.PDF.MAX_SIZE_MB} MB`,
  };
};

/**
 * 파일 크기 초과 여부 검사
 */
export const isFileSizeExceeded = (
  fileSize: number,
  type: 'audio' | 'pdf'
): boolean => {
  const fileSizeMB = fileSize / (1024 * 1024);
  const maxSizeMB =
    type === 'audio'
      ? FILE_UPLOAD_LIMITS.AUDIO.MAX_SIZE_MB
      : FILE_UPLOAD_LIMITS.PDF.MAX_SIZE_MB;

  return fileSizeMB > maxSizeMB;
};

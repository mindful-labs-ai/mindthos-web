export const FILE_UPLOAD_LIMITS = {
  AUDIO: {
    MAX_SIZE_MB: 100,
    FORMATS: ['MP3', 'WAV', 'M4A'],
  },
  PDF: {
    MAX_SIZE_MB: 100,
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

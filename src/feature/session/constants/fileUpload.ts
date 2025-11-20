export const FILE_UPLOAD_LIMITS = {
  AUDIO: {
    MAX_SIZE_MB: 500,
    FORMATS: ['MP3', 'WAV'],
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

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

/**
 * 확장자를 MIME 타입으로 변환하는 맵
 */
const EXTENSION_TO_MIME: Record<string, string> = {
  MP3: 'audio/mpeg',
  WAV: 'audio/wav',
  M4A: 'audio/x-m4a',
  MP4: 'video/mp4',
  WEBM: 'audio/webm',
  OGG: 'audio/ogg',
  AAC: 'audio/aac',
  FLAC: 'audio/flac',
  WMA: 'audio/x-ms-wma',
  PDF: 'application/pdf',
};

/**
 * FORMATS 배열을 input accept 속성 문자열로 변환
 * @example
 * getAcceptString('audio') // "audio/*,.mp3,.wav,.m4a,.mp4,.webm,.ogg,.aac,.flac,.wma,audio/mpeg,audio/wav,..."
 */
export const getAcceptString = (type: 'audio' | 'pdf'): string => {
  const formats =
    type === 'audio'
      ? FILE_UPLOAD_LIMITS.AUDIO.FORMATS
      : FILE_UPLOAD_LIMITS.PDF.FORMATS;

  const acceptParts: string[] = [];

  // audio 타입인 경우 audio/* 추가
  if (type === 'audio') {
    acceptParts.push('audio/*');
  }

  // 각 포맷에 대해 확장자와 MIME 타입 추가
  formats.forEach((format) => {
    // 확장자 (.mp3, .wav 등)
    acceptParts.push(`.${format.toLowerCase()}`);

    // MIME 타입
    const mime = EXTENSION_TO_MIME[format];
    if (mime) {
      acceptParts.push(mime);
    }
  });

  return acceptParts.join(',');
};

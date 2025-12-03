import { formatDurationInMinutes } from '@/shared/utils/format';

import type { FileInfo, SttModel, UploadType } from '../types';

export const getSessionModalTitle = (type: UploadType): string => {
  switch (type) {
    case 'audio':
      return '녹음 파일로 상담 기록 추가하기';
    case 'pdf':
      return 'PDF 파일로 상담 기록 추가하기';
    case 'direct':
      return '직접 입력하기';
    default:
      return '상담 기록 추가하기';
  }
};

export const getSessionCreditInfo = (
  type: UploadType,
  sttType: SttModel,
  selectedFile: FileInfo | null
): number | null => {
  if (!selectedFile) return null;

  if (type === 'audio' && 'duration' in selectedFile) {
    const minute = formatDurationInMinutes(selectedFile.duration);
    return (sttType === 'gemini-3' ? Math.floor(minute * 1.5) : minute) + 30;
  }

  if (type === 'pdf' || type === 'direct') {
    return 30;
  }

  return null;
};

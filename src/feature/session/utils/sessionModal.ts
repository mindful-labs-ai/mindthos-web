import { formatDurationInMinutes } from '@/shared/utils/format';

import type { FileInfo, UploadType } from '../types';

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
  selectedFile: FileInfo | null
): string | null => {
  if (!selectedFile) return null;

  if (type === 'audio' && 'duration' in selectedFile) {
    return `축어록 풀기 ${formatDurationInMinutes(selectedFile.duration)} / AI 분석 1회가 차감됩니다.`;
  }

  if (type === 'pdf') {
    return '축어록 풀기 30분 / AI 분석 1회가 차감됩니다.';
  }

  return null;
};

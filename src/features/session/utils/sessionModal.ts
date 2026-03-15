// TODO: 삭제 예정 - CreateSessionModal에서만 사용되며, CreateSessionModal이 사용되지 않음
import type { UploadType } from '../types';

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

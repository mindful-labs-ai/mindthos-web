import { ServerApiError } from '@/shared/api/server/serverClient';

export const CHAT_RESPONSE_ERROR =
  '답변을 만들지 못했어요. 일시적인 연결 문제일 수 있어요. 잠시 후 다시 시도해 주세요.';

export const CHAT_RETRY_ERROR =
  '답변을 다시 만들지 못했어요. 인터넷 연결을 확인한 뒤 다시 시도해 주세요.';

export const getStartAnalysisErrorMessage = (error: unknown): string => {
  if (error instanceof ServerApiError) {
    if (error.statusCode === 402 || error.code === 'INSUFFICIENT_CREDIT') {
      return '크레딧이 부족해서 분석을 시작하지 못했어요. 크레딧을 충전한 뒤 다시 시도해 주세요.';
    }
    if (error.statusCode === 409) {
      return '아직 분석을 시작할 수 없는 상태예요. 결과지 확인을 마친 뒤 다시 시도해 주세요.';
    }
    if (error.statusCode === 503) {
      return '분석 서버 연결이 원활하지 않아요. 잠시 후 다시 시도해 주세요.';
    }
  }
  return '분석을 시작하지 못했어요. 잠시 후 다시 시도해 주세요.';
};

export const getUploadErrorMessage = (error: unknown): string => {
  if (error instanceof ServerApiError) {
    if (error.statusCode === 401) {
      return '로그인이 만료되어 결과지를 업로드하지 못했어요. 새로고침한 뒤 다시 시도해 주세요.';
    }
    if (error.statusCode === 409) {
      return '이미 등록된 결과지가 있어요. 기존 결과지를 정리한 뒤 다시 등록해 주세요.';
    }
    if (error.statusCode === 413) {
      return '파일이 너무 커서 업로드하지 못했어요. 용량을 확인한 뒤 다시 등록해 주세요.';
    }
  }
  return '결과지를 업로드하지 못했어요. 인터넷 연결을 확인한 뒤 다시 시도해 주세요.';
};

export const getConfirmErrorMessage = (error: unknown): string => {
  if (error instanceof ServerApiError && error.statusCode === 409) {
    return '입력한 항목을 저장할 수 없는 상태예요. 결과지 상태를 확인한 뒤 다시 시도해 주세요.';
  }
  return '빈 항목을 저장하지 못했어요. 입력 내용을 확인한 뒤 다시 시도해 주세요.';
};

export const getCleanupErrorMessage = (error: unknown): string => {
  if (error instanceof ServerApiError && error.statusCode === 401) {
    return '로그인이 만료되어 이전 업로드를 정리하지 못했어요. 새로고침한 뒤 다시 시도해 주세요.';
  }
  return '이전 업로드를 정리하지 못했어요. 잠시 후 다시 시도해 주세요.';
};

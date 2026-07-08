import { edgeFunctionSttBackend } from './edgeFunctionSttBackend';
import { serverSttBackend } from './serverSttBackend';
import type { SttBackendPort } from './sttBackendPort';

/**
 * STT 백엔드 선택 지점(캘린더/문서의 VITE_USE_MOCK_* 패턴).
 * VITE_USE_SERVER_STT=true → mindthos-server /v1 (이관 경로).
 * 그 외 → 현행 경로(EF + Vercel 라우트 경유 mavo-api). 문제 시 플래그만 되돌리면
 * 즉시 롤백된다(병행 운영 기간 컷오버 스위치).
 */
const useServer = import.meta.env.VITE_USE_SERVER_STT === 'true';

export const sttBackend: SttBackendPort = useServer
  ? serverSttBackend
  : edgeFunctionSttBackend;

export {
  InsufficientCreditError,
  type CreateProgressNoteParams,
  type CreateProgressNoteResult,
  type SessionStatusResult,
  type SttBackendPort,
  type UploadUrlResult,
} from './sttBackendPort';

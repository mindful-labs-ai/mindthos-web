import { edgeFunctionSttBackend } from './edgeFunctionSttBackend';
import type { SttBackendPort } from './sttBackendPort';

/**
 * STT 백엔드 선택 지점.
 * 현재는 현행 경로(EF + mavo-api)만 존재 — mindthos-server 구현(serverSttBackend)이
 * 붙으면 VITE_USE_SERVER_STT 플래그로 전환한다(캘린더/문서의 VITE_USE_MOCK_* 패턴).
 */
export const sttBackend: SttBackendPort = edgeFunctionSttBackend;

export {
  InsufficientCreditError,
  type CreateProgressNoteParams,
  type CreateProgressNoteResult,
  type SttBackendPort,
  type UploadUrlResult,
} from './sttBackendPort';

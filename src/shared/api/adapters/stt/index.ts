import { serverSttBackend } from './serverSttBackend';
import type { SttBackendPort } from './sttBackendPort';

/**
 * STT·세션 쓰기는 mindthos-server가 단일 소유자다.
 * Edge Function fallback을 남기면 Wallet과 legacy credit 경로가 다시 갈라질 수 있다.
 */
export const sttBackend: SttBackendPort = serverSttBackend;

export {
  InsufficientCreditError,
  type CreateProgressNoteParams,
  type CreateProgressNoteResult,
  type SessionStatusResult,
  type SttBackendPort,
  type UploadUrlResult,
} from './sttBackendPort';

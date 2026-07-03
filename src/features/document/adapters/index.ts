import { mockDocumentDataSource } from './mockDocumentDataSource';
import { realDocumentDataSource } from './realDocumentDataSource';
import type { DocumentDataSource } from './types';

/**
 * 활성 어댑터 선택 지점 (단일 교체 포인트).
 *
 * 기본은 실제 mindthos-server 어댑터.
 * 백엔드 없이 UI를 확인하려면 VITE_USE_MOCK_DOCUMENTS=true 로 mock 사용.
 * (UI·스토어는 DocumentDataSource 인터페이스만 의존)
 */
const useMock = import.meta.env.VITE_USE_MOCK_DOCUMENTS === 'true';

export const documentDataSource: DocumentDataSource = useMock
  ? mockDocumentDataSource
  : realDocumentDataSource;

export type { DocumentDataSource } from './types';

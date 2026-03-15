import type {
  ClientAnalysis,
  ClientAnalysisVersion,
} from '../types/clientAnalysis.types';

import dummyAnalysisContent from './dummyClientAnalysis.md?raw';

/**
 * 더미 클라이언트 분석 데이터
 * 세션이 없을 때 예시로 보여주는 다회기 분석 데이터
 */
export const dummyClientAnalysis: ClientAnalysis = {
  id: 'dummy_analysis_1',
  client_id: 'dummy_client_1',
  user_id: '0',
  session_ids: ['dummy_session_1', 'dummy_session_2', 'dummy_session_3'],
  version: 1,
  type: 'ai_supervision',
  template_id: 1,
  content: dummyAnalysisContent,
  status: 'succeeded',
  error_message: null,
  created_at: '2025-12-12 05:07:01.820026+00',
  updated_at: '2025-12-12 05:07:55.585+00',
};

/**
 * 더미 클라이언트 분석 버전 목록
 */
export const dummyClientAnalysisVersions: ClientAnalysisVersion[] = [
  {
    version: 1,
    session_ids: ['dummy_session_1', 'dummy_session_2', 'dummy_session_3'],
    created_at: '2025-12-12 05:07:01.820026+00',
    ai_supervision: dummyClientAnalysis,
  },
];

/**
 * 더미 클라이언트 ID 체크
 */
export const isDummyClientId = (clientId: string): boolean => {
  return clientId === 'dummy_client_1';
};

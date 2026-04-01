/**
 * 클라이언트 분석 API 관련 타입 정의
 */

import type { ClientAnalysisStatus } from './clientAnalysis.types';

export interface CreateClientAnalysisRequest {
  client_id: string;
  user_id: number;
  session_ids: string[];
  ai_supervision_template_id: number;
}

export interface CreateClientAnalysisResponse {
  success: boolean;
  version: number;
  analysis_ids: {
    ai_supervision: string;
  };
  message?: string;
}

export interface GetClientAnalysisStatusResponse {
  success: boolean;
  version: number;
  analyses: {
    ai_supervision: {
      id: string;
      status: ClientAnalysisStatus;
      content?: string;
      error_message?: string;
    };
  };
}

export interface GetClientAnalysesRequest {
  client_id: string;
}

export interface ClientAnalysisApiError {
  status: number;
  success: false;
  error: string;
  message: string;
}

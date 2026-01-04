/**
 * 클라이언트 분석 관련 타입 정의
 */

export type ClientAnalysisStatus =
  | 'pending'
  | 'in_progress'
  | 'succeeded'
  | 'failed';
export type ClientAnalysisType =
  | 'ai_supervision'
  | 'profiling'
  | 'psychotherapy_plan';

export interface ClientTemplate {
  id: number;
  name: string;
  type: ClientAnalysisType;
  prompt: string;
  description: string | null;
  created_at: string;
  updated_at: string;
}

export interface ClientAnalysis {
  id: string;
  client_id: string;
  user_id: string;
  session_ids: string[];
  version: number;
  type: ClientAnalysisType;
  template_id: number;
  content: string | null;
  status: ClientAnalysisStatus;
  error_message: string | null;
  created_at: string;
  updated_at: string;
}

// 버전별로 그룹화된 분석
export interface ClientAnalysisVersion {
  version: number;
  session_ids: string[];
  created_at: string;
  ai_supervision: ClientAnalysis | null;
}

// 템플릿 그룹 (타입별)
export interface ClientTemplateGroups {
  ai_supervision: ClientTemplate[];
  profiling: ClientTemplate[];
  psychotherapy_plan: ClientTemplate[];
}

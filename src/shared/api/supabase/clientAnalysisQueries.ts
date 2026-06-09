/**
 * 다회기 분석 서비스
 */

import type {
  ClientAnalysis,
  ClientAnalysisType,
  ClientAnalysisVersion,
  ClientTemplate,
  ClientTemplateGroups,
} from '@/features/client/types/clientAnalysis.types';
import type {
  ClientAnalysisApiError,
  CreateClientAnalysisRequest,
  CreateClientAnalysisResponse,
  GetClientAnalysisStatusResponse,
} from '@/features/client/types/clientAnalysisApi.types';
import { supabase } from '@/lib/supabase';
import { createSupervisionAnalysis } from '@/shared/api/server/clientAnalysisServerApi';

export const clientAnalysisService = {
  /**
   * 타입별 템플릿 목록 조회
   */
  async getTemplatesByType(
    type: ClientAnalysisType
  ): Promise<ClientTemplate[]> {
    try {
      const { data, error } = await supabase
        .from('client_templates')
        .select('*')
        .eq('type', type)
        .order('created_at', { ascending: true });

      if (error) {
        throw {
          status: 500,
          success: false,
          error: 'DATABASE_ERROR',
          message: error.message || '노트 양식 조회 중 오류가 생겼어요.',
        } as ClientAnalysisApiError;
      }

      return data;
    } catch (error) {
      const apiError = error as ClientAnalysisApiError;
      throw {
        status: apiError.status || 500,
        success: false,
        error: apiError.error || 'UNKNOWN_ERROR',
        message: apiError.message || '노트 양식 조회 중 오류가 생겼어요.',
      } as ClientAnalysisApiError;
    }
  },

  /**
   * 모든 템플릿 조회 (타입별 그룹화)
   */
  async getAllTemplates(): Promise<ClientTemplateGroups> {
    try {
      const { data, error } = await supabase
        .from('client_templates')
        .select('*')
        .order('type')
        .order('created_at', { ascending: true });

      if (error) {
        throw {
          status: 500,
          success: false,
          error: 'DATABASE_ERROR',
          message: error.message || '노트 양식 조회 중 오류가 생겼어요.',
        } as ClientAnalysisApiError;
      }

      // 타입별로 그룹화
      return {
        ai_supervision: data.filter((t) => t.type === 'ai_supervision'),
        profiling: data.filter((t) => t.type === 'profiling'),
        psychotherapy_plan: data.filter((t) => t.type === 'psychotherapy_plan'),
      };
    } catch (error) {
      const apiError = error as ClientAnalysisApiError;
      throw {
        status: apiError.status || 500,
        success: false,
        error: apiError.error || 'UNKNOWN_ERROR',
        message: apiError.message || '노트 양식 조회 중 오류가 생겼어요.',
      } as ClientAnalysisApiError;
    }
  },

  /**
   * 분석 생성 — mindthos-server REST API로 위임.
   * 서버가 크레딧 예약·DB row 생성·머신 큐 publish를 담당한다.
   * user_id는 서버가 Bearer JWT에서 도출하므로 body로 보내지 않는다.
   */
  async createAnalysis(
    request: CreateClientAnalysisRequest
  ): Promise<CreateClientAnalysisResponse> {
    try {
      const { analysisId, version } = await createSupervisionAnalysis(
        request.client_id,
        {
          sessionIds: request.session_ids,
          aiSupervisionTemplateId: request.ai_supervision_template_id,
        }
      );

      return {
        success: true,
        version,
        analysis_ids: { ai_supervision: analysisId },
      };
    } catch (error) {
      const apiError = error as Partial<ClientAnalysisApiError>;
      throw {
        status: apiError.status || 500,
        success: false,
        error: apiError.error || 'CREATE_ERROR',
        message: apiError.message || '분석을 만들지 못했어요.',
      } as ClientAnalysisApiError;
    }
  },

  /**
   * 분석 상태 조회 — Supabase client_analyses 직접 폴링.
   * 서버가 결과를 비동기로 기록하므로, EF 대신 DB row를 직접 조회한다.
   */
  async getAnalysisStatus(
    clientId: string,
    version: number
  ): Promise<GetClientAnalysisStatusResponse> {
    try {
      const { data, error } = await supabase
        .from('client_analyses')
        .select('id, status, content, error_message')
        .eq('client_id', clientId)
        .eq('version', version)
        .eq('type', 'ai_supervision')
        .maybeSingle();

      if (error) {
        throw {
          status: 500,
          success: false,
          error: 'DATABASE_ERROR',
          message: error.message || '상태 조회 중 오류가 생겼어요.',
        } as ClientAnalysisApiError;
      }

      if (!data) {
        throw {
          status: 404,
          success: false,
          error: 'NOT_FOUND',
          message: '분석 결과를 찾을 수 없어요.',
        } as ClientAnalysisApiError;
      }

      return {
        success: true,
        version,
        analyses: {
          ai_supervision: {
            id: data.id,
            status: data.status,
            content: data.content ?? undefined,
            error_message: data.error_message ?? undefined,
          },
        },
      };
    } catch (error) {
      const apiError = error as Partial<ClientAnalysisApiError>;
      throw {
        status: apiError.status || 500,
        success: false,
        error: apiError.error || 'UNKNOWN_ERROR',
        message: apiError.message || '상태 조회 중 오류가 생겼어요.',
      } as ClientAnalysisApiError;
    }
  },

  /**
   * 분석 내용 수정
   */
  async updateAnalysisContent(
    analysisId: string,
    content: string
  ): Promise<void> {
    const { error } = await supabase
      .from('client_analyses')
      .update({ content })
      .eq('id', analysisId);

    if (error) {
      throw {
        status: 500,
        success: false,
        error: 'UPDATE_ERROR',
        message: error.message || '분석 내용 수정 중 오류가 생겼어요.',
      } as ClientAnalysisApiError;
    }
  },

  /**
   * 내담자의 전체 분석 히스토리 조회 (버전별 그룹화)
   */
  async getClientAnalyses(clientId: string): Promise<ClientAnalysisVersion[]> {
    try {
      const { data, error } = await supabase
        .from('client_analyses')
        .select('*')
        .eq('client_id', clientId)
        .order('version', { ascending: false })
        .order('type');

      if (error) {
        throw {
          status: 500,
          success: false,
          error: 'DATABASE_ERROR',
          message: error.message || '분석 히스토리 조회 중 오류가 생겼어요.',
        } as ClientAnalysisApiError;
      }

      // 버전별로 그룹화
      const versionMap = new Map<number, ClientAnalysisVersion>();

      data.forEach((analysis: ClientAnalysis) => {
        if (!versionMap.has(analysis.version)) {
          versionMap.set(analysis.version, {
            version: analysis.version,
            session_ids: analysis.session_ids,
            created_at: analysis.created_at,
            ai_supervision: null,
          });
        }

        const versionData = versionMap.get(analysis.version)!;
        versionData.ai_supervision = analysis;
      });

      return Array.from(versionMap.values());
    } catch (error) {
      const apiError = error as ClientAnalysisApiError;
      throw {
        status: apiError.status || 500,
        success: false,
        error: apiError.error || 'UNKNOWN_ERROR',
        message: apiError.message || '분석 히스토리 조회 중 오류가 생겼어요.',
      } as ClientAnalysisApiError;
    }
  },
};

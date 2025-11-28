/**
 * 클라이언트 분석 서비스
 */

import { supabase } from '@/lib/supabase';
import { callEdgeFunction } from '@/shared/utils/edgeFunctionClient';

import type {
  ClientAnalysis,
  ClientAnalysisType,
  ClientAnalysisVersion,
  ClientTemplate,
  ClientTemplateGroups,
} from '../types/clientAnalysis.types';
import type {
  ClientAnalysisApiError,
  CreateClientAnalysisRequest,
  CreateClientAnalysisResponse,
  GetClientAnalysisStatusResponse,
} from '../types/clientAnalysisApi.types';

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
          message: error.message || '템플릿 조회 중 오류가 발생했습니다.',
        } as ClientAnalysisApiError;
      }

      return data;
    } catch (error) {
      const apiError = error as ClientAnalysisApiError;
      throw {
        status: apiError.status || 500,
        success: false,
        error: apiError.error || 'UNKNOWN_ERROR',
        message: apiError.message || '템플릿 조회 중 오류가 발생했습니다.',
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
          message: error.message || '템플릿 조회 중 오류가 발생했습니다.',
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
        message: apiError.message || '템플릿 조회 중 오류가 발생했습니다.',
      } as ClientAnalysisApiError;
    }
  },

  /**
   * 분석 생성
   */
  async createAnalysis(
    request: CreateClientAnalysisRequest
  ): Promise<CreateClientAnalysisResponse> {
    return await callEdgeFunction<CreateClientAnalysisResponse>(
      '/client-analysis',
      request
    );
  },

  /**
   * 분석 상태 조회
   */
  async getAnalysisStatus(
    clientId: string,
    version: number
  ): Promise<GetClientAnalysisStatusResponse> {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      const response = await fetch(
        `${import.meta.env.VITE_EDGE_FUNCTION_BASE_URL}/client-analysis/status?client_id=${clientId}&version=${version}`,
        {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${session?.access_token || import.meta.env.VITE_WEBAPP_SUPABASE_ANON_KEY}`,
            'Content-Type': 'application/json',
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw {
          status: response.status,
          success: false,
          error: data.error || 'STATUS_ERROR',
          message: data.message || '상태 조회 중 오류가 발생했습니다.',
        } as ClientAnalysisApiError;
      }

      return data as GetClientAnalysisStatusResponse;
    } catch (error) {
      const apiError = error as ClientAnalysisApiError;
      throw {
        status: apiError.status || 500,
        success: false,
        error: apiError.error || 'UNKNOWN_ERROR',
        message: apiError.message || '상태 조회 중 오류가 발생했습니다.',
      } as ClientAnalysisApiError;
    }
  },

  /**
   * 클라이언트의 전체 분석 히스토리 조회 (버전별 그룹화)
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
          message:
            error.message || '분석 히스토리 조회 중 오류가 발생했습니다.',
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
            analyses: {
              ai_supervision: null,
              profiling: null,
              psychotherapy_plan: null,
            },
          });
        }

        const versionData = versionMap.get(analysis.version)!;
        versionData.analyses[analysis.type] = analysis;
      });

      return Array.from(versionMap.values());
    } catch (error) {
      const apiError = error as ClientAnalysisApiError;
      throw {
        status: apiError.status || 500,
        success: false,
        error: apiError.error || 'UNKNOWN_ERROR',
        message:
          apiError.message || '분석 히스토리 조회 중 오류가 발생했습니다.',
      } as ClientAnalysisApiError;
    }
  },
};

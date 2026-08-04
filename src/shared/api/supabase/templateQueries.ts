import type {
  GetTemplatePinsRequest,
  GetTemplatePinsResponse,
  GetTemplatesResponse,
  SetDefaultTemplateRequest,
  SetDefaultTemplateResponse,
  TemplateApiError,
  ToggleTemplatePinRequest,
  ToggleTemplatePinResponse,
} from '@/features/template/types/templateApi.types';
import { supabase } from '@/lib/supabase';
import {
  ServerApiError,
  serverRequest,
} from '@/shared/api/server/serverClient';

const createDatabaseError = (
  error: { message?: string },
  defaultMessage: string
): TemplateApiError => ({
  status: 500,
  success: false,
  error: 'DATABASE_ERROR',
  message: error.message || defaultMessage,
});

const normalizeApiError = (
  error: unknown,
  defaultMessage: string
): TemplateApiError => {
  const apiError = error as TemplateApiError;
  return {
    status: apiError.status || 500,
    success: false,
    error: apiError.error || 'UNKNOWN_ERROR',
    message: apiError.message || defaultMessage,
  };
};

export const templateService = {
  async getTemplates(): Promise<GetTemplatesResponse> {
    try {
      const { data, error } = await supabase
        .from('templates')
        .select('*')
        .order('id', { ascending: true });

      if (error) {
        throw createDatabaseError(
          error,
          '노트 양식 목록 조회 중 오류가 생겼어요.'
        );
      }

      return {
        success: true,
        templates: data || [],
      };
    } catch (error) {
      throw normalizeApiError(error, '노트 양식 목록 조회 중 오류가 생겼어요.');
    }
  },

  async getTemplatePins(
    request: GetTemplatePinsRequest
  ): Promise<GetTemplatePinsResponse> {
    try {
      const { data, error } = await supabase
        .from('template_pin')
        .select('template_id')
        .eq('user_id', request.user_id);

      if (error) {
        throw createDatabaseError(
          error,
          '즐겨찾기 목록 조회 중 오류가 생겼어요.'
        );
      }

      return {
        success: true,
        template_ids: data?.map((item) => item.template_id) || [],
      };
    } catch (error) {
      throw normalizeApiError(error, '즐겨찾기 목록 조회 중 오류가 생겼어요.');
    }
  },

  async toggleTemplatePin(
    request: ToggleTemplatePinRequest
  ): Promise<ToggleTemplatePinResponse> {
    try {
      const { data: existing, error: checkError } = await supabase
        .from('template_pin')
        .select('id')
        .eq('user_id', request.user_id)
        .eq('template_id', request.template_id)
        .single();

      if (checkError && checkError.code !== 'PGRST116') {
        throw createDatabaseError(
          checkError,
          '즐겨찾기 상태 확인 중 오류가 생겼어요.'
        );
      }

      if (existing) {
        const { error: deleteError } = await supabase
          .from('template_pin')
          .delete()
          .eq('user_id', request.user_id)
          .eq('template_id', request.template_id);

        if (deleteError) {
          throw createDatabaseError(
            deleteError,
            '즐겨찾기 해제 중 오류가 생겼어요.'
          );
        }

        return {
          success: true,
          pinned: false,
          message: '즐겨찾기를 해제했어요.',
        };
      }

      const { error: insertError } = await supabase
        .from('template_pin')
        .insert({
          user_id: request.user_id,
          template_id: request.template_id,
        });

      if (insertError) {
        throw createDatabaseError(
          insertError,
          '즐겨찾기 추가 중 오류가 생겼어요.'
        );
      }

      return {
        success: true,
        pinned: true,
        message: '즐겨찾기에 추가했어요.',
      };
    } catch (error) {
      throw normalizeApiError(error, '즐겨찾기 처리 중 오류가 생겼어요.');
    }
  },

  async setDefaultTemplate(
    request: SetDefaultTemplateRequest
  ): Promise<SetDefaultTemplateResponse> {
    try {
      const response = await serverRequest<{
        updated: true;
        default_template_id: number | null;
      }>('/auth/default-template', {
        method: 'PATCH',
        body: { template_id: request.template_id },
      });
      return {
        success: true,
        message: response.updated
          ? '기본 노트 양식으로 설정했어요.'
          : undefined,
      };
    } catch (error) {
      if (
        error instanceof ServerApiError &&
        error.status !== 404 &&
        error.status < 500
      ) {
        throw error;
      }

      console.warn(
        'setDefaultTemplate server API unavailable; using legacy public.users update',
        error
      );

      try {
        const { error: legacyError } = await supabase
          .from('users')
          .update({ default_template_id: request.template_id })
          .eq('id', request.user_id);

        if (legacyError) {
          throw createDatabaseError(
            legacyError,
            '기본 노트 양식 설정 중 오류가 생겼어요.'
          );
        }

        return {
          success: true,
          message: '기본 노트 양식으로 설정했어요.',
        };
      } catch (legacyError) {
        throw normalizeApiError(
          legacyError,
          '기본 노트 양식 설정 중 오류가 생겼어요.'
        );
      }
    }
  },
};

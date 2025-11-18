import { supabase } from '@/lib/supabase';
import { callEdgeFunction } from '@/shared/utils/edgeFunctionClient';

import type {
  ClientApiError,
  CreateClientRequest,
  CreateClientResponse,
  GetClientsRequest,
  GetClientsResponse,
} from '../types/clientApi.types';

export const clientService = {
  async getClients(request: GetClientsRequest): Promise<GetClientsResponse> {
    try {
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .eq('counselor_id', request.counselor_id)
        .order('created_at', { ascending: false });

      if (error) {
        throw {
          status: 500,
          success: false,
          error: 'DATABASE_ERROR',
          message: error.message || '내담자 목록 조회 중 오류가 발생했습니다.',
        } as ClientApiError;
      }

      return {
        success: true,
        clients: data || [],
      };
    } catch (error) {
      const apiError = error as ClientApiError;
      throw {
        status: apiError.status || 500,
        success: false,
        error: apiError.error || 'UNKNOWN_ERROR',
        message: apiError.message || '내담자 목록 조회 중 오류가 발생했습니다.',
      } as ClientApiError;
    }
  },

  async createClient(
    request: CreateClientRequest
  ): Promise<CreateClientResponse> {
    try {
      const response = await callEdgeFunction<CreateClientResponse>(
        '/clients/create',
        request
      );

      return response;
    } catch (error) {
      const apiError = error as ClientApiError;
      throw {
        status: apiError.status || 500,
        success: false,
        error: apiError.error || 'UNKNOWN_ERROR',
        message: apiError.message || '내담자 등록 중 오류가 발생했습니다.',
      } as ClientApiError;
    }
  },
};

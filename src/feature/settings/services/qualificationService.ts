import {
  callEdgeFunction,
  EDGE_FUNCTION_ENDPOINTS,
} from '@/shared/utils/edgeFunctionClient';

export interface Qualification {
  id: string;
  name: string;
  category: string;
  description: string | null;
  sort_order: number;
  created_at: string;
}

interface QualificationListResponse {
  success: boolean;
  qualifications: Qualification[];
}

interface QualificationUpsertResponse {
  success: boolean;
  message: string;
  qualifications: Qualification[];
}

export const qualificationService = {
  /** 전체 자격 목록 조회 */
  async list(): Promise<Qualification[]> {
    const data = await callEdgeFunction<QualificationListResponse>(
      EDGE_FUNCTION_ENDPOINTS.QUALIFICATION.LIST,
      undefined,
      { method: 'GET' }
    );
    return data.qualifications;
  },

  /** 현재 유저의 보유 자격 조회 */
  async user(): Promise<Qualification[]> {
    const data = await callEdgeFunction<QualificationListResponse>(
      EDGE_FUNCTION_ENDPOINTS.QUALIFICATION.USER
    );
    return data.qualifications;
  },

  /** 사용자의 보유 자격 저장 (기존 삭제 후 새로 매핑) */
  async upsert(names: string[]): Promise<Qualification[]> {
    const data = await callEdgeFunction<QualificationUpsertResponse>(
      EDGE_FUNCTION_ENDPOINTS.QUALIFICATION.UPSERT,
      { names }
    );
    return data.qualifications;
  },
};

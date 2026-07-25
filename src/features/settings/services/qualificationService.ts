import { serverRequest } from '@/shared/api/server/serverClient';

export interface Qualification {
  id: string;
  name: string;
  category: string | null;
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
    const data =
      await serverRequest<QualificationListResponse>('/qualifications');
    return data.qualifications;
  },

  /** 현재 유저의 보유 자격 조회 */
  async user(): Promise<Qualification[]> {
    const data = await serverRequest<QualificationListResponse>(
      '/qualifications/user'
    );
    return data.qualifications;
  },

  /** 사용자의 보유 자격 저장 (기존 삭제 후 새로 매핑) */
  async upsert(names: string[]): Promise<Qualification[]> {
    const data = await serverRequest<QualificationUpsertResponse>(
      '/qualifications/upsert',
      { method: 'POST', body: { names } }
    );
    return data.qualifications;
  },
};

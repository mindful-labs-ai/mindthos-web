/**
 * 클라이언트 관련 타입
 */
export interface Client {
  id: string;
  group_id: number | null;
  counselor_id: string;
  name: string;
  phone_number: string;
  counsel_number: number;
  memo: string | null;
  pin: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateClientRequest {
  name: string;
  phone_number: string;
  group_id?: number;
  memo?: string;
  pin?: boolean;
}

export interface UpdateClientRequest {
  name?: string;
  phone_number?: string;
  group_id?: number;
  memo?: string;
  pin?: boolean;
}

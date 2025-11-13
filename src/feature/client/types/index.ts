/**
 * 클라이언트(고객) 관련 타입 정의
 */

/**
 * 클라이언트 정보 (DB 스키마 기반)
 */
export interface Client {
  /**
   * 클라이언트 ID
   */
  id: string;
  /**
   * 그룹 ID
   */
  group_id: number | null;
  /**
   * 상담사 ID
   */
  counselor_id: string;
  /**
   * 이름
   */
  name: string;
  /**
   * 전화번호
   */
  phone_number: string;
  /**
   * 상담 회기 수
   */
  counsel_number: number;
  /**
   * 메모
   */
  memo: string | null;
  /**
   * 고정 여부
   */
  pin: boolean;
  /**
   * 생성일
   */
  created_at: string;
  /**
   * 수정일
   */
  updated_at: string;
}

/**
 * 클라이언트 생성 요청
 */
export interface CreateClientRequest {
  name: string;
  phone_number: string;
  group_id?: number;
  memo?: string;
  pin?: boolean;
}

/**
 * 클라이언트 수정 요청
 */
export interface UpdateClientRequest {
  name?: string;
  phone_number?: string;
  group_id?: number;
  memo?: string;
  pin?: boolean;
}

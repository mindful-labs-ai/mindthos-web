import { z } from 'zod';

// Supabase Auth 기본 정책: 최소 6자
// 비밀번호 변경/초기화/회원가입에서 공통 사용
export const passwordSchema = z
  .string()
  .min(6, '비밀번호는 6자 이상이어야 합니다');

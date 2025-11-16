import { z } from 'zod';

/**
 * 클라이언트 추가 폼 스키마
 */
export const addClientSchema = z.object({
  name: z
    .string()
    .min(1, '이름을 입력해주세요')
    .max(12, '이름은 최대 12자까지 입력 가능합니다'),

  phone_number: z
    .string()
    .refine(
      (val) => {
        if (!val || val === '') return true; // 빈 문자열 허용
        return /^01[0-9]-[0-9]{3,4}-[0-9]{4}$/.test(val);
      },
      {
        message: '올바른 휴대폰 번호 형식을 입력해주세요 (예: 010-1234-5678)',
      }
    )
    .optional()
    .default(''),

  email: z
    .string()
    .refine(
      (val) => {
        if (!val || val === '') return true; // 빈 문자열 허용
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val);
      },
      {
        message: '올바른 이메일 형식을 입력해주세요',
      }
    )
    .optional()
    .default(''),

  memo: z
    .string()
    .max(200, '상담 주제는 최대 200자까지 입력 가능합니다')
    .optional()
    .default(''),

  counsel_number: z
    .number()
    .int('정수를 입력해주세요')
    .min(0, '0 이상의 숫자를 입력해주세요')
    .default(0),

  group_members: z.string().optional().default(''),
});

export type AddClientFormData = z.infer<typeof addClientSchema>;

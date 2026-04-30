import { z } from 'zod';

export const userVerifyFormSchema = z.object({
  name: z
    .string()
    .min(1, '이름을 입력해 주세요.')
    .max(20, '이름은 20자 이내로 입력해 주세요.'),
  organization: z
    .string()
    .min(1, '소속 기관을 입력해 주세요.')
    .max(50, '소속 기관은 50자 이내로 입력해 주세요.'),
  qualification: z.array(z.string()).min(1, '보유 자격을 선택해 주세요.'),
  referralSource: z.string().min(1, '가입 경로를 선택해 주세요.'),
  phoneNumber: z
    .string()
    .min(1, '휴대폰 번호를 입력해 주세요.')
    .regex(
      /^01[016789]-?\d{3,4}-?\d{4}$/,
      '올바른 휴대전화 번호를 입력해 주세요. (예: 010-1234-5678)'
    ),
});

export type UserVerifyFormData = z.infer<typeof userVerifyFormSchema> & {
  referralSourceCustom?: string;
  code: string;
};

/**
 * 입력 값에서 숫자만 추출하여 통신사 형식에 맞는 하이픈 포맷으로 변환.
 * - 010 (11자리) → 3-4-4
 * - 011/016/017/018/019 (10자리) → 3-3-4
 */
export const formatPhoneNumber = (value: string): string => {
  const numbersOnly = value.replace(/[^0-9]/g, '').slice(0, 11);
  if (numbersOnly.length <= 3) return numbersOnly;
  if (numbersOnly.startsWith('010')) {
    if (numbersOnly.length <= 7) {
      return `${numbersOnly.slice(0, 3)}-${numbersOnly.slice(3)}`;
    }
    return `${numbersOnly.slice(0, 3)}-${numbersOnly.slice(3, 7)}-${numbersOnly.slice(7, 11)}`;
  }
  if (numbersOnly.length <= 6) {
    return `${numbersOnly.slice(0, 3)}-${numbersOnly.slice(3)}`;
  }
  return `${numbersOnly.slice(0, 3)}-${numbersOnly.slice(3, 6)}-${numbersOnly.slice(6, 10)}`;
};

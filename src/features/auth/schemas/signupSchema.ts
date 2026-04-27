import { z } from 'zod';

import { passwordSchema } from './passwordSchema';

export const signupSchema = z
  .object({
    email: z.string().email('올바른 이메일 형식이 아닙니다'),
    password: passwordSchema,
    passwordConfirm: z.string(),
    termsAccepted: z.literal(true, {
      message: '서비스 이용약관에 동의해주세요',
    }),
    privacyAccepted: z.literal(true, {
      message: '개인정보 처리방침에 동의해주세요',
    }),
  })
  .refine((data) => data.password === data.passwordConfirm, {
    message: '비밀번호가 같지 않아요',
    path: ['passwordConfirm'],
  });

export type SignupInput = z.infer<typeof signupSchema>;

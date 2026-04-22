import { z } from 'zod';

import { passwordSchema } from './passwordSchema';

export const passwordResetSchema = z
  .object({
    password: passwordSchema,
    passwordConfirm: z.string(),
  })
  .refine((data) => data.password === data.passwordConfirm, {
    message: '비밀번호가 일치하지 않습니다',
    path: ['passwordConfirm'],
  });

export type PasswordResetInput = z.infer<typeof passwordResetSchema>;

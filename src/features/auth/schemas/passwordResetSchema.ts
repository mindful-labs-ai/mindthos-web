import { z } from 'zod';

import { passwordSchema } from './passwordSchema';

export const passwordResetSchema = z
  .object({
    password: passwordSchema,
    passwordConfirm: z.string(),
  })
  .refine((data) => data.password === data.passwordConfirm, {
    message: '비밀번호가 같지 않아요',
    path: ['passwordConfirm'],
  });

export type PasswordResetInput = z.infer<typeof passwordResetSchema>;

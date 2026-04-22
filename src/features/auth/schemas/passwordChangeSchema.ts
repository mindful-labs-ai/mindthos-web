import { z } from 'zod';

import { passwordSchema } from './passwordSchema';

export const passwordChangeSchema = z
  .object({
    currentPassword: z.string().min(1, '현재 비밀번호를 입력해주세요'),
    newPassword: passwordSchema,
    newPasswordConfirm: z.string(),
  })
  .refine((data) => data.newPassword === data.newPasswordConfirm, {
    message: '비밀번호가 일치하지 않습니다',
    path: ['newPasswordConfirm'],
  })
  .refine((data) => data.currentPassword !== data.newPassword, {
    message: '새 비밀번호는 현재 비밀번호와 달라야 합니다',
    path: ['newPassword'],
  });

export type PasswordChangeInput = z.infer<typeof passwordChangeSchema>;

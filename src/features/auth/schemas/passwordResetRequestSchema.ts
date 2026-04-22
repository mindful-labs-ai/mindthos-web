import { z } from 'zod';

export const passwordResetRequestSchema = z.object({
  email: z.string().email('올바른 이메일 형식이 아닙니다'),
});

export type PasswordResetRequestInput = z.infer<
  typeof passwordResetRequestSchema
>;

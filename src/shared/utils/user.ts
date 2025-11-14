export const extractUsernameFromEmail = (email?: string): string => {
  if (!email) return '사용자';
  return email.split('@')[0];
};

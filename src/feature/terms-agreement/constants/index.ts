export const termsAgreementQueryKeys = {
  all: ['terms-agreement'] as const,
  check: () => [...termsAgreementQueryKeys.all, 'check'] as const,
};

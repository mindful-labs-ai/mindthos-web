export const termsAgreementQueryKeys = {
  all: ['terms-agreement'] as const,
  list: () => [...termsAgreementQueryKeys.all, 'list'] as const,
};

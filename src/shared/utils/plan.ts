export const calculateMonthlyPrice = (yearlyPrice: number): number => {
  return Math.floor(yearlyPrice / 12);
};

export const calculateDiscountRate = (
  monthlyPrice: number,
  yearlyPrice: number
): number => {
  const yearlyFromMonthly = monthlyPrice * 12;
  const discount = yearlyFromMonthly - yearlyPrice;
  return Math.round((discount / yearlyFromMonthly) * 100);
};

export const getPlanLabel = (planType: string): string => {
  switch (planType) {
    case 'Free':
      return '프리 플랜';
    case 'Plus':
    case 'PlusYear':
      return '플러스 플랜';
    case 'Pro':
    case 'ProYear':
      return '프로 플랜';
    default:
      return planType;
  }
};

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

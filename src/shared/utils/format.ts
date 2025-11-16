export const formatPrice = (price: number): string => {
  return price.toLocaleString('ko-KR');
};

export const formatCurrency = (price: number): string => {
  return `${formatPrice(price)}원`;
};

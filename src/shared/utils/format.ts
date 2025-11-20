export const formatPrice = (price: number): string => {
  return price.toLocaleString('ko-KR');
};

export const formatCurrency = (price: number): string => {
  return `${formatPrice(price)}원`;
};

export const formatFileSize = (bytes: number): string => {
  return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
};

export const formatDurationInMinutes = (seconds: number): string => {
  const minutes = Math.floor(seconds / 60);
  return `${minutes}분`;
};

export const formatDurationInTime = (seconds: number): string => {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
};

export const formatPrice = (price: number): string => {
  return price.toLocaleString('ko-KR');
};

export const formatCurrency = (price: number): string => {
  return `${formatPrice(price)}원`;
};

export const formatFileSize = (bytes: number): string => {
  return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
};

export const formatDurationInMinutes = (seconds: number): number => {
  const minutes = Math.floor(seconds / 60);
  return minutes;
};

// Re-export from date.ts for backward compatibility
export { formatDuration as formatDurationInTime } from './date';

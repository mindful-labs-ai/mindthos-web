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

export const formatDurationInTime = (seconds: number): string => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = seconds % 60;

  if (hours > 0) {
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  }

  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
};

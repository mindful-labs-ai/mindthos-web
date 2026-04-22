export const BACKGROUND_OPTIONS = [
  { id: 'transparent', color: 'transparent', label: '투명' },
  { id: 'white', color: '#FFFFFF', label: '흰색' },
  { id: 'gray', color: '#EEEEEE', label: '회색' },
  { id: 'pink', color: '#FFE2E2', label: '분홍' },
  { id: 'green', color: '#F5FFE2', label: '연두' },
] as const;

export type BackgroundOptionId = (typeof BACKGROUND_OPTIONS)[number]['id'];

export const DEFAULT_WATERMARK_OPACITY = 1;

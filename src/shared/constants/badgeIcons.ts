import type React from 'react';

import { SeminarBagde } from '@/shared/icons';

/**
 * access.type → 뱃지 아이콘 컴포넌트 매핑
 * 새 뱃지 추가 시 여기에 한 줄만 추가하면 됩니다.
 */
export const BADGE_ICON_MAP: Record<string, React.FC<{ size?: number }>> = {
  GENOGRAM_SEMINAR: SeminarBagde,
};

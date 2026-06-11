import { useEffect } from 'react';

import { trackEvent } from '@/lib/mixpanel';
import { MixpanelEvent } from '@/shared/constants/mixpanelEvents';

/**
 * 홈 상단 이벤트 배너 띠 — 디자인이 박힌 배너 이미지를 그대로 노출.
 * 웰컴 배너 자리를 대체하며 닫기 없이 상시 노출된다.
 * 운영 배너 교체 시 BANNER 상수만 수정.
 */
const BANNER = {
  id: 'free-workshop-2606',
  title: '마음토스 사용자 무료 워크숍 이벤트 (26.05.30~26.06.15)',
  imageSrc: '/banner_image/free-workshop-banner.png',
};

export function HomeEventBanner() {
  // 노출 트래킹 (웰컴 배너와 동일 퍼널 유지)
  useEffect(() => {
    trackEvent(MixpanelEvent.WelcomeBannerView, { banner_id: BANNER.id });
  }, []);

  return (
    <div className="w-full max-w-[1200px] overflow-hidden rounded-lg">
      <img
        src={BANNER.imageSrc}
        alt={BANNER.title}
        className="h-16 w-full object-cover md:h-auto"
      />
    </div>
  );
}

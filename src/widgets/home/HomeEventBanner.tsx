import { useEffect } from 'react';

import { trackEvent } from '@/lib/mixpanel';
import { MixpanelEvent } from '@/shared/constants/mixpanelEvents';

/**
 * 홈 상단 이벤트 배너 띠 — 배경 사진 + 어두운 오버레이 + 타이틀(CSS 렌더).
 * 이미지에 글씨가 박혀있지 않아 모바일에서도 텍스트가 선명하게 줄바꿈된다.
 * 웰컴 배너 자리를 대체하며 닫기 없이 상시 노출. 운영 배너 교체 시 BANNER만 수정.
 */
const BANNER = {
  id: 'free-workshop-2606',
  title: '마음토스 사용자 무료 워크숍 이벤트 (26.05.30~26.06.15)',
  imageSrc: '/banner_image/home-banner-image.png',
};

export function HomeEventBanner() {
  // 노출 트래킹 (웰컴 배너와 동일 퍼널 유지)
  useEffect(() => {
    trackEvent(MixpanelEvent.WelcomeBannerView, { banner_id: BANNER.id });
  }, []);

  return (
    <div className="relative h-[72px] w-full max-w-[1200px] overflow-hidden rounded-lg md:h-[104px]">
      <img
        src={BANNER.imageSrc}
        alt=""
        className="absolute inset-0 h-full w-full object-cover"
      />
      <div className="absolute inset-0 bg-black/50" />
      <div className="relative flex h-full items-center justify-center px-6">
        <p className="text-center text-m font-headline text-white md:text-[24px] md:leading-[29px]">
          {BANNER.title}
        </p>
      </div>
    </div>
  );
}

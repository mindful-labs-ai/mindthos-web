import { useEffect, useState } from 'react';

import { X } from 'lucide-react';

import { trackEvent } from '@/lib/mixpanel';
import { MixpanelEvent } from '@/shared/constants/mixpanelEvents';

/**
 * 홈 상단 이벤트 배너 띠 — 디자인이 박힌 배너 이미지를 그대로 노출.
 * 웰컴 배너 자리를 대체한다. 운영 배너 교체 시 BANNER 상수만 수정.
 * id를 바꾸면 이전에 닫았던 사용자에게도 새 배너가 다시 노출된다.
 */
const BANNER = {
  id: 'free-workshop-2606',
  title: '마음토스 사용자 무료 워크숍 이벤트 (26.05.30~26.06.15)',
  imageSrc: '/banner_image/free-workshop-banner.png',
};

const DISMISS_KEY = `home_event_banner_dismissed:${BANNER.id}`;

export function HomeEventBanner() {
  const [dismissed, setDismissed] = useState(
    () => localStorage.getItem(DISMISS_KEY) === 'true'
  );

  // 노출 트래킹 (웰컴 배너와 동일 퍼널 유지)
  useEffect(() => {
    if (!dismissed) {
      trackEvent(MixpanelEvent.WelcomeBannerView, { banner_id: BANNER.id });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (dismissed) return null;

  const handleDismiss = () => {
    trackEvent(MixpanelEvent.WelcomeBannerDismiss, { banner_id: BANNER.id });
    localStorage.setItem(DISMISS_KEY, 'true');
    setDismissed(true);
  };

  return (
    <div className="relative w-full max-w-[1200px] overflow-hidden rounded-lg">
      <img
        src={BANNER.imageSrc}
        alt={BANNER.title}
        className="h-16 w-full object-cover md:h-auto"
      />
      <button
        type="button"
        aria-label="배너 닫기"
        onClick={handleDismiss}
        className="absolute right-4 top-1/2 -translate-y-1/2 text-white/80 transition-colors lg:hover:text-white"
      >
        <X size={24} />
      </button>
    </div>
  );
}

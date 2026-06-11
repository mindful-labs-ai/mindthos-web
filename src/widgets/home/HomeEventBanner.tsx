import { useState } from 'react';

import { X } from 'lucide-react';

/**
 * 홈 상단 이벤트 배너 띠 — 이미지 배경 + 어두운 오버레이 + 타이틀.
 * 운영 배너 교체 시 BANNER 상수만 수정. id를 바꾸면 이전에 닫았던
 * 사용자에게도 새 배너가 다시 노출된다.
 */
const BANNER = {
  id: 'workshop-2606',
  title: '마음토스 사용자 무료 워크숍 이벤트 (26.05.30~26.06.15)',
  // TODO: 운영 배너 이미지로 교체 (1200x104 비율 권장)
  imageSrc: '/auth-page-image.webp',
};

const DISMISS_KEY = `home_event_banner_dismissed:${BANNER.id}`;

export function HomeEventBanner() {
  const [dismissed, setDismissed] = useState(
    () => localStorage.getItem(DISMISS_KEY) === 'true'
  );

  if (dismissed) return null;

  const handleDismiss = () => {
    localStorage.setItem(DISMISS_KEY, 'true');
    setDismissed(true);
  };

  return (
    <div className="relative mb-6 h-[72px] w-full max-w-[1200px] overflow-hidden rounded-lg md:h-[104px]">
      <img
        src={BANNER.imageSrc}
        alt=""
        className="absolute inset-0 h-full w-full object-cover"
      />
      <div className="absolute inset-0 bg-black/50" />
      <div className="relative flex h-full items-center justify-center px-12">
        <p className="text-center text-m font-headline text-white md:text-[24px] md:leading-[29px]">
          {BANNER.title}
        </p>
      </div>
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

import { useState } from 'react';

import { LockedFeatureModal } from '@/widgets/client/LockedFeatureModal';

/**
 * AI 슈퍼비전 페이지 상단 카드형 탭.
 * AI 슈퍼비전(활성) / 프로파일링·인포그래픽(준비 중, 클릭 시 안내 모달).
 */
export function SupervisionTabs() {
  const [isLockedModalOpen, setIsLockedModalOpen] = useState(false);

  const disabledTabs = ['프로파일링', '인포그래픽'];

  return (
    <div className="relative z-10 -mb-px flex items-end gap-2 pl-8">
      <div className="rounded-t-2xl border border-b-0 border-[#D6D8E1] bg-white px-[22px] pb-5 pt-4">
        <span className="text-m font-headline text-grey-100">AI 슈퍼비전</span>
      </div>
      {disabledTabs.map((label) => (
        <button
          key={label}
          type="button"
          onClick={() => setIsLockedModalOpen(true)}
          className="flex items-center gap-2 rounded-t-2xl border border-[#D6D8E1] bg-[#FAFBFF] px-[22px] pb-5 pt-4"
        >
          <span className="text-m font-headline text-[#BABCC7]">{label}</span>
          <span className="rounded-lg bg-[#BABCC7] p-1 text-xs font-headline text-white">
            준비 중
          </span>
        </button>
      ))}
      <LockedFeatureModal
        open={isLockedModalOpen}
        onOpenChange={setIsLockedModalOpen}
      />
    </div>
  );
}

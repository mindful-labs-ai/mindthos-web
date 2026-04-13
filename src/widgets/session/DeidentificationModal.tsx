import React from 'react';

import { useDevice } from '@/shared/hooks/useDevice';
import { CreditIcon, TooltipIcon } from '@/shared/icons';
import { Modal } from '@/shared/ui/composites/Modal';
import { Tooltip } from '@/shared/ui/composites/Tooltip';

const DEIDENTIFICATION_CREDIT = 20;

/** 비식별화 안내 툴팁 (데스크톱: Tooltip, 모바일/태블릿: Modal) */
const DeidInfoTooltip: React.FC<{ children: React.ReactElement }> = ({
  children,
}) => {
  const { isMobile, isTablet } = useDevice();
  const isMobileView = isMobile || isTablet;
  const [isOpen, setIsOpen] = React.useState(false);

  const content = (
    <div className="space-y-4 p-2 text-left">
      <h4 className="text-sm font-medium text-fg">축어록 비식별화</h4>
      <img
        src="/tooltip/deid-tooltip-image.png"
        alt="비식별화 예시"
        className="w-full rounded-md object-fill"
      />
      <p className="text-sm text-grey-80">
        축어록에 포함된 내담자를 특정할 수 있는 단어들을 찾아서 AI가
        <span className="font-emphasize text-orange-100">
          비식별화된 축어록
        </span>
        으로 변환합니다.
      </p>
      <p className="text-sm text-grey-80">
        비식별화된 축어록은 한 번 실행하면 이후에 자유롭게 활성화 및 비활성화가
        가능합니다.
      </p>
    </div>
  );

  if (isMobileView) {
    return (
      <>
        <div
          role="button"
          tabIndex={0}
          onClick={(e) => {
            e.stopPropagation();
            setIsOpen(true);
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') setIsOpen(true);
          }}
        >
          {children}
        </div>
        <Modal
          open={isOpen}
          onOpenChange={setIsOpen}
          mobileVariant="fullScreen"
          hideCloseButton
          className="px-4 py-4"
        >
          {content}
        </Modal>
      </>
    );
  }

  return (
    <Tooltip
      className="min-h-[419px] min-w-[376px]"
      content={content}
      placement="right"
      delay={100}
    >
      {children}
    </Tooltip>
  );
};

interface DeidentificationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
}

export const DeidentificationModal: React.FC<DeidentificationModalProps> = ({
  open,
  onOpenChange,
  onConfirm,
}) => {
  const { isMobile } = useDevice();
  const isMobileView = isMobile;

  const handleConfirm = () => {
    onConfirm();
    onOpenChange(false);
  };

  return (
    <Modal
      className="max-h-[364px] max-w-lg px-0"
      open={open}
      onOpenChange={onOpenChange}
      mobileVariant="center"
      hideCloseButton={isMobileView}
    >
      <div className="flex flex-col items-center py-5">
        {/* 제목 + 툴팁 */}
        <div className="mb-8 flex items-center justify-center gap-1.5">
          <h2 className="text-center text-xl font-emphasize text-fg">
            축어록 비식별화
          </h2>
          <DeidInfoTooltip>
            <span
              role="button"
              tabIndex={-1}
              aria-label="비식별화 정보"
              className="flex h-5 w-5 flex-shrink-0 cursor-pointer items-center justify-center rounded-full bg-grey-30 text-grey-60 transition-colors lg:hover:bg-grey-40 lg:hover:text-grey-80"
            >
              <TooltipIcon />
            </span>
          </DeidInfoTooltip>
        </div>

        {/* 본문 */}
        <h3 className="mb-[22px] text-center text-l font-emphasize text-fg">
          현재 축어록 내용을 비식별화하시겠습니까?
        </h3>
        <span className="mb-6 text-center text-m leading-relaxed text-grey-70">
          내담자의 이름 및 정보들이 비식별화되어
          <br />
          다른 단어로 대체됩니다. 크레딧은 최초 1회만 차감됩니다.
        </span>

        <div className="mb-2 flex items-center gap-1 rounded-lg bg-primary-subtle px-3 py-1">
          <span className="font-headline text-primary">
            {DEIDENTIFICATION_CREDIT}
          </span>
          <CreditIcon size={14} />
          <span className="font-medium text-green-80">사용</span>
        </div>

        {/* 확인 버튼 */}
        <button
          type="button"
          onClick={handleConfirm}
          className="lg:hover:bg-green-90 h-[41px] w-full max-w-[375px] rounded-md bg-green-80 text-m font-emphasize text-white transition-colors"
        >
          비식별화 하기
        </button>
      </div>
    </Modal>
  );
};

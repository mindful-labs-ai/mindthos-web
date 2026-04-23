import React from 'react';

import { useDevice } from '@/shared/hooks/useDevice';
import { CreditIcon, TooltipIcon } from '@/shared/icons';
import { Modal } from '@/shared/ui/composites/Modal';
import { Tooltip } from '@/shared/ui/composites/Tooltip';

export type DeidModalPhase = 'confirm' | 'loading' | 'complete' | 'error';

const DEIDENTIFICATION_CREDIT = 20;

export interface DeidStats {
  total_segments: number;
  deid_segments: number;
  deid_tags: number;
  consistency_rate: number;
  nv_preserve_rate: number;
}

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
        축어록에 포함된 내담자를 특정할 수 있는 단어들을 찾아서 AI가{' '}
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

/** 로딩 스피너 */
const LoadingSpinner = () => (
  <svg
    className="h-10 w-10 animate-spin text-green-80"
    viewBox="0 0 24 24"
    fill="none"
  >
    <circle
      cx="12"
      cy="12"
      r="10"
      stroke="currentColor"
      strokeWidth="3"
      className="opacity-20"
    />
    <path
      d="M12 2a10 10 0 0 1 10 10"
      stroke="currentColor"
      strokeWidth="3"
      strokeLinecap="round"
    />
  </svg>
);

interface DeidentificationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  phase: DeidModalPhase;
  stats?: DeidStats | null;
  errorMessage?: string;
}

export const DeidentificationModal: React.FC<DeidentificationModalProps> = ({
  open,
  onOpenChange,
  onConfirm,
  phase,
  stats,
  errorMessage,
}) => {
  const { isMobile } = useDevice();
  const isMobileView = isMobile;

  return (
    <Modal
      className="max-w-lg px-0"
      open={open}
      onOpenChange={onOpenChange}
      mobileVariant="center"
      hideCloseButton={isMobileView || phase === 'loading'}
      closeOnOverlay={phase !== 'loading'}
    >
      <div className="flex flex-col items-center py-5">
        {/* ─── 확인 단계 ─── */}
        {phase === 'confirm' && (
          <>
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
            <button
              type="button"
              onClick={onConfirm}
              className="lg:hover:bg-green-90 h-[41px] w-full max-w-[375px] rounded-md bg-green-80 text-m font-emphasize text-white transition-colors"
            >
              비식별화 하기
            </button>
          </>
        )}

        {/* ─── 로딩 단계 ─── */}
        {phase === 'loading' && (
          <div className="flex flex-col items-center gap-4 py-8">
            <LoadingSpinner />
            <h3 className="text-center text-l font-emphasize text-fg">
              비식별화 처리 중...
            </h3>
            <span className="text-center text-m text-grey-70">
              축어록을 분석하고 있습니다.
              <br />
              잠시만 기다려주세요.
            </span>
          </div>
        )}

        {/* ─── 완료 단계 ─── */}
        {phase === 'complete' && stats && (
          <>
            <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-full bg-green-20">
              <svg
                width="28"
                height="28"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#44CE4B"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M20 6L9 17l-5-5" />
              </svg>
            </div>
            <h3 className="mb-6 text-center text-l font-emphasize text-fg">
              비식별화가 완료되었습니다
            </h3>
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="lg:hover:bg-green-90 h-[41px] w-full max-w-[375px] rounded-md bg-green-80 text-m font-emphasize text-white transition-colors"
            >
              확인
            </button>
          </>
        )}

        {/* ─── 에러 단계 ─── */}
        {phase === 'error' && (
          <>
            <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-full bg-red-100/10">
              <svg
                width="28"
                height="28"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#EF4444"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </div>
            <h3 className="mb-3 text-center text-l font-emphasize text-fg">
              {errorMessage?.startsWith('NO_DEID_TARGETS')
                ? '비식별화할 개인정보가 없습니다'
                : '비식별화 실패'}
            </h3>
            <span className="mb-6 text-center text-m text-grey-70">
              {errorMessage?.startsWith('NO_DEID_TARGETS')
                ? '축어록에서 비식별화할 개인정보를 찾지 못했습니다.'
                : errorMessage}
            </span>
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="h-[41px] w-full max-w-[375px] rounded-md border border-grey-30 bg-white text-m font-emphasize text-fg transition-colors lg:hover:bg-grey-10"
            >
              닫기
            </button>
          </>
        )}
      </div>
    </Modal>
  );
};

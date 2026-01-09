import { Button } from '@/components/ui/atoms/Button';
import { Modal } from '@/components/ui/composites/Modal';
import { useTutorial } from '@/feature/onboarding/hooks/useTutorial';
import { useQuestStore } from '@/stores/questStore';

export const QuestMissionModal = () => {
  const {
    currentLevel,
    hasShownMissionModal,
    setHasShownMissionModal,
    shouldShowOnboarding,
  } = useQuestStore();
  const { startTutorial, nextTutorialStep, endTutorial } = useTutorial({
    currentLevel,
  });

  const isOpen =
    currentLevel === 1 && shouldShowOnboarding && !hasShownMissionModal;

  const handleClose = () => {
    setHasShownMissionModal(true);
  };

  const handleStart = () => {
    setHasShownMissionModal(true);
    endTutorial();
    startTutorial();
    nextTutorialStep();
  };

  return (
    <Modal
      open={isOpen}
      onOpenChange={handleClose}
      className="max-w-[440px] border-none p-0"
    >
      <div className="flex flex-col items-center px-8 py-6 text-center">
        {/* Title */}
        <h2 className="text-2xl font-bold text-fg">반가워요, 상담사님!</h2>

        {/* Description */}
        <div className="mt-8">
          <p className="text-lg font-bold leading-relaxed text-fg">
            상담사의 든든한 임상 파트너, 마음토스
          </p>
          <p className="text-lg font-bold leading-relaxed text-fg">
            100% 활용하기 위한{' '}
            <span className="text-primary-600">4가지 미션</span>을 완료하면
          </p>
          <p className="text-lg font-bold leading-relaxed text-fg">
            <span className="text-primary-600">스타터 플랜 1개월*</span>을
            선물로 드려요!
          </p>
          <p className="mt-2 text-sm text-fg-muted">
            *정가 8,900원 / 500 크레딧 지급
          </p>
        </div>

        {/* Ticket/Coupon */}
        <div className="relative mt-10 w-full">
          <div
            className="flex h-[140px] w-full flex-col items-center justify-center px-12 py-8"
            style={{
              background:
                'linear-gradient(to bottom, #d2e49c 0%, #86d07d 100%)',
            }}
          >
            {/* Ticket Cutouts (Left & Right) */}
            <div className="absolute left-0 top-1/2 h-8 w-4 -translate-y-1/2 rounded-r-full bg-surface" />
            <div className="absolute right-0 top-1/2 h-8 w-4 -translate-y-1/2 rounded-l-full bg-surface" />

            <div className="absolute left-1/2 top-3 flex w-full -translate-x-1/2 flex-col items-center text-white"></div>
            <div className="flex flex-col gap-2 text-center">
              <span className="text-base font-normal text-surface">
                마음토스 스타터 플랜
              </span>
              <p className="text-3xl font-extrabold text-white drop-shadow-sm">
                1개월 무료 이용권
              </p>
            </div>
          </div>
        </div>

        {/* Action Button */}
        <Button
          onClick={handleStart}
          tone="primary"
          size="md"
          className="mt-12 h-12 w-full"
        >
          <span className="font-extrabold">첫번째 미션 시작하기</span>
        </Button>
      </div>
    </Modal>
  );
};

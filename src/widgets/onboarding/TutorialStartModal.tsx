import { Button } from '@/shared/ui/atoms/Button';
import { Modal } from '@/shared/ui/composites/Modal';

interface TutorialStartModalProps {
  open: boolean;
  onDismiss: () => void;
  onStart: () => void;
}

/** 레거시 첫 가이드 안내의 구조를 신규 4단계 Tutorial 보상에 맞춘 진입 모달. */
export const TutorialStartModal = ({
  open,
  onDismiss,
  onStart,
}: TutorialStartModalProps) => (
  <Modal
    open={open}
    onOpenChange={(nextOpen) => {
      if (!nextOpen) onDismiss();
    }}
    className="max-w-[440px] border-none p-0"
  >
    <div className="flex flex-col items-center px-6 py-6 text-center sm:px-8">
      <h2 className="typo-xl font-headline text-fg">반가워요, 상담사님!</h2>

      <div className="mt-8">
        <p className="typo-m font-emphasize leading-relaxed text-fg">
          상담사의 든든한 임상 파트너, 마음토스
        </p>
        <p className="typo-m font-emphasize leading-relaxed text-fg">
          100% 활용하기 위한 <span className="text-primary">4가지 미션</span>을
          완료하면
        </p>
        <p className="typo-m font-emphasize leading-relaxed text-fg">
          <span className="text-primary">스타터 플랜 7일</span>을 선물로 드려요!
        </p>
        <p className="typo-sm mt-2 text-fg-muted">500 크레딧 지급</p>
      </div>

      <div className="relative mt-10 w-full">
        <div
          className="flex h-[140px] w-full flex-col items-center justify-center px-12 py-8"
          style={{
            background: 'linear-gradient(to bottom, #d2e49c 0%, #86d07d 100%)',
          }}
        >
          <div className="absolute left-0 top-1/2 h-8 w-4 -translate-y-1/2 rounded-r-full bg-surface" />
          <div className="absolute right-0 top-1/2 h-8 w-4 -translate-y-1/2 rounded-l-full bg-surface" />
          <div className="flex flex-col gap-2 text-center">
            <span className="typo-m font-sub text-surface">
              마음토스 스타터 플랜
            </span>
            <p className="text-2xl font-extrabold text-white drop-shadow-sm">
              7일 무료 이용권
            </p>
          </div>
        </div>
      </div>

      <Button
        onClick={onStart}
        tone="primary"
        size="lg"
        className="mt-10 w-full font-headline"
      >
        첫 번째 미션 시작하기
      </Button>
      <Button
        onClick={onDismiss}
        tone="neutral"
        variant="ghost"
        size="md"
        className="mt-2 w-full text-fg-muted"
      >
        다음에 할게요
      </Button>
    </div>
  </Modal>
);

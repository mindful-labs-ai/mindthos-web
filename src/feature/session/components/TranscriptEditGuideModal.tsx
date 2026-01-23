import { Button, Modal } from '@/components/ui';
import { useFeatureGuideStore } from '@/stores/featureGuideStore';

/**
 * 축어록 편집 기능 가이드 진입점 모달
 * - 조건 충족 시 표시 (스크롤 트리거, 세션 수 < 5, 미확인 상태)
 * - "가이드 시작" 버튼으로 Level 1 시작
 * - "다음에 하기" 버튼으로 닫기 및 seen 처리
 */
export function TranscriptEditGuideModal() {
  const entryModal = useFeatureGuideStore((state) => state.entryModal);
  const closeEntryModal = useFeatureGuideStore(
    (state) => state.closeEntryModal
  );
  const startGuide = useFeatureGuideStore((state) => state.startGuide);

  const isOpen = entryModal?.type === 'transcriptEdit' && entryModal.isOpen;

  const handleStartGuide = () => {
    startGuide('transcriptEdit');
  };

  const handleSkip = () => {
    closeEntryModal();
  };

  return (
    <Modal
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) closeEntryModal();
      }}
      className="flex h-[658px] max-w-[512px] flex-col border-none p-0"
    >
      <div className="flex flex-1 flex-col items-center py-6 text-center">
        <h2 className="text-2xl font-semibold text-fg">축어록 편집 가이드</h2>

        <div className="mt-11 flex h-full flex-col items-center">
          <h3 className="mb-5 text-xl font-semibold leading-relaxed text-primary">
            선생님, 혹시 축어록에 수정할 부분이 있나요?
          </h3>

          <img
            src="/guide/transcribe_edit.png"
            alt="축어록 편집 가이드"
            className="pointer-events-none mb-9 aspect-[3/1.9] h-full max-h-[280px] w-full max-w-[428px] select-none rounded-2xl border object-cover"
          />

          <p className="max-w-[70%] text-base font-medium leading-relaxed text-fg">
            간단하게 축어록을 수정하는 방법을
            <br />
            지금 바로 알려드릴게요!
          </p>
        </div>
      </div>

      <div className="flex gap-3 px-8 pb-6">
        <Button
          onClick={handleSkip}
          variant="outline"
          tone="neutral"
          size="lg"
          className="flex-1"
        >
          <span className="font-semibold">괜찮아요</span>
        </Button>
        <Button
          onClick={handleStartGuide}
          tone="primary"
          size="lg"
          className="flex-1"
        >
          <span className="font-semibold">10초 가이드 시작하기</span>
        </Button>
      </div>
    </Modal>
  );
}

export default TranscriptEditGuideModal;

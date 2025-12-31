import { useEffect } from 'react';

import { useQueryClient } from '@tanstack/react-query';
import confetti from 'canvas-confetti';

import { Button } from '@/components/ui/atoms/Button';
import { Modal } from '@/components/ui/composites/Modal';
import { useToast } from '@/components/ui/composites/Toast';
import { cn } from '@/lib/cn';
import { useAuthStore } from '@/stores/authStore';
import { useQuestStore } from '@/stores/questStore';

import { GiftBoxAnimation } from './GiftBoxAnimation';

const MISSION_CONTENT: Record<number, { title: string; description: string }> =
  {
    1: {
      title: '기록의 부담이 조금 가벼워지셨나요?',
      description:
        '복잡한 정리는 이제 마음토스가 맡을게요.\n이번엔 상담의 흐름을 한 눈에 읽는 법을 보여드릴게요.',
    },
    2: {
      title: '상담의 맥락까지 짚어드릴게요.',
      description:
        '가끔 상담이 어려울 때는, 다회기 분석으로\n상담의 방향을 차근차근 짚어보세요.\n이제 가지고 계신 파일을 직접 업로드해볼까요?',
    },
    3: {
      title: '이제 받아쓰기는 그만하셔도 돼요.',
      description:
        '기록은 저에게 맡기고 상담에만 집중하세요.\n마지막 정보만 입력하면 1개월 이용권이 지급됩니다!',
    },
  };

export const CompleteMissionModal = () => {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const {
    showCompleteModalStep,
    setShowCompleteModalStep,
    getReward,
    isLoading,
  } = useQuestStore();
  const { toast } = useToast();

  const isOpen = showCompleteModalStep !== null;
  const content = showCompleteModalStep
    ? MISSION_CONTENT[showCompleteModalStep]
    : null;

  const isFinalReward = showCompleteModalStep === 5;

  useEffect(() => {
    if (isOpen) {
      // 강렬한 단일 폭죽 효과
      confetti({
        particleCount: 150,
        spread: 70,
        origin: { y: 0.6 }, // 모달 위치 근처에서 시작
        zIndex: 9999,
      });
    }
  }, [isOpen]);

  if (!content && !isFinalReward) return null;

  const handleClose = () => {
    setShowCompleteModalStep(null);
  };

  const handleRewardClaim = async () => {
    if (user?.email && user?.id) {
      try {
        await getReward(user.email);

        // 보상 수령 축하 피드백
        toast({
          title: '선물 수령 완료! 🎁',
          description:
            '스타터 플랜 한 달 이용권이 지급되었습니다. 지금 바로 사용해보세요!',
        });

        // 한 번 더 화려한 폭죽 효과
        confetti({
          particleCount: 200,
          spread: 100,
          origin: { y: 0.5 },
          zIndex: 9999,
        });

        // 크레딧 정보 갱신
        await Promise.all([
          queryClient.invalidateQueries({
            queryKey: ['credit', 'subscription', Number(user.id)],
          }),
          queryClient.invalidateQueries({
            queryKey: ['credit', 'usage', Number(user.id)],
          }),
        ]);
        handleClose();
      } catch (err) {
        toast({
          title: '보상 수령 실패',
          description: '잠시 후 다시 시도해주세요.',
        });
        console.error('Reward claim failed:', err);
      }
    }
  };

  const today = new Date();
  const dateString = `${today.getFullYear()}년 ${today.getMonth() + 1}월 ${today.getDate()}일`;

  return (
    <Modal
      open={isOpen}
      onOpenChange={handleClose}
      className={cn(
        isFinalReward ? 'max-w-[480px]' : 'max-w-[512px]',
        'border-none p-0'
      )}
    >
      <div className="flex flex-col items-center px-8 py-6 text-center">
        {isFinalReward ? (
          <>
            <h2 className="mb-8 text-2xl font-bold leading-tight text-fg">
              이제 마음토스가 늘 곁에 있을게요
            </h2>
            <div className="mb-6 whitespace-pre-wrap text-lg font-bold leading-relaxed text-fg">
              상담에만 온전히 집중하실 수 있도록,
              <br />
              1개월 무료 이용권으로 첫걸음을 응원합니다.
            </div>
            <p className="mb-8 text-sm font-medium text-fg-muted">
              *{dateString}부터 한 달 동안
              <br />
              스타터 플랜(500 크레딧)이 적용됩니다.
            </p>

            <GiftBoxAnimation className="mb-10" />

            <Button
              onClick={handleRewardClaim}
              tone="primary"
              size="lg"
              disabled={isLoading}
              className="h-12 w-full font-extrabold"
            >
              {isLoading ? '처리 중...' : '미션 보상 받기'}
            </Button>
          </>
        ) : (
          <>
            <h2 className="text-xl font-semibold text-fg">{content?.title}</h2>

            <div className="mt-6 whitespace-pre-wrap text-base leading-relaxed text-fg">
              {content?.description}
            </div>

            <Button
              onClick={handleClose}
              tone="primary"
              size="lg"
              className="mt-6 w-full max-w-[375px] font-bold"
            >
              다음 미션 시작하기
            </Button>
          </>
        )}
      </div>
    </Modal>
  );
};

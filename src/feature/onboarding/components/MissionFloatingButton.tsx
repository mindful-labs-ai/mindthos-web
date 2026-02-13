import React from 'react';

// ICON 변경: Check, Gift는 Lucide 직접 사용 중
import { Check, Gift } from 'lucide-react';

import { Button } from '@/components/ui/atoms/Button';
import { cn } from '@/lib/cn';
import { useAuthStore } from '@/stores/authStore';
import { useQuestStore } from '@/stores/questStore';

import { useTutorial } from '../hooks/useTutorial';

const QUESTS = [
  { id: 1, label: '상담기록 예시 보기' },
  { id: 2, label: '다회기 분석 예시 보기' },
  { id: 3, label: '녹음 파일 업로드하기' },
  { id: 4, label: '내 정보 입력하기' },
];

interface MissionFloatingButtonProps {
  onOpenUserEdit?: () => void;
}

export const MissionFloatingButton: React.FC<MissionFloatingButtonProps> = ({
  onOpenUserEdit,
}) => {
  const [isOpen, setIsOpen] = React.useState(false);
  const panelRef = React.useRef<HTMLDivElement>(null);
  const buttonRef = React.useRef<HTMLButtonElement>(null);

  const { currentLevel, shouldShowOnboarding, startedAt, isLoading } =
    useQuestStore();
  const email = useAuthStore((state) => state.user?.email);
  const { endTutorial, startTutorial, nextTutorialStep } = useTutorial({
    currentLevel,
  });

  // 외부 클릭 시 닫기
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        panelRef.current &&
        !panelRef.current.contains(event.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // 온보딩이 활성화되지 않으면 렌더링하지 않음
  if (!shouldShowOnboarding) return null;

  // QuestStep과 동일한 완료 카운트 계산 로직
  const totalSteps = QUESTS.length;
  let activeCompletedCount = 0;
  if (currentLevel >= 2) activeCompletedCount++;
  if (currentLevel >= 3) activeCompletedCount++;
  if (currentLevel >= 5) activeCompletedCount++;
  if (currentLevel >= 6) activeCompletedCount++;

  const isAllCompleted = activeCompletedCount === totalSteps;

  // 남은 기간 계산
  const calculateRemainingDays = (start: string | null) => {
    if (!start) return 7;
    const startDate = new Date(start);
    const now = new Date();
    const endDate = new Date(startDate);
    endDate.setDate(startDate.getDate() + 7);
    const diff = endDate.getTime() - now.getTime();
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  };
  const remainingDays = calculateRemainingDays(startedAt);

  // QuestStep과 동일한 퀘스트 상태 계산 로직
  const getQuestStatus = (questId: number) => {
    if (questId === 1) {
      return {
        isCompleted: currentLevel >= 2,
        isInProgress: currentLevel === 1,
      };
    }
    if (questId === 2) {
      return {
        isCompleted: currentLevel >= 3,
        isInProgress: currentLevel === 2,
      };
    }
    if (questId === 3) {
      return {
        isCompleted: currentLevel >= 5,
        isInProgress: currentLevel === 3 || currentLevel === 4,
      };
    }
    if (questId === 4) {
      return {
        isCompleted: currentLevel >= 6,
        isInProgress: currentLevel === 5,
      };
    }
    return { isCompleted: false, isInProgress: false };
  };

  const handleRewardClick = () => {
    if (isAllCompleted && email) {
      useQuestStore.getState().setShowCompleteModalStep(5);
      setIsOpen(false);
    }
  };

  // 미션 진행하기 클릭 핸들러
  const handleStartMission = (questId: number) => {
    // Quest 4 (내 정보 입력하기)는 모달 열기
    if (questId === 4) {
      onOpenUserEdit?.();
      setIsOpen(false);
      return;
    }

    // 나머지 퀘스트는 튜토리얼 시작
    endTutorial();
    startTutorial();
    nextTutorialStep();
    setIsOpen(false);
  };

  return (
    <>
      {/* 플로팅 버튼 */}
      <button
        ref={buttonRef}
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'fixed bottom-6 right-6 z-40',
          'flex flex-col items-center justify-center',
          'h-20 w-20 rounded-full',
          'border-2 border-primary bg-white',
          'shadow-lg hover:shadow-xl',
          'transition-all duration-200',
          'hover:scale-105 active:scale-95'
        )}
      >
        <Gift className="h-6 w-6 text-primary" />
        <span className="mt-1 text-xs font-bold text-primary">
          미션 진행 중
        </span>
      </button>

      {/* 미션 리스트 패널 */}
      {isOpen && (
        <div
          ref={panelRef}
          className={cn(
            'fixed bottom-28 right-6 z-50',
            'w-[352px] rounded-2xl',
            'border border-border bg-white',
            'shadow-2xl',
            'animate-in fade-in slide-in-from-bottom-4 duration-200',
            'select-none'
          )}
        >
          <div className="p-6">
            {/* 헤더 */}
            <h3 className="text-xl font-bold text-fg">신규 가입자 미션</h3>

            {/* 진행률 바 */}
            <div className="mt-4 flex items-center gap-3">
              <div className="h-2 flex-1 overflow-hidden rounded-full bg-surface-strong">
                <div
                  className="h-full rounded-full bg-primary transition-all duration-500"
                  style={{
                    width: `${(activeCompletedCount / totalSteps) * 100}%`,
                  }}
                />
              </div>
              <span className="text-sm font-medium text-fg-muted">
                {activeCompletedCount}/{totalSteps} 완료
              </span>
            </div>

            {/* 미션 리스트 */}
            <div className="mt-6 space-y-4">
              {QUESTS.map((quest) => {
                const { isCompleted, isInProgress } = getQuestStatus(quest.id);

                return (
                  <div
                    key={quest.id}
                    className="flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      {/* 체크 아이콘 - QuestStep과 동일한 스타일 */}
                      <div
                        className={cn(
                          'flex h-7 w-7 items-center justify-center rounded-full border-2 transition-colors duration-300',
                          isCompleted
                            ? 'border-primary bg-primary text-white'
                            : isInProgress
                              ? 'border-primary bg-surface text-primary'
                              : 'border-fg-muted bg-surface text-fg-muted'
                        )}
                      >
                        <Check size={14} strokeWidth={3} />
                      </div>
                      <span
                        className={cn(
                          'text-sm font-medium',
                          isCompleted
                            ? 'text-fg'
                            : isInProgress
                              ? 'font-bold text-fg'
                              : 'text-fg-muted'
                        )}
                      >
                        {quest.label}
                      </span>
                    </div>
                    {isCompleted ? (
                      <span className="text-sm font-medium text-fg-muted">
                        완료
                      </span>
                    ) : isInProgress ? (
                      <button
                        onClick={() => handleStartMission(quest.id)}
                        className="text-sm font-bold text-primary hover:text-primary-600 hover:underline"
                      >
                        진행하기
                      </button>
                    ) : null}
                  </div>
                );
              })}
            </div>

            {/* 남은 기간 */}
            <div className="mt-6">
              {!isAllCompleted && (
                <p className="text-center text-sm font-bold text-danger">
                  남은 기간 {remainingDays}일
                </p>
              )}
            </div>

            {/* 보상 받기 버튼 */}
            <Button
              tone="primary"
              variant={isAllCompleted ? 'solid' : 'ghost'}
              size="lg"
              className="mt-4 w-full font-bold"
              disabled={!isAllCompleted || isLoading || currentLevel >= 7}
              onClick={handleRewardClick}
            >
              {currentLevel >= 7 ? '보상 받기 완료!' : '미션 보상 받기'}
            </Button>
          </div>
        </div>
      )}
    </>
  );
};

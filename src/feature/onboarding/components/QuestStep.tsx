import { Check } from 'lucide-react';

import { Button } from '@/components/ui';
import { useTutorial } from '@/feature/onboarding/hooks/useTutorial';
import { cn } from '@/lib/cn';
import { useAuthStore } from '@/stores/authStore';
import { useQuestStore } from '@/stores/questStore';

interface QuestStepProps {
  completedStepCount?: number;
  remainingDays?: number;
  onAction?: (questId: number) => void;
  onOpenCreateSession?: () => void;
  onOpenUserEdit?: () => void;
  hasSession?: boolean;
  onCompleteQuest3?: () => void;
}

const QUESTS = [
  { id: 1, label: '상담기록 예시 보기' },
  { id: 2, label: '다회기 분석 예시 보기' },
  { id: 3, label: '녹음 파일 업로드하기' },
  { id: 4, label: '내 정보 입력하기' },
];

export const QuestStep = ({
  remainingDays = 7,
  onOpenCreateSession,
  onOpenUserEdit,
  hasSession = false,
  onCompleteQuest3,
}: QuestStepProps) => {
  const user = useAuthStore((state) => state.user);
  const email = user?.email;
  const { currentLevel, isLoading } = useQuestStore();
  const { startTutorial, nextTutorialStep, endTutorial } = useTutorial({
    currentLevel,
  });
  // 전체 단계 수
  const totalSteps = QUESTS.length;
  // 실제 완료된 퀘스트 수 계산 (레벨 매핑에 따름)
  let activeCompletedCount = 0;
  if (currentLevel >= 2) activeCompletedCount++;
  if (currentLevel >= 3) activeCompletedCount++;
  if (currentLevel >= 5) activeCompletedCount++;
  if (currentLevel >= 6) activeCompletedCount++;

  // 모든 미션이 완료되었는지 여부
  const isAllCompleted = activeCompletedCount === totalSteps;

  // 마일스톤 진행률 계산 (선 그래프용)
  const progressPercentage =
    activeCompletedCount > 0
      ? (activeCompletedCount / (totalSteps - 1)) * 100
      : 0;

  return (
    <div className="w-full rounded-xl border border-primary bg-surface px-7 py-6">
      <div className="flex items-center">
        <div className="flex-1">
          <div className="mb-6 flex items-center gap-5">
            <h3 className="text-xl font-semibold text-fg">신규 가입자 미션</h3>
            <span className="text-sm text-fg-muted">
              {activeCompletedCount}/{totalSteps} 완료
            </span>
          </div>
          <div className="flex-1 px-6">
            <div className="relative">
              {/* 회색 배경 선 (전체 구간) - 첫 번째 아이템 중앙(12.5%)에서 마지막 아이템 중앙(87.5%)까지 연결 */}
              <div className="absolute left-[12.5%] top-4 -z-0 h-[4px] w-[75%] -translate-y-1/2 bg-surface-strong" />

              {/* 초록색 진행 선 (완료된 구간) */}
              <div
                className="absolute left-[12.5%] top-4 -z-0 h-[4px] -translate-y-1/2 bg-primary transition-all duration-500"
                style={{
                  width: `${Math.min(Math.max(progressPercentage, 0), 100) * 0.75}%`,
                }}
              />

              {/* 스텝 아이템들 */}
              <div className="relative flex justify-between gap-6 px-2">
                {QUESTS.map((quest) => {
                  /* 
                    퀘스트 상태 매핑 로직 (getQuestLevel 참고)
                    Quest 1: 상담기록 (Level 1~2) -> Level 2 이상이면 완료
                    Quest 2: 다회기 (Level 2~3) -> Level 3 이상이면 완료
                    Quest 3: 새 기록 (Level 3~5) -> Level 5 이상이면 완료 (4는 진행중)
                    Quest 4: 내 정보 (Level 5~7) -> Level 7 이상이면 완료 (6은 진행중)
                  */
                  const getQuestStatus = () => {
                    if (quest.id === 1) {
                      return {
                        isCompleted: currentLevel >= 2,
                        isInProgress: currentLevel === 1,
                        isAlreadyStarted: false,
                        isLocked: false,
                        canComplete: false,
                      };
                    }
                    if (quest.id === 2) {
                      return {
                        isCompleted: currentLevel >= 3,
                        isInProgress: currentLevel === 2,
                        isAlreadyStarted: false,
                        isLocked: currentLevel < 2,
                        canComplete: false,
                      };
                    }
                    if (quest.id === 3) {
                      // 세션이 있으면 미션 완료 가능 상태
                      const canComplete =
                        hasSession &&
                        (currentLevel === 3 || currentLevel === 4);
                      return {
                        isCompleted: currentLevel >= 5,
                        isInProgress: currentLevel === 3 || currentLevel === 4,
                        isAlreadyStarted: currentLevel === 4, // 레벨 4는 이미 생성 모달 진입 상태
                        isLocked: currentLevel < 3,
                        canComplete, // 세션이 있으면 완료 가능
                      };
                    }
                    if (quest.id === 4) {
                      return {
                        isCompleted: currentLevel >= 6,
                        isInProgress: currentLevel === 5,
                        isAlreadyStarted: false,
                        isLocked: currentLevel < 5,
                        canComplete: false,
                      };
                    }
                    return {
                      isCompleted: false,
                      isInProgress: false,
                      isAlreadyStarted: false,
                      isLocked: true,
                      canComplete: false,
                    };
                  };

                  const {
                    isCompleted,
                    isInProgress,
                    isAlreadyStarted,
                    isLocked,
                    canComplete,
                  } = getQuestStatus();

                  // 모든 미션 완료 상태 예외 처리

                  return (
                    <div
                      key={quest.id}
                      className="flex flex-1 flex-col items-center gap-2"
                    >
                      {/* 체크 아이콘 원형 배지 */}
                      <div
                        className={cn(
                          'flex h-8 w-8 items-center justify-center rounded-full border-2 transition-colors duration-300',
                          isCompleted
                            ? 'border-primary bg-primary text-white' // 완료됨
                            : isInProgress
                              ? 'border-primary bg-surface text-primary' // 진행중
                              : 'border-fg-muted bg-surface text-fg-muted' // 미완료
                        )}
                      >
                        <Check size={18} strokeWidth={3} />
                      </div>

                      {/* 라벨 텍스트 */}
                      <p className="min-h-[2.5rem] w-full max-w-[140px] break-keep text-center text-base font-medium text-fg">
                        {quest.label}
                      </p>

                      {/* 액션 버튼 */}
                      <div className="w-full max-w-[147px] px-1">
                        <div className="relative">
                          <Button
                            variant={isInProgress ? 'solid' : 'ghost'}
                            tone={isInProgress ? 'primary' : 'neutral'}
                            disabled={!isInProgress || isLoading}
                            className={cn(
                              'h-9 w-full text-sm shadow-none',
                              // 완료되었거나 잠긴 상태면 배경색과 텍스트 색상을 dimmed 처리
                              !isInProgress &&
                                'cursor-not-allowed bg-surface-contrast text-fg-muted hover:bg-surface-contrast',
                              // 미션 진행하기 상태 (아직 시작 안 함) - 펄스 글로우 애니메이션
                              isInProgress &&
                                !isAlreadyStarted &&
                                'animate-pulse-glow'
                            )}
                            onClick={() => {
                              if (!isInProgress) return;

                              // Quest 3: 세션이 있으면 미션 완료하기
                              if (quest.id === 3 && canComplete) {
                                onCompleteQuest3?.();
                                return;
                              }

                              // 이미 시작된 상태(진행 중)라면 바로 해당 기능 실행
                              if (isAlreadyStarted) {
                                if (quest.id === 3) {
                                  onOpenCreateSession?.();
                                } else if (quest.id === 4) {
                                  onOpenUserEdit?.();
                                }
                                return;
                              }
                              // 튜토리얼 액션이 필요 없는 단순 미션 처리 (Quest 4 등)
                              if (quest.id === 4) {
                                onOpenUserEdit?.();
                                return;
                              }

                              // 튜토리얼 액션 래퍼 사용
                              endTutorial();
                              startTutorial();
                              nextTutorialStep();
                            }}
                          >
                            {isCompleted
                              ? '미션 완료!'
                              : quest.id === 3 && canComplete
                                ? '미션 완료하기'
                                : isAlreadyStarted
                                  ? `${quest.id === 3 ? '바로 업로드하기' : '미션 진행 중'}`
                                  : isLocked
                                    ? '이전 단계 후 오픈'
                                    : '미션 진행하기'}
                          </Button>
                          {/* 미션 진행 중 상태 - 쉬머 오버레이 */}
                          {isAlreadyStarted && (
                            <div className="animate-progress pointer-events-none absolute inset-0 rounded-lg" />
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* 보상 정보 */}
        <div className="flex min-w-[277px] flex-col items-center justify-center rounded-xl bg-primary-50 p-4 text-center">
          <div className="mb-2 text-center text-2xl">
            🎁
            <h3 className="mb-4 text-base font-bold text-fg">
              모든 미션 달성 시<br />
              <span className="text-primary-600">스타터 1개월</span> 무료 지급!
            </h3>
          </div>

          {!isAllCompleted && (
            <p className="mb-3 text-xs font-medium text-danger">
              남은 기간 {remainingDays}일
            </p>
          )}

          <Button
            className="w-full"
            tone="primary"
            variant="solid"
            disabled={!isAllCompleted || isLoading || currentLevel >= 7}
            onClick={async () => {
              if (email) {
                // 바로 보상을 받는 대신, 선물상자 모달(Step 5)을 띄움
                useQuestStore.getState().setShowCompleteModalStep(5);
              }
            }}
          >
            {currentLevel >= 7 ? '보상 받기 완료!' : '미션 보상 받기'}
          </Button>
        </div>
      </div>
    </div>
  );
};

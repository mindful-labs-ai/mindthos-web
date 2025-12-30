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
}

const QUESTS = [
  { id: 1, label: '상담기록 예시 보기' },
  { id: 2, label: '다회기 분석 예시 보기' },
  { id: 3, label: '새 상담 기록 만들기' },
  { id: 4, label: '내 정보 입력하기' },
];

export const QuestStep = ({
  completedStepCount = 1,
  remainingDays = 7,
}: QuestStepProps) => {
  const email = useAuthStore((state) => state.user?.email);
  const { getReward } = useQuestStore();
  const { startTutorial, nextTutorialStep, endTutorial } = useTutorial({
    currentLevel: completedStepCount + 1,
  });

  // 전체 단계 수
  const totalSteps = QUESTS.length;
  // 모든 미션이 완료되었는지 여부
  const isAllCompleted = completedStepCount === totalSteps;

  // 마일스톤 진행률 계산 (선 그래프용)
  // 예: 1단계 완료 -> 0% (선 없음), 2단계 완료 -> 33% (1-2 연결), 4단계 완료 -> 100%
  const progressPercentage =
    completedStepCount > 0
      ? ((completedStepCount - 1) / (totalSteps - 1)) * 100
      : 0;

  return (
    <div className="w-full rounded-xl border border-border bg-surface px-7 py-6">
      <div className="flex items-center">
        <div className="flex-1">
          <div className="mb-6 flex items-center gap-5">
            <h3 className="text-xl font-semibold text-fg">
              신규 가입자 미션 이벤트
            </h3>
            <span className="text-sm text-fg-muted">
              {completedStepCount}/{totalSteps} 완료
            </span>
          </div>
          <div className="flex-1 px-6">
            <div className="relative">
              {/* 회색 배경 선 (전체 구간) - 첫 번째 아이템 중앙(12.5%)에서 마지막 아이템 중앙(87.5%)까지 연결 */}
              <div className="absolute left-[12.5%] top-5 -z-0 h-[2px] w-[75%] -translate-y-1/2 bg-surface-strong" />

              {/* 초록색 진행 선 (완료된 구간) */}
              <div
                className="absolute left-[12.5%] top-5 -z-0 h-[2px] -translate-y-1/2 bg-primary transition-all duration-500"
                style={{
                  width: `${Math.min(Math.max(progressPercentage, 0), 100) * 0.75}%`,
                }}
              />

              {/* 스텝 아이템들 */}
              <div className="relative z-10 flex justify-between gap-6 px-2">
                {QUESTS.map((quest, index) => {
                  const stepNumber = index + 1;
                  // 해당 단계가 완료되었는지 (현재 단계보다 이전이거나 같으면 X -> 카운트 기준)
                  // completedStepCount가 1이면, 1단계(index 0)만 완료된 상태.
                  const isCompleted = stepNumber <= completedStepCount;
                  // 현재 진행해야 할 단계인지
                  const isCurrent = stepNumber === completedStepCount + 1;
                  // 아직 열리지 않은 단계인지 (현재 단계보다 미래)
                  const isLocked = stepNumber > completedStepCount + 1;

                  // 모든 미션 완료 시 처리: 모두 완료 상태로 표시
                  const isFinalState = isAllCompleted;

                  return (
                    <div
                      key={quest.id}
                      className="flex flex-1 flex-col items-center gap-2"
                    >
                      {/* 체크 아이콘 원형 배지 */}
                      <div
                        className={cn(
                          'flex h-10 w-10 items-center justify-center rounded-full border-2 transition-colors duration-300',
                          isCompleted || isFinalState
                            ? 'border-primary bg-primary text-white' // 완료됨
                            : 'border-surface-strong bg-surface text-fg-muted' // 미완료
                        )}
                      >
                        <Check size={22} strokeWidth={3} />
                      </div>

                      {/* 라벨 텍스트 */}
                      <p className="min-h-[2.5rem] w-full max-w-[140px] break-keep text-center text-sm font-medium text-fg">
                        {quest.label}
                      </p>

                      {/* 액션 버튼 */}
                      <div className="w-full px-1">
                        <Button
                          variant={
                            isCurrent && !isFinalState ? 'solid' : 'ghost'
                          }
                          tone={
                            isCurrent && !isFinalState ? 'primary' : 'neutral'
                          }
                          disabled={isCompleted || isLocked || isFinalState}
                          className={cn(
                            'h-9 w-full text-xs shadow-none',
                            // 완료되었거나 잠긴 상태면 배경색과 텍스트 색상을 dimmed 처리
                            (isCompleted || isLocked || isFinalState) &&
                              'cursor-not-allowed bg-surface-contrast text-fg-muted hover:bg-surface-contrast'
                          )}
                          onClick={() => {
                            if (isLocked || isCompleted || isFinalState) return;

                            // 튜토리얼 액션 래퍼 사용
                            // Step 0에서 버튼 클릭 -> 튜토리얼 시작 및 Step 1로 이동
                            if (quest.id) {
                              endTutorial();
                              startTutorial();
                              nextTutorialStep();
                              return;
                            }
                          }}
                        >
                          {isCompleted || isFinalState
                            ? '미션 완료!'
                            : isLocked
                              ? '이전 단계 후 오픈'
                              : '미션 진행하기'}
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* 보상 정보 */}
        <div className="flex min-w-[300px] flex-col items-center justify-center rounded-xl border-2 border-primary-300 bg-primary-50 p-4 text-center">
          <div className="mb-2 text-start text-2xl">
            🎁
            <h3 className="mb-4 text-base font-bold text-fg">
              모든 미션 달성 시<br />
              <span className="text-primary-600">스타터 1개월</span> 무료 쿠폰
              지급!
            </h3>
          </div>

          <p className="mb-3 text-xs font-medium text-danger">
            남은 기간 {remainingDays}일
          </p>

          <Button
            className="w-full"
            tone="primary"
            variant="solid"
            disabled={!isAllCompleted}
            onClick={() => {
              if (email) getReward(email);
            }}
          >
            이벤트 보상 받기
          </Button>
        </div>
      </div>
    </div>
  );
};

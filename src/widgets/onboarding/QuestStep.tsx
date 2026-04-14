// ICON 변경: Check는 Lucide 직접 사용 중
import { Check } from 'lucide-react';

import { cn } from '@/lib/cn';
import { useDevice } from '@/shared/hooks/useDevice';
import { Button } from '@/shared/ui';
import { useAuthStore } from '@/stores/authStore';
import { useQuestStore } from '@/stores/questStore';

// ─────────────────────────────────────────────────────────────────────────────
// Types & Constants
// ─────────────────────────────────────────────────────────────────────────────

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

interface QuestStatus {
  isCompleted: boolean;
  isInProgress: boolean;
  isAlreadyStarted: boolean;
  isLocked: boolean;
  canComplete: boolean;
}

// ─────────────────────────────────────────────────────────────────────────────
// Presenter: QuestHeader (타이틀 + 완료 카운트)
// ─────────────────────────────────────────────────────────────────────────────

const QuestHeader: React.FC<{
  completed: number;
  total: number;
  className?: string;
}> = ({ completed, total, className }) => (
  <div
    className={cn(
      'line-clamp-1 flex items-center justify-between truncate',
      className
    )}
  >
    <h3 className="text-l font-headline text-grey-100">
      신규 가입자 미션 이벤트
    </h3>
    <span className="text-sm font-sub text-grey-70">
      {completed}/{total} 완료
    </span>
  </div>
);

// ─────────────────────────────────────────────────────────────────────────────
// Presenter: StepBadge (단일 원형 체크 배지)
// ─────────────────────────────────────────────────────────────────────────────

const StepBadge: React.FC<{
  isCompleted: boolean;
  isInProgress: boolean;
  size?: 'sm' | 'md';
  className?: string;
}> = ({ isCompleted, isInProgress, size = 'md', className }) => {
  const iconSize = size === 'sm' ? 12 : 18;
  const badgeSize = size === 'sm' ? 'size-6' : 'size-9';

  return (
    <div
      className={cn(
        'flex items-center justify-center rounded-full border-[1.5px] transition-colors',
        badgeSize,
        isCompleted
          ? 'border-green-80 bg-green-80 text-white'
          : isInProgress
            ? 'scale-125 border-green-80 bg-white text-green-80'
            : 'border-grey-40 bg-white text-grey-40',
        className
      )}
    >
      <Check size={iconSize} strokeWidth={3} />
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Presenter: StepBadges (배지 목록 + 연결선)
// ─────────────────────────────────────────────────────────────────────────────

const StepBadges: React.FC<{
  quests: typeof QUESTS;
  getStatus: (questId: number) => QuestStatus;
  size?: 'sm' | 'md';
  className?: string;
}> = ({ quests, getStatus, size = 'md', className }) => {
  // 완료된 퀘스트 수로 진행선 비율 계산
  let completedCount = 0;
  quests.forEach((q) => {
    if (getStatus(q.id).isCompleted) completedCount++;
  });
  const progressWidth =
    completedCount > 0 ? (completedCount / (quests.length - 1)) * 100 : 0;

  // 4개 스텝 기준: 첫 배지 중심 12.5%, 마지막 배지 중심 87.5%
  return (
    <div className={cn('relative flex justify-between px-2', className)}>
      {/* 회색 배경 선 */}
      <div className="absolute left-[12.5%] right-[12.5%] top-1/2 h-[3px] -translate-y-1/2 bg-grey-30" />
      {/* 초록색 진행 선 */}
      <div
        className="absolute left-[12.5%] top-1/2 h-[3px] -translate-y-1/2 bg-green-80 transition-all duration-500"
        style={{ width: `${Math.min(progressWidth, 100) * 0.75}%` }}
      />
      {/* 배지 */}
      {quests.map((quest) => {
        const { isCompleted, isInProgress } = getStatus(quest.id);
        return (
          <div
            key={quest.id}
            className="relative z-[1] flex flex-1 justify-center"
          >
            <StepBadge
              isCompleted={isCompleted}
              isInProgress={isInProgress}
              size={size}
            />
          </div>
        );
      })}
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Presenter: RewardBanner (상단 배너형 보상 안내)
// ─────────────────────────────────────────────────────────────────────────────

const RewardBanner: React.FC<{
  isAllCompleted: boolean;
  remainingDays: number;
}> = ({ isAllCompleted, remainingDays }) => (
  <div className="flex flex-col items-start gap-y-2 rounded-2xl border border-green-80 bg-green-10 px-5 pb-5 pt-3">
    <div className="flex w-full items-center justify-between gap-3">
      <div className="mx-0.5 flex size-8 items-center justify-center">
        <span className="text-2xl">🎁</span>
      </div>
      {!isAllCompleted && (
        <span className="text-sm font-emphasize text-[#C62828]">
          남은 기간 {remainingDays}일
        </span>
      )}
    </div>
    <p className="text-m font-headline text-grey-100">
      모든 미션 달성 시 <span className="text-green-80">스타터 1개월</span> 무료
      쿠폰 지급!
    </p>
  </div>
);

// ─────────────────────────────────────────────────────────────────────────────
// Presenter: RewardCard (우측 카드형 보상 안내)
// ─────────────────────────────────────────────────────────────────────────────

const RewardCard: React.FC<{
  isAllCompleted: boolean;
  remainingDays: number;
  isLoading: boolean;
  currentLevel: number;
  email?: string;
  className?: string;
}> = ({
  isAllCompleted,
  remainingDays,
  isLoading,
  currentLevel,
  email,
  className,
}) => (
  <div
    className={cn(
      'flex flex-col items-center justify-between rounded-2xl border border-green-80 px-6 pb-[18px] pt-[18px]',
      className
    )}
  >
    <div className="">
      <div className="mx-0.5 flex size-8 items-center justify-center">
        <span className="text-2xl">🎁</span>
      </div>
      <h3 className="text-start text-l font-headline text-grey-100">
        모든 미션 달성 시<br />
        <span className="text-green-80">스타터 1개월</span> 무료 쿠폰 지급!
      </h3>
    </div>
    <div className="flex w-full flex-col gap-y-2 text-center">
      {!isAllCompleted && (
        <p className="text-sm font-emphasize text-[#C62828]">
          남은 기간 {remainingDays}일
        </p>
      )}
      <button
        className="transition-default focus-default typo-sm interact-primary-bg inline-flex h-10 w-full items-center justify-center gap-2 rounded-md px-4 font-medium text-primary-fg disabled:cursor-not-allowed disabled:bg-surface-contrast disabled:text-fg-muted"
        disabled={!isAllCompleted || isLoading || currentLevel >= 7}
        onClick={() => {
          if (email) useQuestStore.getState().setShowCompleteModalStep(5);
        }}
      >
        {currentLevel >= 7 ? '보상 받기 완료!' : '이벤트 보상 받기'}
      </button>
    </div>
  </div>
);

// ─────────────────────────────────────────────────────────────────────────────
// Presenter: CurrentQuestAction (현재 퀘스트 라벨 + 버튼)
// ─────────────────────────────────────────────────────────────────────────────

const CurrentQuestAction: React.FC<{
  label: string;
  buttonLabel: string;
  isLoading: boolean;
  onClick: () => void;
  className?: string;
}> = ({ label, buttonLabel, isLoading, onClick, className }) => (
  <div className={cn('flex flex-col items-center gap-4', className)}>
    <p className="text-m font-medium text-grey-100">{label}</p>
    <Button
      variant="solid"
      tone="primary"
      disabled={isLoading}
      className="w-full max-w-[300px]"
      onClick={onClick}
    >
      {buttonLabel}
    </Button>
  </div>
);

// ─────────────────────────────────────────────────────────────────────────────
// Container: QuestStep
// ─────────────────────────────────────────────────────────────────────────────

export const QuestStep = ({
  remainingDays = 7,
  onOpenCreateSession,
  onOpenUserEdit,
  hasSession = false,
  onCompleteQuest3,
}: QuestStepProps) => {
  const { isMobile, isTablet } = useDevice();
  const user = useAuthStore((state) => state.user);
  const email = user?.email;
  const { currentLevel, isLoading, setTutorialGuideLevel } = useQuestStore();

  const totalSteps = QUESTS.length;

  // 완료 카운트
  let activeCompletedCount = 0;
  if (currentLevel >= 2) activeCompletedCount++;
  if (currentLevel >= 3) activeCompletedCount++;
  if (currentLevel >= 5) activeCompletedCount++;
  if (currentLevel >= 6) activeCompletedCount++;

  const isAllCompleted = activeCompletedCount === totalSteps;
  const progressPercentage =
    activeCompletedCount > 0
      ? (activeCompletedCount / (totalSteps - 1)) * 100
      : 0;

  // 퀘스트 상태 계산
  const getQuestStatus = (questId: number): QuestStatus => {
    if (questId === 1)
      return {
        isCompleted: currentLevel >= 2,
        isInProgress: currentLevel === 1,
        isAlreadyStarted: false,
        isLocked: false,
        canComplete: false,
      };
    if (questId === 2)
      return {
        isCompleted: currentLevel >= 3,
        isInProgress: currentLevel === 2,
        isAlreadyStarted: false,
        isLocked: currentLevel < 2,
        canComplete: false,
      };
    if (questId === 3) {
      const canComplete = hasSession && currentLevel === 4;
      return {
        isCompleted: currentLevel >= 5,
        isInProgress: currentLevel === 3 || currentLevel === 4,
        isAlreadyStarted: currentLevel === 4,
        isLocked: currentLevel < 3,
        canComplete,
      };
    }
    if (questId === 4)
      return {
        isCompleted: currentLevel >= 6,
        isInProgress: currentLevel === 5,
        isAlreadyStarted: false,
        isLocked: currentLevel < 5,
        canComplete: false,
      };
    return {
      isCompleted: false,
      isInProgress: false,
      isAlreadyStarted: false,
      isLocked: true,
      canComplete: false,
    };
  };

  // 현재 진행 중인 퀘스트
  const currentQuest =
    QUESTS.find((q) => getQuestStatus(q.id).isInProgress) || QUESTS[0];
  const currentStatus = getQuestStatus(currentQuest.id);

  // 현재 퀘스트 버튼 핸들러
  const handleCurrentQuestClick = () => {
    if (currentQuest.id === 3 && currentStatus.canComplete) {
      onCompleteQuest3?.();
      return;
    }
    if (currentStatus.isAlreadyStarted) {
      if (currentQuest.id === 3) onOpenCreateSession?.();
      return;
    }
    if (currentQuest.id === 4) {
      onOpenUserEdit?.();
      return;
    }
    setTutorialGuideLevel(currentQuest.id);
  };

  const currentButtonLabel = currentStatus.canComplete
    ? '미션 완료하기'
    : currentStatus.isAlreadyStarted
      ? currentQuest.id === 3
        ? '바로 업로드하기'
        : '미션 진행 중'
      : '미션 진행하기';

  // ── 모바일 ──
  if (isMobile) {
    return (
      <div className="flex w-full flex-col gap-3">
        <RewardBanner
          isAllCompleted={isAllCompleted}
          remainingDays={remainingDays}
        />
        <div className="flex w-full flex-col items-center gap-5 rounded-2xl border border-grey-40 bg-white px-[26px] py-5">
          <QuestHeader
            completed={activeCompletedCount}
            total={totalSteps}
            className="w-full"
          />
          <StepBadges
            size="sm"
            quests={QUESTS}
            getStatus={getQuestStatus}
            className="w-full"
          />
          {isAllCompleted ? (
            <div className="flex w-full flex-col items-center gap-2">
              <Button
                variant="solid"
                tone="primary"
                className="w-full"
                disabled={isLoading || currentLevel >= 7}
                onClick={() => {
                  if (email)
                    useQuestStore.getState().setShowCompleteModalStep(5);
                }}
              >
                {currentLevel >= 7 ? '보상 받기 완료!' : '이벤트 보상 받기'}
              </Button>
            </div>
          ) : (
            <CurrentQuestAction
              label={currentQuest.label}
              buttonLabel={currentButtonLabel}
              isLoading={isLoading}
              onClick={handleCurrentQuestClick}
              className="w-full"
            />
          )}
        </div>
      </div>
    );
  }

  // ── 태블릿 ──
  if (isTablet) {
    return (
      <div className="w-full rounded-2xl border border-grey-40 bg-white px-7 py-6">
        <div className="flex items-center justify-between gap-6">
          <div className="flex flex-col items-center gap-4">
            <QuestHeader
              completed={activeCompletedCount}
              total={totalSteps}
              className="mb-6 w-full justify-start gap-5"
            />
            <StepBadges
              quests={QUESTS}
              getStatus={getQuestStatus}
              size="sm"
              className="w-full"
            />
            {!isAllCompleted && (
              <CurrentQuestAction
                label={currentQuest.label}
                buttonLabel={currentButtonLabel}
                isLoading={isLoading}
                onClick={handleCurrentQuestClick}
              />
            )}
          </div>
          <RewardCard
            isAllCompleted={isAllCompleted}
            remainingDays={remainingDays}
            isLoading={isLoading}
            currentLevel={currentLevel}
            email={email}
            className="min-w-[240px] border border-green-80"
          />
        </div>
      </div>
    );
  }

  // ── 데스크탑 ──
  return (
    <div className="flex w-full max-w-[1200px] rounded-2xl border border-grey-40 bg-white px-[18px] py-[16px]">
      <div className="flex w-full overflow-x-auto">
        <div className="flex-1 px-2.5 pb-3 pt-2">
          <QuestHeader
            completed={activeCompletedCount}
            total={totalSteps}
            className="mb-6 justify-start gap-5"
          />
          <div className="flex-1 px-6">
            {/** 데스크탑 Step 요소 */}
            <div className="relative">
              {/* 회색 배경 선 */}
              <div className="absolute left-[12.5%] top-[18px] -z-0 h-[4px] w-[75%] -translate-y-1/2 bg-surface-strong" />
              {/* 초록색 진행 선 */}
              <div
                className="absolute left-[12.5%] top-[18px] -z-0 h-[4px] -translate-y-1/2 bg-primary transition-all duration-500"
                style={{
                  width: `${Math.min(Math.max(progressPercentage, 0), 100) * 0.75}%`,
                }}
              />
              {/* 스텝 아이템들 */}
              <div className="relative flex justify-between gap-6 px-2">
                {QUESTS.map((quest) => {
                  const {
                    isCompleted,
                    isInProgress,
                    isAlreadyStarted,
                    isLocked,
                    canComplete,
                  } = getQuestStatus(quest.id);

                  return (
                    <div
                      key={quest.id}
                      className="flex flex-1 flex-col items-center gap-2"
                    >
                      <StepBadge
                        isCompleted={isCompleted}
                        isInProgress={isInProgress}
                        size="md"
                      />
                      <p className="typo-m line-clamp-1 min-h-[2.5rem] w-full max-w-[140px] truncate text-center font-medium text-fg">
                        {quest.label}
                      </p>
                      <div className="w-full max-w-[147px] px-1">
                        <div className="relative">
                          <Button
                            variant={isInProgress ? 'solid' : 'ghost'}
                            tone={isInProgress ? 'primary' : 'neutral'}
                            disabled={!isInProgress || isLoading}
                            className={cn(
                              'typo-sm line-clamp-1 h-9 w-full truncate shadow-none',
                              !isInProgress &&
                                'cursor-not-allowed bg-surface-contrast text-fg-muted lg:hover:bg-surface-contrast',
                              isInProgress &&
                                !isAlreadyStarted &&
                                'animate-pulse-glow'
                            )}
                            onClick={() => {
                              if (!isInProgress) return;
                              if (quest.id === 3 && canComplete) {
                                onCompleteQuest3?.();
                                return;
                              }
                              if (isAlreadyStarted) {
                                if (quest.id === 3) onOpenCreateSession?.();
                                else if (quest.id === 4) onOpenUserEdit?.();
                                return;
                              }
                              if (quest.id === 4) {
                                onOpenUserEdit?.();
                                return;
                              }
                              setTutorialGuideLevel(quest.id);
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
        <RewardCard
          isAllCompleted={isAllCompleted}
          remainingDays={remainingDays}
          isLoading={isLoading}
          currentLevel={currentLevel}
          email={email}
          className="min-w-[277px]"
        />
      </div>
    </div>
  );
};

import React from 'react';

import type { SessionRecord } from '@/features/session/types';
import { FileSearchIcon, UploadIcon, UserPlusIcon } from '@/shared/icons';
import { Title } from '@/shared/ui';
import { Badge } from '@/shared/ui/atoms/Badge';
import { WelcomeBanner } from '@/shared/ui/composites/WelcomeBanner';
import { formatKoreanDate } from '@/shared/utils/date';
import { ActionCard } from '@/widgets/home/ActionCard';
import { GreetingSection } from '@/widgets/home/GreetingSection';
import { QuestStep } from '@/widgets/onboarding/QuestStep';
import { SessionRecordCard } from '@/widgets/session/SessionRecordCard';

export interface HomeViewProps {
  userName: string;
  isChecked: boolean;
  shouldShowOnboarding: boolean;
  isWelcomeBannerVisible: boolean;
  onCloseWelcomeBanner: () => void;
  completedCount: number;
  remainingDays: number;
  hasSession: boolean;
  isDummyFlow: boolean;
  isLoadingSessions: boolean;
  recentSessionRecords: SessionRecord[];
  hasMoreSessions: boolean;
  onGuideClick: () => void;
  onUploadClick: () => void;
  onAddCustomerClick: () => void;
  onViewAllRecordsClick: () => void;
  onSessionClick: (record: SessionRecord) => void;
  onCompleteQuest3: () => void;
  onOpenUserEdit: () => void;
}

export const HomeView: React.FC<HomeViewProps> = ({
  userName,
  isChecked,
  shouldShowOnboarding,
  isWelcomeBannerVisible,
  onCloseWelcomeBanner,
  completedCount,
  remainingDays,
  hasSession,
  isDummyFlow,
  isLoadingSessions,
  recentSessionRecords,
  hasMoreSessions,
  onGuideClick,
  onUploadClick,
  onAddCustomerClick,
  onViewAllRecordsClick,
  onSessionClick,
  onCompleteQuest3,
  onOpenUserEdit,
}) => {
  return (
    <div className="mx-auto w-full max-w-[1332px] p-16 text-left">
      {isChecked && (
        <div className="max-w-[1200px]">
          {shouldShowOnboarding ? (
            <QuestStep
              completedStepCount={completedCount}
              remainingDays={remainingDays}
              onOpenCreateSession={onUploadClick}
              onOpenUserEdit={onOpenUserEdit}
              hasSession={hasSession}
              onCompleteQuest3={onCompleteQuest3}
            />
          ) : (
            isWelcomeBannerVisible && (
              <WelcomeBanner
                title="마음토스 시작하기"
                description="아직 마음토스 사용법이 어렵다면, 가이드를 확인해보세요."
                buttonText="더 알아보기"
                onButtonClick={onGuideClick}
                onClose={onCloseWelcomeBanner}
              />
            )
          )}
        </div>
      )}

      <GreetingSection userName={userName} date={formatKoreanDate()} />

      <div className="mb-8 flex max-w-[1200px] flex-row gap-6">
        <ActionCard
          icon={<UploadIcon size={24} className="text-primary-500" />}
          title="녹음 파일 업로드하기"
          onClick={onUploadClick}
        />
        <ActionCard
          icon={<UserPlusIcon size={24} className="text-danger" />}
          title="클라이언트 추가하기"
          onClick={onAddCustomerClick}
        />
        <ActionCard
          icon={<FileSearchIcon size={24} className="text-warn" />}
          title="상담 기록 전체보기"
          onClick={onViewAllRecordsClick}
        />
      </div>

      <div>
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Title as="h2" className="text-xl font-semibold">
              지난 상담 기록
            </Title>
            {isDummyFlow && (
              <Badge tone="warning" variant="soft" size="sm">
                예시
              </Badge>
            )}
          </div>
        </div>

        <div className="space-y-4">
          {isLoadingSessions ? (
            <div className="rounded-lg border border-surface-strong bg-surface-contrast p-8 text-center">
              <p className="text-fg-muted">상담기록 목록을 불러오는 중...</p>
            </div>
          ) : recentSessionRecords.length > 0 ? (
            recentSessionRecords.map((record) => (
              <SessionRecordCard
                key={record.session_id}
                record={record}
                isReadOnly={isDummyFlow}
                onClick={onSessionClick}
              />
            ))
          ) : (
            <div className="rounded-lg border border-surface-strong bg-surface-contrast p-8 text-center">
              <p className="text-fg-muted">
                아직 상담 기록이 없습니다.
                <br />
                녹음 파일을 업로드하여 첫 상담 기록을 만들어보세요.
              </p>
            </div>
          )}
        </div>

        {hasMoreSessions && (
          <div className="mt-4 flex justify-center">
            <button
              type="button"
              onClick={onViewAllRecordsClick}
              className="w-full rounded-lg border-2 border-border bg-surface px-6 py-2.5 text-sm font-medium text-fg-muted transition-colors hover:bg-surface-contrast hover:text-fg"
            >
              더보기
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

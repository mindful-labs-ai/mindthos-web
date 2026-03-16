import React from 'react';

export interface SessionDetailViewProps {
  isContentEditing: boolean;
  // Widget slots
  audioElement: React.ReactNode;
  header: React.ReactNode;
  tab: React.ReactNode;
  toolbar: React.ReactNode;
  tabContent: React.ReactNode;
  audioPlayer: React.ReactNode;
  tabChangeModal: React.ReactNode;
  editGuideModal: React.ReactNode;
}

/**
 * 데스크톱 전용 세션 상세 레이아웃
 * 탭/헤더 고정, 콘텐츠만 내부 스크롤
 */
export const SessionDetailView: React.FC<SessionDetailViewProps> = ({
  isContentEditing,
  audioElement,
  header,
  tab,
  toolbar,
  tabContent,
  audioPlayer,
  tabChangeModal,
  editGuideModal,
}) => {
  return (
    <div className="mx-auto flex h-full w-full max-w-[min(100vw-535px,1332px)] flex-col overflow-hidden bg-surface-contrast">
      {audioElement}

      <div className="flex-shrink-0">{header}</div>

      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <div className="flex-shrink-0 select-none px-6 pt-2">{tab}</div>

        <div
          className={`relative mx-6 mb-2 flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border ${isContentEditing ? 'border-primary-500 bg-[#FDFFFE]' : 'border-surface-strong bg-surface'}`}
        >
          {toolbar}
          {tabContent}
        </div>
      </div>

      {audioPlayer && (
        <div className="flex-shrink-0 select-none">{audioPlayer}</div>
      )}

      {tabChangeModal}
      {editGuideModal}
    </div>
  );
};

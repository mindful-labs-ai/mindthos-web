import React from 'react';

export interface MobileSessionDetailViewProps {
  isContentEditing: boolean;
  audioElement: React.ReactNode;
  header: React.ReactNode;
  mobileHeader: React.ReactNode;
  tab: React.ReactNode;
  toolbar: React.ReactNode;
  tabContent: React.ReactNode;
  audioPlayer: React.ReactNode;
  tabChangeModal: React.ReactNode;
  editGuideModal: React.ReactNode;
}

export const MobileSessionDetailView: React.FC<
  MobileSessionDetailViewProps
> = ({
  isContentEditing,
  audioElement,
  header,
  mobileHeader,
  tab,
  toolbar,
  tabContent,
  audioPlayer,
  tabChangeModal,
  editGuideModal,
}) => {
  return (
    <div className="mx-auto flex h-full w-full max-w-full flex-col overflow-hidden bg-surface-contrast">
      {audioElement}

      <div className="flex-shrink-0">{header}</div>

      {/* 모바일: tab+mobileHeader+콘텐츠가 하나의 스크롤 영역 */}
      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
        <div className="flex-shrink-0 select-none px-1.5 pt-3">{tab}</div>

        {mobileHeader && <div className="flex-shrink-0">{mobileHeader}</div>}

        <div
          className={`relative mx-0 mb-0 flex-1 ${isContentEditing ? 'border-primary-500 bg-[#FDFFFE]' : 'bg-surface'}`}
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

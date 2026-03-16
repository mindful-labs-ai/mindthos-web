import React from 'react';

export interface SessionDetailViewProps {
  isContentEditing: boolean;
  // Widget slots
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

export const SessionDetailView: React.FC<SessionDetailViewProps> = ({
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
    <div className="mx-auto flex h-full w-full max-w-full flex-col overflow-hidden sm:max-w-[min(100vw-535px,1332px)]">
      {audioElement}

      <div className="flex-shrink-0">{header}</div>

      <div className="flex flex-shrink-0 select-none justify-start px-2 pt-2 sm:px-6">
        {tab}
      </div>

      {mobileHeader && <div className="flex-shrink-0">{mobileHeader}</div>}

      <div
        className={`relative mx-2 mb-2 min-h-0 flex-1 rounded-xl border sm:mx-6 ${isContentEditing ? 'border-primary-500 bg-[#FDFFFE]' : 'border-surface-strong bg-surface'}`}
      >
        {toolbar}
        {tabContent}
      </div>

      {audioPlayer && (
        <div className="flex-shrink-0 select-none">{audioPlayer}</div>
      )}

      {tabChangeModal}
      {editGuideModal}
    </div>
  );
};

import React from 'react';

export interface SessionDetailViewProps {
  isContentEditing: boolean;
  // Widget slots
  audioElement: React.ReactNode;
  header: React.ReactNode;
  tab: React.ReactNode;
  toolbar: React.ReactNode;
  /** 찾기·바꾸기 바 (툴바 아래 고정 헤더) */
  findReplace?: React.ReactNode;
  tabContent: React.ReactNode;
  audioPlayer: React.ReactNode;
  tabChangeModal: React.ReactNode;
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
  findReplace,
  tabContent,
  audioPlayer,
  tabChangeModal,
}) => {
  return (
    <div className="mx-auto flex h-full w-full max-w-[min(100vw-535px,1332px)] flex-col overflow-hidden bg-grey-20">
      {audioElement}

      <div className="flex-shrink-0">{header}</div>

      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <div className="flex-shrink-0 select-none px-6 pt-2">{tab}</div>

        <div
          className={`relative mx-6 mb-2 flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border ${isContentEditing ? 'border-green-80 bg-[#FDFFFE]' : 'border-grey-40 bg-white'}`}
        >
          {findReplace ? (
            // 찾기 열림: 찾기 바가 맨 위(전체폭), 편집 툴바는 그 아래(흐름 배치)
            <>
              <div className="flex-shrink-0 px-6 pt-2">{findReplace}</div>
              {toolbar}
            </>
          ) : (
            toolbar
          )}
          {tabContent}
        </div>
      </div>

      {audioPlayer && (
        <div className="flex-shrink-0 select-none">{audioPlayer}</div>
      )}

      {tabChangeModal}
    </div>
  );
};

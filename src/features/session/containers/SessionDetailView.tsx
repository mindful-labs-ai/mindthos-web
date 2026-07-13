import React from 'react';

export interface SessionDetailViewProps {
  isContentEditing: boolean;
  // Widget slots
  audioElement: React.ReactNode;
  tab: React.ReactNode;
  toolbar: React.ReactNode;
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
  tab,
  toolbar,
  tabContent,
  audioPlayer,
  tabChangeModal,
}) => {
  return (
    <div className="mx-auto flex h-full w-full max-w-[min(100vw-535px,1332px)] flex-col overflow-hidden bg-grey-20">
      {audioElement}

      {/* 상단 헤더(제목·날짜) 제거 → 제목 편집은 사이드탭으로 이동. 콘텐츠 영역 확장 */}
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden pt-4">
        <div className="flex-shrink-0 select-none px-6 pt-2">{tab}</div>

        <div
          className={`relative mx-6 mb-2 flex min-h-0 flex-1 flex-col overflow-hidden rounded-lg border ${isContentEditing ? 'border-green-80 bg-green-10' : 'border-grey-40 bg-white'}`}
        >
          {/* 툴바가 찾기 팝오버(findReplaceSlot)를 버튼 그룹 아래에 함께 렌더 */}
          {toolbar}
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

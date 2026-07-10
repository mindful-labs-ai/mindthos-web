import React from 'react';

export interface MobileSessionDetailViewProps {
  isContentEditing: boolean;
  /** 직접 입력 세션 여부 (축어록 편집 오버레이는 비-handwritten에만 적용) */
  isHandwritten?: boolean;
  audioElement: React.ReactNode;
  header: React.ReactNode;
  mobileHeader: React.ReactNode;
  tab: React.ReactNode;
  toolbar: React.ReactNode;
  /** 찾기·바꾸기 바 (툴바 아래 고정) */
  findReplace?: React.ReactNode;
  tabContent: React.ReactNode;
  audioPlayer: React.ReactNode;
  tabChangeModal: React.ReactNode;
}

export const MobileSessionDetailView: React.FC<
  MobileSessionDetailViewProps
> = ({
  isContentEditing,
  isHandwritten = false,
  audioElement,
  header,
  mobileHeader,
  tab,
  toolbar,
  findReplace,
  tabContent,
  audioPlayer,
  tabChangeModal,
}) => {
  // 축어록 편집 시에만 sticky h-0 오버레이(handwritten은 자체 툴바 위치 유지)
  const useEditOverlay = isContentEditing && !isHandwritten;
  return (
    <div className="mx-auto flex h-full w-full max-w-full flex-col overflow-hidden bg-grey-20">
      {audioElement}

      <div className="flex-shrink-0">{header}</div>

      {/* 모바일: tab+mobileHeader+콘텐츠가 하나의 스크롤 영역 */}
      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto md:px-9">
        <div className="flex-shrink-0 select-none px-2 pt-3 md:px-0">{tab}</div>

        {mobileHeader && <div className="flex-shrink-0">{mobileHeader}</div>}

        <div
          className={`relative mx-0 mb-0 flex-1 md:overflow-hidden md:rounded-2xl md:border md:border-grey-40 ${isContentEditing ? 'border-green-80 bg-[#FDFFFE]' : 'bg-white'}`}
        >
          {useEditOverlay ? (
            // 축어록 편집: 툴바+찾기 바를 축어록 스크롤에 붙는 sticky 오버레이로.
            // h-0 → 세그먼트 위로 떠서 칸을 차지하지 않고, 스크롤을 따라옴
            <div className="pointer-events-none sticky top-0 z-30 h-0">
              {toolbar}
              {findReplace && (
                <div className="flex justify-end px-2">
                  <div className="pointer-events-auto">{findReplace}</div>
                </div>
              )}
            </div>
          ) : (
            toolbar
          )}
          <div className="my-auto h-full md:overflow-auto">{tabContent}</div>
        </div>
      </div>

      {audioPlayer && (
        <div className="flex-shrink-0 select-none">{audioPlayer}</div>
      )}

      {tabChangeModal}
    </div>
  );
};

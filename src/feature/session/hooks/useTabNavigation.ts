/**
 * 탭 전환 관리 훅
 * 편집 중 탭 변경 시 확인 모달 표시 등 처리
 */

import React from 'react';

interface UseTabNavigationOptions {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isEditing: boolean;
  /** 편집 취소 핸들러 (편집 상태 초기화) */
  onCancelEdit: () => void;
  /** 템플릿 선택 중인 탭들 setter */
  setCreatingTabs: React.Dispatch<
    React.SetStateAction<Record<string, number | null>>
  >;
  /** 스크롤 컨테이너 ref */
  contentScrollRef: React.RefObject<HTMLDivElement | null>;
  /** 튜토리얼 활성화 체크 함수 */
  checkIsTutorialActive?: (step: number) => boolean;
  /** 다음 튜토리얼 스텝으로 이동 */
  nextTutorialStep?: () => void;
}

interface UseTabNavigationReturn {
  /** 탭 변경 확인 모달 열림 여부 */
  isTabChangeModalOpen: boolean;
  /** 탭 변경 확인 모달 열림 상태 setter */
  setIsTabChangeModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
  /** 대기 중인 탭 값 */
  pendingTabValue: string | null;
  /** 탭 변경 핸들러 */
  handleTabChange: (value: string) => void;
  /** 탭 변경 확인 (모달에서 확인 클릭) */
  handleConfirmTabChange: () => void;
  /** 탭 변경 취소 (모달에서 취소 클릭) */
  handleCancelTabChange: () => void;
}

export function useTabNavigation({
  activeTab,
  setActiveTab,
  isEditing,
  onCancelEdit,
  setCreatingTabs,
  contentScrollRef,
  checkIsTutorialActive,
  nextTutorialStep,
}: UseTabNavigationOptions): UseTabNavigationReturn {
  const [isTabChangeModalOpen, setIsTabChangeModalOpen] = React.useState(false);
  const [pendingTabValue, setPendingTabValue] = React.useState<string | null>(
    null
  );

  const handleTabChange = React.useCallback(
    (value: string) => {
      // 편집 중이고, 축어록 탭에서 다른 탭으로 변경하려는 경우
      if (isEditing && activeTab === 'transcript') {
        setPendingTabValue(value);
        setIsTabChangeModalOpen(true);
        return;
      }

      // 'add' 탭 처리 - 새로운 생성 탭 추가
      if (value === 'add') {
        const newTabId = `create-note-${Date.now()}`;
        setCreatingTabs((prev) => ({
          ...prev,
          [newTabId]: null,
        }));
        setActiveTab(newTabId);
        // 스크롤 초기화
        contentScrollRef.current?.scrollTo({ top: 0 });
        return;
      }

      setActiveTab(value);
      // 스크롤 초기화 (즉시 강제 리셋)
      if (contentScrollRef.current) {
        contentScrollRef.current.scrollTop = 0;
      }

      // 튜토리얼 9단계: 상담 노트 생성 탭 클릭 시 다음 단계로
      if (value === 'add' && checkIsTutorialActive?.(9)) {
        nextTutorialStep?.();
      }
    },
    [
      activeTab,
      isEditing,
      setCreatingTabs,
      setActiveTab,
      contentScrollRef,
      checkIsTutorialActive,
      nextTutorialStep,
    ]
  );

  const handleConfirmTabChange = React.useCallback(() => {
    onCancelEdit();
    if (pendingTabValue) {
      if (pendingTabValue === 'add') {
        const newTabId = `create-note-${Date.now()}`;
        setCreatingTabs((prev) => ({
          ...prev,
          [newTabId]: null,
        }));
        setActiveTab(newTabId);
      } else {
        setActiveTab(pendingTabValue);
      }
      // 스크롤 초기화 (즉시 강제 리셋)
      if (contentScrollRef.current) {
        contentScrollRef.current.scrollTop = 0;
      }
    }
    setIsTabChangeModalOpen(false);
    setPendingTabValue(null);
  }, [
    onCancelEdit,
    pendingTabValue,
    setCreatingTabs,
    setActiveTab,
    contentScrollRef,
  ]);

  const handleCancelTabChange = React.useCallback(() => {
    setIsTabChangeModalOpen(false);
    setPendingTabValue(null);
  }, []);

  return {
    isTabChangeModalOpen,
    setIsTabChangeModalOpen,
    pendingTabValue,
    handleTabChange,
    handleConfirmTabChange,
    handleCancelTabChange,
  };
}

/**
 * 상담노트 탭 관리 훅
 * - 탭 상태 관리 (activeTab, creatingTabs, requestingTabs)
 * - 탭 목록 계산 (template_id별 최신 노트만, failed 제외)
 * - 폴링 연동
 * - 초기 탭 설정
 */

import React from 'react';

import { useToast } from '@/components/ui/composites/Toast';
import type { Template } from '@/feature/template/types';

import type { ProgressNote } from '../types';

import { useSessionProgressNotesPolling } from './useSessionProgressNotesPolling';

export interface TabItem {
  value: string;
  label: string | React.ReactNode;
}

export interface UseProgressNoteTabsOptions {
  sessionId: string;
  isDummySession?: boolean;
  isReadOnly?: boolean;
  progressNotes: ProgressNote[];
  templates: Template[];
  /** 축어록 탭 라벨 (커스텀 가능) */
  transcriptLabel?: string | React.ReactNode;
}

export interface UseProgressNoteTabsReturn {
  // 탭 상태
  activeTab: string;
  setActiveTab: React.Dispatch<React.SetStateAction<string>>;

  // 탭 아이템 목록
  tabItems: TabItem[];

  // 현재 활성 탭의 생성 정보
  activeCreatingTab: {
    tabId: string;
    templateId: number | null;
    isProcessing: boolean;
  } | null;

  // 새 노트 생성 탭 관리
  creatingTabs: Record<string, number | null>;
  setCreatingTabs: React.Dispatch<
    React.SetStateAction<Record<string, number | null>>
  >;

  // API 요청 중인 탭 관리
  requestingTabs: Record<
    string,
    { templateId: number; progressNoteId: string | null }
  >;
  setRequestingTabs: React.Dispatch<
    React.SetStateAction<
      Record<string, { templateId: number; progressNoteId: string | null }>
    >
  >;

  // 폴링 상태
  processingNoteIds: Set<string>;
  hasProcessingNotes: boolean;
}

export function useProgressNoteTabs({
  sessionId,
  isDummySession = false,
  isReadOnly = false,
  progressNotes,
  templates,
  transcriptLabel = '축어록',
}: UseProgressNoteTabsOptions): UseProgressNoteTabsReturn {
  const { toast } = useToast();

  // 탭 상태
  const [activeTab, setActiveTab] = React.useState<string>('transcript');

  // activeTab을 ref로 저장하여 콜백에서 최신 값 참조
  const activeTabRef = React.useRef(activeTab);
  React.useEffect(() => {
    activeTabRef.current = activeTab;
  }, [activeTab]);

  // 새 상담노트 생성 탭 상태 (템플릿 선택 중인 탭)
  const [creatingTabs, setCreatingTabs] = React.useState<
    Record<string, number | null>
  >({});

  // API 요청 중인 탭들 (중복 클릭 방지 + 대기 UI 표시)
  const [requestingTabs, setRequestingTabs] = React.useState<
    Record<string, { templateId: number; progressNoteId: string | null }>
  >({});

  // 처리중 노트 확인
  const hasProcessingNoteInSession = progressNotes.some(
    (note) =>
      note.processing_status === 'pending' ||
      note.processing_status === 'in_progress'
  );

  // 폴링 훅
  const { processingNoteIds, hasProcessingNotes } =
    useSessionProgressNotesPolling({
      sessionId,
      isDummySession,
      enabled: !isReadOnly && !!sessionId,
      hasExternalProcessing:
        Object.keys(requestingTabs).length > 0 || hasProcessingNoteInSession,
      onNoteComplete: (note) => {
        // 생성 탭 제거
        setCreatingTabs((prev) => {
          const updated = { ...prev };
          const tabId = `create-note-${note.id}`;
          if (tabId in updated) {
            delete updated[tabId];
          }
          return updated;
        });

        // requestingTabs에서 제거하고 탭 전환
        setRequestingTabs((prev) => {
          const updated = { ...prev };
          let matchedTabId: string | null = null;

          for (const [tabId, info] of Object.entries(updated)) {
            if (info.progressNoteId === note.id) {
              matchedTabId = tabId;
              delete updated[tabId];
              break;
            }
          }

          // 해당 탭을 보고 있었다면 완성된 노트로 이동
          if (matchedTabId && activeTabRef.current === matchedTabId) {
            setTimeout(() => setActiveTab(note.id), 0);
          }

          return updated;
        });

        // create-note- 탭을 보고 있었다면 완성된 노트로 이동
        const currentTab = activeTabRef.current;
        if (currentTab === `create-note-${note.id}`) {
          setActiveTab(note.id);
        }

        toast({
          title: '상담노트 작성 완료',
          description: '상담노트가 성공적으로 작성되었습니다.',
          duration: 3000,
        });
      },
      onNoteError: (note) => {
        // 생성 탭 제거
        setCreatingTabs((prev) => {
          const updated = { ...prev };
          const tabId = `create-note-${note.id}`;
          if (tabId in updated) {
            delete updated[tabId];
          }
          return updated;
        });

        // requestingTabs에서 제거
        setRequestingTabs((prev) => {
          const updated = { ...prev };
          for (const [tabId, info] of Object.entries(updated)) {
            if (info.progressNoteId === note.id) {
              delete updated[tabId];
              break;
            }
          }
          return updated;
        });

        toast({
          title: '상담노트 작성 실패',
          description:
            note.error_message || '상담노트 작성 중 문제가 발생했습니다.',
          duration: 5000,
        });
      },
    });

  // DB 폴링에서 노트가 감지되면 탭 전환 (처리 중이면 requestingTabs 유지)
  React.useEffect(() => {
    if (!progressNotes.length) return;

    const currentActiveTab = activeTabRef.current;

    for (const [tabId, info] of Object.entries(requestingTabs)) {
      if (!info.progressNoteId) continue;

      const dbNote = progressNotes.find((n) => n.id === info.progressNoteId);
      if (!dbNote) continue;

      const isProcessing =
        dbNote.processing_status === 'pending' ||
        dbNote.processing_status === 'in_progress';

      // 현재 탭이 requesting 탭이면 create-note 탭으로 전환
      if (currentActiveTab === tabId) {
        const newTabId = isProcessing ? `create-note-${dbNote.id}` : dbNote.id;
        setActiveTab(newTabId);
      }

      // 노트가 완료된 경우에만 requestingTabs에서 제거
      // 처리 중인 경우에는 유지하여 hasExternalProcessing을 true로 유지
      if (!isProcessing) {
        setRequestingTabs((prev) => {
          const updated = { ...prev };
          delete updated[tabId];
          return updated;
        });
      }
    }
  }, [progressNotes, requestingTabs]);

  // 현재 활성 탭의 생성 정보
  const activeCreatingTab = React.useMemo(() => {
    // API 요청 중인 탭 확인
    if (activeTab in requestingTabs) {
      return {
        tabId: activeTab,
        templateId: requestingTabs[activeTab].templateId,
        isProcessing: true,
      };
    }
    // 템플릿 선택 중인 탭 확인
    if (activeTab.startsWith('create-note-') && activeTab in creatingTabs) {
      return {
        tabId: activeTab,
        templateId: creatingTabs[activeTab],
        isProcessing: false,
      };
    }
    // DB에서 처리 중인 노트인지 확인
    if (activeTab.startsWith('create-note-')) {
      const noteId = activeTab.replace('create-note-', '');
      const note = progressNotes.find((n) => n.id === noteId);
      if (note) {
        const isProcessing =
          note.processing_status === 'pending' ||
          note.processing_status === 'in_progress';
        return {
          tabId: activeTab,
          templateId: note.template_id || null,
          isProcessing,
        };
      }
    }
    return null;
  }, [activeTab, creatingTabs, requestingTabs, progressNotes]);

  // 탭 아이템 동적 생성
  const tabItems: TabItem[] = React.useMemo(() => {
    // requestingTabs에서 처리 중인 templateId들 (progressNoteId 없는 것만 - 아직 DB에 없음)
    const requestingTemplateIds = new Set(
      Object.values(requestingTabs)
        .filter((info) => !info.progressNoteId)
        .map((info) => info.templateId)
    );

    // 처리 중인 노트들의 templateId들 (재생성 시 이전 완료된 노트 숨김용)
    const processingTemplateIds = new Set(
      progressNotes
        .filter(
          (note) =>
            note.processing_status === 'pending' ||
            note.processing_status === 'in_progress'
        )
        .map((note) => note.template_id)
        .filter((id): id is number => id !== null)
    );

    // template_id별로 가장 최신 노트만 선택 (failed 제외)
    const latestNotesByTemplate = progressNotes
      .filter((note) => note.processing_status !== 'failed')
      .reduce((acc, note) => {
        const templateId = note.template_id ?? 'null';
        const existing = acc.get(templateId);
        if (
          !existing ||
          new Date(note.created_at) > new Date(existing.created_at)
        ) {
          acc.set(templateId, note);
        }
        return acc;
      }, new Map<string | number, ProgressNote>());
    const uniqueLatestNotes = Array.from(latestNotesByTemplate.values());

    const items: TabItem[] = [{ value: 'transcript', label: transcriptLabel }];

    // template_id별 최신 노트를 탭으로 추가
    uniqueLatestNotes.forEach((note) => {
      const isProcessing =
        note.processing_status === 'pending' ||
        note.processing_status === 'in_progress';

      // 완료된 노트인데 같은 templateId로 재생성 요청 중이거나 처리 중인 노트가 있으면 제외
      if (
        !isProcessing &&
        note.template_id &&
        (requestingTemplateIds.has(note.template_id) ||
          processingTemplateIds.has(note.template_id))
      ) {
        return;
      }

      if (isProcessing) {
        const template = templates.find((t) => t.id === note.template_id);
        items.push({
          value: `create-note-${note.id}`,
          label: template ? `${template.title} 작성 중...` : '작성 중...',
        });
      } else {
        items.push({
          value: note.id,
          label: note.title || '상담 노트',
        });
      }
    });

    // API 요청 중인 탭
    Object.entries(requestingTabs).forEach(([tabId, info]) => {
      if (info.progressNoteId && processingNoteIds.has(info.progressNoteId)) {
        return;
      }
      const template = templates.find((t) => t.id === info.templateId);
      items.push({
        value: tabId,
        label: template ? `${template.title} 작성 중...` : '작성 중...',
      });
    });

    // 템플릿 선택 중인 탭
    Object.entries(creatingTabs).forEach(([tabId, templateId]) => {
      let label = '빈 노트';
      if (templateId) {
        const template = templates.find((t) => t.id === templateId);
        label = template ? template.title : '빈 노트';
      }
      items.push({ value: tabId, label });
    });

    // + 버튼
    if (Object.keys(creatingTabs).length === 0) {
      items.push({ value: 'add', label: '+' });
    }

    return items;
  }, [
    progressNotes,
    creatingTabs,
    requestingTabs,
    processingNoteIds,
    transcriptLabel,
    templates,
  ]);

  // 초기 탭 설정
  const hasInitializedTab = React.useRef<string | undefined>(undefined);
  const prevSessionId = React.useRef<string | undefined>(undefined);
  // progressNotes 배열의 참조가 변경되었는지 추적 (데이터 로드 완료 감지)
  const prevProgressNotesRef = React.useRef<ProgressNote[] | null>(null);

  // 세션 변경 시 상태 초기화
  React.useEffect(() => {
    if (prevSessionId.current !== sessionId) {
      hasInitializedTab.current = undefined;
      prevSessionId.current = sessionId;
      prevProgressNotesRef.current = null; // 세션 변경 시 초기화
      setCreatingTabs({});
      setRequestingTabs({});
    }
  }, [sessionId]);

  // 초기 탭 설정: 가장 최신 상담노트 (failed 제외, template_id별 최신)

  React.useEffect(() => {
    if (hasInitializedTab.current === sessionId) return;
    if (!sessionId) return;

    // 첫 렌더링에서 progressNotes가 빈 배열이면 데이터 로딩 중일 수 있음
    // progressNotes 참조가 바뀌었을 때만 초기화 진행 (실제 데이터 로드 완료)
    const isFirstRender = prevProgressNotesRef.current === null;
    const hasDataChanged = prevProgressNotesRef.current !== progressNotes;
    prevProgressNotesRef.current = progressNotes;

    // 첫 렌더링이고 progressNotes가 빈 배열이면 대기
    if (isFirstRender && progressNotes.length === 0) {
      return;
    }

    // 데이터가 변경되지 않았으면 스킵
    if (!hasDataChanged && !isFirstRender) {
      return;
    }

    const validNotes = progressNotes.filter(
      (note) => note.processing_status !== 'failed'
    );

    // 유효한 노트가 있으면 가장 최신 노트로 초기화
    if (validNotes.length > 0) {
      // template_id별 가장 최신 노트만 추출
      const latestByTemplate = validNotes.reduce((acc, note) => {
        const templateId = note.template_id ?? 'null';
        const existing = acc.get(templateId);
        if (
          !existing ||
          new Date(note.created_at) > new Date(existing.created_at)
        ) {
          acc.set(templateId, note);
        }
        return acc;
      }, new Map<string | number, ProgressNote>());

      // 그 중 가장 최신 노트 찾기
      const latestNotes = Array.from(latestByTemplate.values());
      const latestNote = latestNotes.reduce((latest, note) =>
        new Date(note.created_at) > new Date(latest.created_at) ? note : latest
      );

      const isProcessing =
        latestNote.processing_status === 'pending' ||
        latestNote.processing_status === 'in_progress';

      if (isProcessing) {
        setActiveTab(`create-note-${latestNote.id}`);
      } else {
        setActiveTab(latestNote.id);
      }
      hasInitializedTab.current = sessionId;
      return;
    }

    // 노트가 없으면 축어록으로 설정
    setActiveTab('transcript');
    hasInitializedTab.current = sessionId;
  }, [sessionId, progressNotes]);

  return {
    activeTab,
    setActiveTab,
    tabItems,
    activeCreatingTab,
    creatingTabs,
    setCreatingTabs,
    requestingTabs,
    setRequestingTabs,
    processingNoteIds,
    hasProcessingNotes,
  };
}

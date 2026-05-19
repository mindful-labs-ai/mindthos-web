import { useRef, useState } from 'react';

import type { Client } from '@/features/client/types';
import { cn } from '@/lib/cn';
import { useDevice } from '@/shared/hooks/useDevice';

import { AnalysisChatInput } from './AnalysisChatInput';
import { AnalysisDisclaimer } from './AnalysisDisclaimer';
import type { AnalysisStatus } from './AnalysisStatusChip';
import { AnalyzeCtaSection } from './AnalyzeCtaSection';
import {
  AnalyzingProgressCard,
  type AnalysisStep,
} from './AnalyzingProgressCard';
import type { AssessmentFile } from './AssessmentFileItem';
import { ChatWelcomeView, type ChatSuggestion } from './ChatWelcomeView';
import { ChiefComplaintBar } from './ChiefComplaintBar';
import { ClientProfileHeader } from './ClientProfileHeader';
import { DebugStatePanel, type AssessmentsMode } from './DebugStatePanel';
import { EmptyAssessmentsView } from './EmptyAssessmentsView';
import { NoClientSelectedView } from './NoClientSelectedView';
import { RegisterAssessmentsModal } from './RegisterAssessmentsModal';
import { RegisteredAssessmentsCard } from './RegisteredAssessmentsCard';
import {
  RegisteredPopover,
  ResetConfirmModal,
  type RegisteredAssessmentEntry,
  type TranscriptEntry,
} from './RegisteredPopover';

interface PsychologyAssessmentsMainProps {
  client: Client | null;
}

const PAGE_PADDING = {
  paddingTop: 36,
  paddingBottom: 36,
  paddingLeft: 42,
  paddingRight: 42,
};

const MOCK_FILES: AssessmentFile[] = [
  { id: '1', title: '다면적 인성 검사', fileName: 'MMPI-2_홍길동_결과지.pdf' },
  { id: '2', title: '기질 검사', fileName: 'TCI_홍길동_결과지.pdf' },
];

const MOCK_POPOVER_ASSESSMENTS: RegisteredAssessmentEntry[] = [
  {
    id: '1',
    fileName: 'MMPI-2_홍길동_결과지.pdf',
    testDate: '2026.04.14',
    pageCount: 12,
    categoryLabel: '다면적 인성검사',
  },
  {
    id: '2',
    fileName: 'TCI_홍길동_결과지.pdf',
    testDate: '2026.04.14',
    pageCount: 8,
    categoryLabel: '기질 검사',
  },
];

const MOCK_POPOVER_TRANSCRIPTS: TranscriptEntry[] = [
  { id: 't1', title: '홍길동 축어록', metaLabel: '총 8회기 상담 기록' },
];

const MOCK_ANALYSIS_STEPS: AnalysisStep[] = [
  { id: '1', label: '다면적 인성 검사 분석 완료', status: 'completed' },
  { id: '2', label: '기질검사 분석 진행 중...', status: 'in_progress' },
  { id: '3', label: '통합 해석', status: 'pending' },
];

const MOCK_SUGGESTIONS: ChatSuggestion[] = [
  {
    id: '1',
    label: '내담자의 통합 심리 검사 해석을 받아보고 싶어',
    recommended: true,
  },
  { id: '2', label: '어떤 분석들이 가능한지 궁금해' },
  { id: '3', label: '현재 내담자의 정보를 요약해서 알려줘' },
];

const CHAT_PLACEHOLDER: Record<AssessmentsMode, string> = {
  empty: '심리검사 결과지를 추가한 후 분석을 진행해주세요.',
  registered: '내담자 문서를 추가한 후 분석을 진행해주세요.',
  analyzing: '분석 진행 중에는 입력할 수 없어요.',
  analyzed: '마음토스 에이전트에게 질문해보세요',
};

const modeToChipStatus: Record<AssessmentsMode, AnalysisStatus> = {
  empty: 'no_assessments',
  registered: 'no_analysis',
  analyzing: 'analyzing',
  analyzed: 'analyzed',
};

export const PsychologyAssessmentsMain = ({
  client,
}: PsychologyAssessmentsMainProps) => {
  const { isMobile, isTablet } = useDevice();
  const isMobileView = isMobile || isTablet;

  const [chatValue, setChatValue] = useState('');
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
  const [analyzingPercent, setAnalyzingPercent] = useState(48);

  // 등록 결과지 popover
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const [selectedEntryIds, setSelectedEntryIds] = useState<Set<string>>(
    () => new Set()
  );
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);
  const chipRef = useRef<HTMLButtonElement>(null);

  // TODO: 실제 데이터 연동 시 useQuery / state machine로 교체.
  const [mode, setModeState] = useState<AssessmentsMode>('registered');
  const [localFiles, setLocalFiles] =
    useState<AssessmentFile[]>(MOCK_FILES);

  // mode 변경 — 비어있던 상태에서 결과지 상태로 복귀 시 mock 복원
  const setMode = (next: AssessmentsMode) => {
    if (next !== 'empty' && localFiles.length === 0) {
      setLocalFiles(MOCK_FILES);
    }
    setModeState(next);
  };

  const files: AssessmentFile[] = mode === 'empty' ? [] : localFiles;

  const handleRemoveFile = (id: string) => {
    setLocalFiles((prev) => {
      const next = prev.filter((f) => f.id !== id);
      // 모두 지우면 empty 상태로 자동 전환
      if (next.length === 0) setModeState('empty');
      return next;
    });
  };
  const analyzeCost = 50;

  const chipStatus = modeToChipStatus[mode];
  const chatPlaceholder = CHAT_PLACEHOLDER[mode];
  const isChatDisabled = mode !== 'analyzed';

  const handleStartAnalysis = () => {
    setMode('analyzing');
  };

  const handleSuggestionClick = (id: string) => {
    const suggestion = MOCK_SUGGESTIONS.find((s) => s.id === id);
    if (suggestion) setChatValue(suggestion.label);
  };

  // chip 클릭 → popover toggle (결과지 1개 이상일 때만)
  const canOpenPopover = files.length > 0;
  const handleChipClick = canOpenPopover
    ? () => setIsPopoverOpen((prev) => !prev)
    : undefined;

  const handleToggleEntrySelect = (id: string) => {
    setSelectedEntryIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleResetClick = () => {
    setIsResetConfirmOpen(true);
  };

  const handleResetConfirm = () => {
    // TODO: 실제 삭제 mutation 연결. 데모: empty로 전환.
    setIsResetConfirmOpen(false);
    setIsPopoverOpen(false);
    setSelectedEntryIds(new Set());
    setMode('empty');
  };

  // 디버그 패널 — 모바일에서는 드롭다운(접힘) 상태로 시작
  const debugPanel = <DebugStatePanel mode={mode} onModeChange={setMode} />;

  // 모바일/데스크탑 wrapper 분기
  const outerCls = isMobileView
    ? 'flex h-full w-full'
    : 'flex h-full w-full justify-center';
  const outerStyle = isMobileView ? undefined : PAGE_PADDING;
  const cardCls = isMobileView
    ? 'flex h-full w-full flex-col overflow-hidden bg-card-bg'
    : 'flex h-full w-full max-w-[1099px] flex-col overflow-hidden rounded-2xl border border-card-border bg-card-bg';

  if (!client) {
    return (
      <div className={outerCls} style={outerStyle}>
        <div
          className={cn(
            isMobileView
              ? 'flex h-full w-full overflow-hidden bg-card-bg'
              : 'flex h-full w-full max-w-[1099px] overflow-hidden rounded-2xl border border-card-border bg-card-bg'
          )}
        >
          <NoClientSelectedView />
        </div>
        {debugPanel}
      </div>
    );
  }

  /* -------- 본문 분기 -------- */
  let bodyContent: React.ReactNode = null;

  if (mode === 'empty') {
    bodyContent = (
      <EmptyAssessmentsView onRegister={() => setIsRegisterModalOpen(true)} />
    );
  } else if (mode === 'registered') {
    bodyContent = (
      <div className="flex flex-1 flex-col items-center justify-center gap-8">
        <RegisteredAssessmentsCard
          files={files}
          onAddFile={() => setIsRegisterModalOpen(true)}
          onRemoveFile={handleRemoveFile}
        />
        <AnalyzeCtaSection
          creditCost={analyzeCost}
          onClick={handleStartAnalysis}
        />
      </div>
    );
  } else if (mode === 'analyzing') {
    bodyContent = (
      <div className="flex flex-1 flex-col items-center justify-center">
        <AnalyzingProgressCard
          steps={MOCK_ANALYSIS_STEPS}
          percent={analyzingPercent}
        />
      </div>
    );
  } else if (mode === 'analyzed') {
    bodyContent = (
      <ChatWelcomeView
        suggestions={MOCK_SUGGESTIONS}
        onSuggestionClick={handleSuggestionClick}
      />
    );
  }

  return (
    <div className={outerCls} style={outerStyle}>
      <div className={cardCls}>
        {/* 1) 프로필 헤더 — 모바일: 이름+chip 단일 행 / 데스크탑: 아바타+메타+chip */}
        <div
          className={cn(
            isMobileView ? 'px-4 py-3' : 'pb-8 pl-8 pr-7 pt-7'
          )}
        >
          <ClientProfileHeader
            client={client}
            analysisStatus={chipStatus}
            fileCount={files.length}
            chipRef={chipRef}
            onChipClick={handleChipClick}
            chipActive={isPopoverOpen}
            chipPopoverSlot={
              canOpenPopover && (
                <RegisteredPopover
                  open={isPopoverOpen}
                  onClose={() => setIsPopoverOpen(false)}
                  triggerRef={chipRef as React.RefObject<HTMLElement>}
                  transcripts={MOCK_POPOVER_TRANSCRIPTS}
                  assessments={MOCK_POPOVER_ASSESSMENTS}
                  selectedIds={selectedEntryIds}
                  onToggleSelect={handleToggleEntrySelect}
                  onReset={handleResetClick}
                />
              )
            }
          />
        </div>

        {/* 2) 주호소 바 — 모바일에서는 숨김 */}
        {!isMobileView && (
          <ChiefComplaintBar
            className="border-y border-grey-40 py-3"
            complaint={client.counsel_theme}
          />
        )}

        {/* 3) 본문 — 모바일: 풀너비 + px-4, 데스크탑: max-w-[679px] */}
        <div
          className={cn(
            'flex flex-1 flex-col overflow-y-auto',
            isMobileView ? 'py-6' : 'py-10'
          )}
        >
          <div
            className={cn(
              'flex w-full flex-1 flex-col',
              isMobileView
                ? 'px-4'
                : 'mx-auto max-w-[679px] px-6'
            )}
          >
            {bodyContent}
          </div>
        </div>

        {/* 4) 하단 채팅 입력 + 안내 (모바일 iOS safe-area 적용) */}
        <div
          className={cn(
            'border-t border-border',
            isMobileView ? 'pt-3' : 'py-5'
          )}
          style={
            isMobileView
              ? { paddingBottom: 'calc(12px + env(safe-area-inset-bottom))' }
              : undefined
          }
        >
          <div
            className={cn(
              'flex w-full flex-col gap-3',
              isMobileView ? 'px-4' : 'mx-auto max-w-[679px] px-6'
            )}
          >
            <AnalysisChatInput
              value={chatValue}
              onChange={setChatValue}
              placeholder={chatPlaceholder}
              disabled={isChatDisabled}
            />
            <AnalysisDisclaimer />
          </div>
        </div>
      </div>

      <RegisterAssessmentsModal
        open={isRegisterModalOpen}
        onClose={() => setIsRegisterModalOpen(false)}
        analyzeCost={analyzeCost}
        onAnalyze={handleStartAnalysis}
      />

      <ResetConfirmModal
        open={isResetConfirmOpen}
        onClose={() => setIsResetConfirmOpen(false)}
        onConfirm={handleResetConfirm}
      />

      {debugPanel}

      {/* 분석 % 디버그용 — analyzing 상태에서만 슬라이더 노출 */}
      {mode === 'analyzing' && (
        <div className="fixed bottom-4 right-4 z-tooltip flex flex-col gap-2 rounded-lg border border-border bg-surface p-3 shadow-elevated">
          <label className="flex items-center justify-between gap-3 text-xs text-grey-100">
            <span>분석 %</span>
            <span>{analyzingPercent}%</span>
          </label>
          <input
            type="range"
            min={0}
            max={100}
            value={analyzingPercent}
            onChange={(e) => setAnalyzingPercent(Number(e.target.value))}
            className="w-[180px]"
          />
        </div>
      )}
    </div>
  );
};

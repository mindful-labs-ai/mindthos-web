import { useEffect, useRef, useState } from 'react';

import { useQueryClient } from '@tanstack/react-query';

import type { Client } from '@/features/client/types';
import { cn } from '@/lib/cn';
import type {
  AnalysisStatusResponse,
  AssessmentReportStatus,
  ChatActiveStatus,
} from '@/shared/api/server/assessmentUploadApi';
import { useDevice } from '@/shared/hooks/useDevice';
import { Spinner } from '@/shared/ui';

import {
  getChatHistory,
  retryChatMessage,
  sendChatMessage,
} from '../api/chatApi';
import {
  analysisKeys,
  calcAnalysisPercent,
  isAnalysisComplete,
  useAnalysisStatus,
  useStartAnalysis,
} from '../hooks/useAnalysis';
import {
  useAssessmentBatch,
  useDeleteAssessment,
  useResetToOcrPhase,
} from '../hooks/useAssessmentBatch';
import type {
  AssessmentKind,
  AssessmentProgress,
} from '../upload/assessmentUploadGateway';
import { deriveOcrStage, ocrReviewPercent } from '../upload/ocrProgress';

import { AnalysisChatInput } from './AnalysisChatInput';
import { AnalysisDisclaimer } from './AnalysisDisclaimer';
import type { AnalysisStatus } from './AnalysisStatusChip';
import { AnalyzeCtaSection } from './AnalyzeCtaSection';
import {
  AnalyzingProgressCard,
  type AnalysisStep,
} from './AnalyzingProgressCard';
import type { AssessmentFile } from './AssessmentFileItem';
import { ChatConversationView, type ChatTurn } from './ChatConversationView';
import { ChatWelcomeView, type ChatSuggestion } from './ChatWelcomeView';
import { ChiefComplaintBar } from './ChiefComplaintBar';
import { ClientProfileHeader } from './ClientProfileHeader';
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

type AssessmentsMode = 'empty' | 'registered' | 'analyzing' | 'analyzed';

// 환영 화면 예시 질문 — 클릭하면 input에 그대로 채워져 사용자가 엔터만 누르면 전송.
const CHAT_SUGGESTIONS: ChatSuggestion[] = [
  {
    id: 'sg-1',
    label: '내담자의 통합 심리 검사 해석을 받아보고 싶어',
    recommended: true,
  },
  { id: 'sg-2', label: '어떤 분석들이 가능한지 궁금해' },
  { id: 'sg-3', label: '현재 내담자의 정보를 요약해서 알려줘' },
];

interface PsychologyAssessmentsMainProps {
  client: Client | null;
}

const PAGE_PADDING = {
  paddingTop: 36,
  paddingBottom: 36,
  paddingLeft: 42,
  paddingRight: 42,
};

// 검사 종류 → 결과지 카드/popover에 노출할 표시 라벨
const KIND_TO_TITLE: Record<AssessmentKind, string> = {
  mmpi: '다면적 인성 검사',
  tci: '기질 검사',
};

const PROGRESS_LABEL: Record<AssessmentProgress, string> = {
  initiated: '업로드 대기',
  pending: '분석 대기',
  processing: '분석 중',
  completed: '완료',
  failed: '실패',
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

const REPORT_TYPE_LABEL: Record<string, string> = {
  MMPI_2: '다면적 인성 검사',
  TCI: '기질 검사',
};

function toAnalysisSteps(
  assessmentReports: AssessmentReportStatus[],
  integrationReportCompleted: boolean
): AnalysisStep[] {
  const reportSteps: AnalysisStep[] = assessmentReports.map((r) => ({
    id: r.type,
    label: `${REPORT_TYPE_LABEL[r.type] ?? r.type} 분석`,
    status: r.completed ? 'completed' : 'in_progress',
  }));
  const integrationStep: AnalysisStep = {
    id: 'integration',
    label: '통합 해석',
    status: integrationReportCompleted
      ? 'completed'
      : reportSteps.every((s) => s.status === 'completed')
        ? 'in_progress'
        : 'pending',
  };
  return [...reportSteps, integrationStep];
}

const CHAT_PLACEHOLDER: Record<AssessmentsMode, string> = {
  empty: '심리검사 결과지를 등록한 후 분석을 진행해주세요.',
  registered: '심리검사 결과지를 분석한 후 이용할 수 있어요.',
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
  const [turns, setTurns] = useState<ChatTurn[]>([]);
  const [retryingTurnId, setRetryingTurnId] = useState<string | null>(null);
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
  // 모달 진입 의도: 'reviewing'/'verify'면 해당 단계로 이어보기, false면 신규 업로드(step1).
  const [modalResume, setModalResume] = useState<
    'reviewing' | 'verify' | false
  >(false);
  const openUploadModal = () => {
    setModalResume(false);
    setIsRegisterModalOpen(true);
  };
  const openResumeModal = (target: 'reviewing' | 'verify') => {
    setModalResume(target);
    setIsRegisterModalOpen(true);
  };

  // 등록 결과지 popover
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const [selectedEntryIds, setSelectedEntryIds] = useState<Set<string>>(
    () => new Set()
  );
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);
  const chipRef = useRef<HTMLButtonElement>(null);

  // 데모(clientId 없음) 전용 모드 상태 — 디버그 패널이 제어. 실클라이언트는 서버
  // phase에서 모드를 렌더 중 파생하므로 이 state를 쓰지 않는다.
  const [demoMode, setDemoMode] = useState<AssessmentsMode>('empty');
  const [localFiles, setLocalFiles] = useState<AssessmentFile[]>(MOCK_FILES);

  // 데모 mode 변경 — 비어있던 상태에서 결과지 상태로 복귀 시 mock 복원
  const setMode = (next: AssessmentsMode) => {
    if (next !== 'empty' && localFiles.length === 0) {
      setLocalFiles(MOCK_FILES);
    }
    setDemoMode(next);
  };

  const clientId = client?.id;
  const qc = useQueryClient();

  // 내담자 phase의 단일 권위 소스. clientId 있으면 진입 즉시 조회해 모드를 결정한다.
  const { data: analysisStatusData } = useAnalysisStatus(clientId, {
    enabled: !!clientId,
  });
  const phase: ChatActiveStatus | undefined =
    analysisStatusData?.chatActiveStatus;

  // 등록 결과지 실데이터 (서버 활성 배치). popover/결과지 카드가 모두 이 한 배치를 공유.
  // OCR_PHASE에서 empty/registered를 가르기 위해, 그리고 popover 표시를 위해 조회.
  const { data: realAssessments = [], isLoading: isBatchLoading } =
    useAssessmentBatch(clientId, {
      enabled: isPopoverOpen || phase === 'OCR_PHASE' || phase === undefined,
    });
  const deleteAssessmentMut = useDeleteAssessment(clientId);
  const resetToOcrPhaseMut = useResetToOcrPhase(clientId);

  // 분석 시작 mutation
  const startAnalysisMut = useStartAnalysis(clientId);

  // 낙관적 phase 갱신 — mutation 직후 서버 refetch 전까지 모드를 즉시 전이시킨다.
  // (refetch가 같은 값으로 확정하므로 깜빡임 없이 매끄럽게 이어진다.)
  const setPhaseOptimistic = (next: ChatActiveStatus) => {
    if (!clientId) return;
    qc.setQueryData<AnalysisStatusResponse>(
      analysisKeys.status(clientId),
      (old) => (old ? { ...old, chatActiveStatus: next } : old)
    );
  };

  // 내담자 phase(권위) + 활성 배치로 모드를 렌더 중 파생(effect+setState 불필요).
  // - OCR_PHASE: 드래프트 있으면 registered, 없으면 empty
  // - ANALYSIS_PHASE: analyzing
  // - CHAT_ACTIVE(또는 통합 완료): analyzed
  // 데모(clientId 없음)는 analysisStatusData가 없어 디버그 패널(demoMode)이 모드 제어.
  const mode: AssessmentsMode =
    clientId && analysisStatusData
      ? analysisStatusData.chatActiveStatus === 'OCR_PHASE'
        ? realAssessments.length > 0
          ? 'registered'
          : 'empty'
        : isAnalysisComplete(analysisStatusData)
          ? 'analyzed'
          : 'analyzing'
      : demoMode;

  // 진입 초기 로딩 — phase 확정 전, OCR_PHASE면 배치 확정 전까지 스피너로 깜빡임 방지.
  const isInitialLoading =
    !!clientId &&
    (!analysisStatusData ||
      (analysisStatusData.chatActiveStatus === 'OCR_PHASE' && isBatchLoading));

  // OCR_PHASE 배치의 진행 단계(서버 배치 상태 기반). 실클라이언트 + 드래프트 있을 때만.
  // reviewing(진행 중) / needs_review(검토 필요) / ready(분석 가능).
  const ocrStage =
    clientId && mode === 'registered' && realAssessments.length > 0
      ? deriveOcrStage(realAssessments)
      : null;
  const ocrPercent =
    ocrStage === 'reviewing' ? ocrReviewPercent(realAssessments) : 100;

  // 진입·새로고침 시 진행 중/검토 대기 배치가 감지되면 모달을 자동으로 열어(이어보기)
  // 진행/검토 화면을 바로 보여준다. 내담자별 remount(key=clientId)라 ref도 같이 초기화되어
  // 새로고침/다른 페이지 진입 시 다시 감지된다. 사용자가 닫으면 같은 세션에선 재오픈 안 함.
  const autoOpenedRef = useRef(false);
  useEffect(() => {
    if (!clientId) return;
    if (ocrStage === 'reviewing' || ocrStage === 'needs_review') {
      if (!autoOpenedRef.current && !isRegisterModalOpen) {
        autoOpenedRef.current = true;
        // 서버 배치 상태(비동기) 감지에 반응해 모달을 여는 부수효과 — 렌더 중 파생 불가
        // (모달 open은 사용자가 닫을 수 있는 UI 상태). 진입당 1회만 실행.
        // eslint-disable-next-line react-hooks/set-state-in-effect
        openResumeModal(ocrStage === 'reviewing' ? 'reviewing' : 'verify');
      }
    }
  }, [clientId, ocrStage, isRegisterModalOpen]);

  // analyzed 진입 시 서버에서 채팅 이력 로드(과거 대화 복원). 최신순 → 과거순으로 뒤집어
  // 각 메시지를 user(input)+assistant(output) 턴으로 변환. (전송은 별도; 여기선 초기 로드만)
  useEffect(() => {
    if (!clientId || mode !== 'analyzed') return;
    let cancelled = false;
    void getChatHistory(clientId)
      .then((items) => {
        if (cancelled || items.length === 0) return;
        const turnsLoaded: ChatTurn[] = [];
        for (const m of [...items].reverse()) {
          turnsLoaded.push({
            id: `u-${m.id}`,
            role: 'user',
            content: m.inputMessage,
          });
          // FAILED row는 outputMessage가 null일 수 있다. 재시도 가능하도록 placeholder
          // assistant 턴을 항상 추가하고 서버 processingStatus를 그대로 반영한다.
          const isFailed = m.processingStatus === 'FAILED';
          if (m.outputMessage || isFailed) {
            turnsLoaded.push({
              id: `a-${m.id}`,
              role: 'assistant',
              content: m.outputMessage ?? '챗봇 호출 실패',
              messageId: m.id,
              status: isFailed
                ? 'failed'
                : m.processingStatus === 'COMPLETED'
                  ? 'ok'
                  : 'sending',
            });
          }
        }
        setTurns(turnsLoaded);
      })
      .catch(() => {
        /* 이력 없음/실패는 무시 — 빈 대화로 시작 */
      });
    return () => {
      cancelled = true;
    };
  }, [clientId, mode]);

  const analyzingPercent = analysisStatusData
    ? calcAnalysisPercent(analysisStatusData)
    : 0;

  const analysisSteps: AnalysisStep[] = analysisStatusData
    ? toAnalysisSteps(
        analysisStatusData.assessmentReports,
        analysisStatusData.integrationReportCompleted
      )
    : [];

  // 활성 배치 → 결과지 카드용 AssessmentFile
  const realFiles: AssessmentFile[] = realAssessments.map((it) => ({
    id: it.assessmentId,
    title: KIND_TO_TITLE[it.kind],
    fileName: it.title,
  }));
  // 활성 배치 → popover 엔트리
  const realPopoverAssessments: RegisteredAssessmentEntry[] =
    realAssessments.map((it) => ({
      id: it.assessmentId,
      fileName: it.title,
      testDate: '',
      pageCount: 0,
      categoryLabel: KIND_TO_TITLE[it.kind],
      metaLabel: `${it.kind === 'mmpi' ? 'MMPI-2' : 'TCI'} · ${PROGRESS_LABEL[it.progress]}`,
    }));

  // 결과지가 표시되는 모든 곳(카드/popover/칩 카운트)이 같은 배치를 기반으로.
  // clientId 있으면 실데이터, 없으면(데모) mock.
  const localDisplayFiles: AssessmentFile[] =
    mode === 'empty' ? [] : localFiles;
  const files: AssessmentFile[] = clientId ? realFiles : localDisplayFiles;

  const handleRemoveFile = (id: string) => {
    setLocalFiles((prev) => {
      const next = prev.filter((f) => f.id !== id);
      // 모두 지우면 empty 상태로 자동 전환
      if (next.length === 0) setDemoMode('empty');
      return next;
    });
  };
  const analyzeCost = 50;

  const chipStatus = modeToChipStatus[mode];
  const chatPlaceholder = CHAT_PLACEHOLDER[mode];
  const isChatDisabled = mode !== 'analyzed';

  const handleStartAnalysis = () => {
    if (clientId) {
      // 서버 전이(OCR_PHASE→ANALYSIS_PHASE) 성공 시 phase를 낙관적으로 갱신 →
      // 파생 effect가 즉시 analyzing으로. 이어지는 refetch가 같은 값으로 확정.
      // 실패(402/409/503)는 mutation.error에 잡혀 모달/메인뷰에 노출된다.
      startAnalysisMut.mutate(undefined, {
        onSuccess: () => {
          setPhaseOptimistic('ANALYSIS_PHASE');
          setIsRegisterModalOpen(false);
        },
      });
    } else {
      setMode('analyzing');
    }
  };

  // 분석 시작 실패 메시지(서버가 envelope.message로 한글 사유를 내려준다).
  const startAnalysisError = startAnalysisMut.error?.message ?? null;

  const handleSendChat = () => {
    const text = chatValue.trim();
    if (!text || !clientId) return;
    setChatValue('');

    // 서버 채팅 API 호출 — 서버가 grounding 구성 + 머신 호출 + turn 저장 후 응답 반환.
    // (히스토리는 서버가 스레드로 관리하므로 프론트가 전달하지 않는다.)
    const aid = `a-${Date.now()}`;
    setTurns((prev) => [
      ...prev,
      { id: `u-${Date.now()}`, role: 'user', content: text },
      { id: aid, role: 'assistant', content: '…', status: 'sending' },
    ]);
    void sendChatMessage(clientId, text)
      .then((reply) => {
        setTurns((prev) =>
          prev.map((t) =>
            t.id === aid
              ? {
                  ...t,
                  content: reply.message,
                  messageId: reply.messageId,
                  status: 'ok',
                }
              : t
          )
        );
      })
      .catch(async (err: unknown) => {
        const msg = err instanceof Error ? err.message : '알 수 없는 오류';
        // 서버가 FAILED row를 만들었으면 history에서 messageId를 가져와 재시도 가능하게 한다.
        // 네트워크 실패 등 history도 못 가져오면 messageId 없이 에러 텍스트만 노출.
        let failedMessageId: string | undefined;
        try {
          const items = await getChatHistory(clientId, 5);
          const found = items.find(
            (m) => m.inputMessage === text && m.processingStatus === 'FAILED'
          );
          failedMessageId = found?.id;
        } catch {
          /* ignore */
        }
        setTurns((prev) =>
          prev.map((t) =>
            t.id === aid
              ? {
                  ...t,
                  content: `챗봇 호출 실패: ${msg}`,
                  status: 'failed',
                  messageId: failedMessageId,
                }
              : t
          )
        );
      });
  };

  // 실패한 assistant 턴 재시도 — 서버 /retry로 같은 messageId의 출력을 다시 받는다.
  const handleRetryTurn = (turnId: string) => {
    if (!clientId) return;
    const turn = turns.find((t) => t.id === turnId);
    if (!turn?.messageId) return;
    setRetryingTurnId(turnId);
    setTurns((prev) =>
      prev.map((t) =>
        t.id === turnId ? { ...t, content: '…', status: 'sending' } : t
      )
    );
    void retryChatMessage(clientId, turn.messageId)
      .then((reply) => {
        setTurns((prev) =>
          prev.map((t) =>
            t.id === turnId
              ? { ...t, content: reply.message, status: 'ok' }
              : t
          )
        );
      })
      .catch((err: unknown) => {
        const msg = err instanceof Error ? err.message : '알 수 없는 오류';
        setTurns((prev) =>
          prev.map((t) =>
            t.id === turnId
              ? { ...t, content: `재시도 실패: ${msg}`, status: 'failed' }
              : t
          )
        );
      })
      .finally(() => {
        setRetryingTurnId(null);
      });
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
    setIsResetConfirmOpen(false);
    setSelectedEntryIds(new Set());

    // clientId 없으면(데모) 로컬만 비움.
    if (!clientId) {
      setIsPopoverOpen(false);
      setMode('empty');
      return;
    }

    // 서버에 OCR 단계 복귀 요청(CHAT_ACTIVE→OCR_PHASE) → 재업로드 가능 상태로.
    // 성공 시에만 phase 낙관 갱신 + 대화 비움. 실패 시 채팅 UI는 그대로 유지한다.
    setIsPopoverOpen(false);
    resetToOcrPhaseMut.mutate(undefined, {
      onSuccess: () => {
        setPhaseOptimistic('OCR_PHASE');
        setTurns([]);
      },
      onError: (err) => {
        // 실패 시 UI를 OCR로 낙관 갱신하지 않는다 — 서버 phase와 갈리는 것을 막기 위해
        // status 쿼리를 재조회해 실제 상태로 수렴시킨다.
        console.warn('[ocr-phase-reset] 실패:', err);
        void qc.invalidateQueries({
          queryKey: analysisKeys.status(clientId),
        });
      },
    });
  };

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
      </div>
    );
  }

  /* -------- 본문 분기 -------- */
  let bodyContent: React.ReactNode = null;

  if (isInitialLoading) {
    // 내담자 상태(phase) 확정 전 — empty/analyzing 깜빡임 없이 스피너만 노출.
    bodyContent = (
      <div className="flex flex-1 items-center justify-center">
        <Spinner size="lg" ariaLabel="내담자 검사 상태를 불러오는 중" />
      </div>
    );
  } else if (mode === 'empty') {
    bodyContent = <EmptyAssessmentsView onRegister={openUploadModal} />;
  } else if (mode === 'registered') {
    // OCR 단계별 분기(데모는 ocrStage null → ready로 취급).
    const stage = ocrStage ?? 'ready';
    const assessmentsCard = (
      <RegisteredAssessmentsCard
        files={files}
        onAddFile={openUploadModal}
        onRemoveFile={
          clientId ? (id) => deleteAssessmentMut.mutate(id) : handleRemoveFile
        }
        maxFiles={2}
      />
    );
    if (stage === 'reviewing') {
      bodyContent = (
        <div className="flex flex-1 flex-col items-center justify-center gap-3">
          <Spinner size="lg" ariaLabel="검사지 인식 중" />
          <span className="text-l font-emphasize text-grey-100">
            {ocrPercent}%
          </span>
          <p className="whitespace-pre-line text-center text-m font-medium text-grey-70">
            {
              '심리검사 결과지를 인식(OCR)하고 있어요.\n최대 1~2분 정도 소요됩니다.'
            }
          </p>
          <button
            type="button"
            onClick={() => openResumeModal('reviewing')}
            className="mt-2 rounded-md border border-grey-80 px-[21px] py-1.5 text-m font-medium text-grey-80 transition-colors lg:hover:bg-grey-10"
          >
            진행 상황 보기
          </button>
        </div>
      );
    } else if (stage === 'needs_review') {
      bodyContent = (
        <div className="flex flex-1 flex-col items-center justify-center gap-8">
          {assessmentsCard}
          <div className="flex flex-col items-center gap-5">
            <p className="whitespace-pre-line text-center text-m font-medium text-grey-70">
              {
                '확인이 필요한 결과지가 있어요.\n내용을 검토하고 빈 항목을 채워주세요.'
              }
            </p>
            <button
              type="button"
              onClick={() => openResumeModal('verify')}
              className="inline-flex items-center gap-2 rounded-md border border-green-80 bg-green-20 px-3.5 py-1.5 text-m font-medium text-green-80 transition-opacity lg:hover:opacity-75"
            >
              이어서 검토하기
            </button>
          </div>
        </div>
      );
    } else {
      bodyContent = (
        <div className="flex flex-1 flex-col items-center justify-center gap-8">
          {assessmentsCard}
          <div className="flex flex-col items-center gap-2">
            <AnalyzeCtaSection
              creditCost={analyzeCost}
              disabled={startAnalysisMut.isPending}
              onClick={handleStartAnalysis}
            />
            {startAnalysisError && (
              <p className="text-sm text-red-80">{startAnalysisError}</p>
            )}
          </div>
        </div>
      );
    }
  } else if (mode === 'analyzing') {
    bodyContent = (
      <div className="flex flex-1 flex-col items-center justify-center">
        <AnalyzingProgressCard
          steps={analysisSteps}
          percent={analyzingPercent}
        />
      </div>
    );
  } else if (mode === 'analyzed') {
    bodyContent =
      turns.length > 0 ? (
        <ChatConversationView
          turns={turns}
          onRetry={handleRetryTurn}
          retryingId={retryingTurnId}
        />
      ) : (
        <ChatWelcomeView
          suggestions={CHAT_SUGGESTIONS}
          onSuggestionClick={(id) => {
            const found = CHAT_SUGGESTIONS.find((s) => s.id === id);
            if (found) setChatValue(found.label);
          }}
        />
      );
  }

  return (
    <div className={outerCls} style={outerStyle}>
      <div className={cardCls}>
        {/* 1) 프로필 헤더 — 모바일: 이름+chip 단일 행 / 데스크탑: 아바타+메타+chip */}
        <div className={cn(isMobileView ? 'px-4 py-3' : 'py-4 pl-8 pr-7')}>
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
                  assessments={
                    clientId ? realPopoverAssessments : MOCK_POPOVER_ASSESSMENTS
                  }
                  selectedIds={selectedEntryIds}
                  onToggleSelect={handleToggleEntrySelect}
                  onReset={handleResetClick}
                  onDeleteAssessment={
                    clientId
                      ? (id) => deleteAssessmentMut.mutate(id)
                      : undefined
                  }
                  deletingAssessmentId={
                    deleteAssessmentMut.isPending
                      ? deleteAssessmentMut.variables
                      : null
                  }
                />
              )
            }
          />
        </div>

        {/* 2) 주호소 바 — 모바일에서는 숨김 */}
        {!isMobileView && (
          <ChiefComplaintBar
            className="border-y border-grey-40"
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
              isMobileView ? 'px-4' : 'mx-auto max-w-[679px] px-6'
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
              onSubmit={handleSendChat}
              placeholder={chatPlaceholder}
              disabled={isChatDisabled}
              showCreditChip={!isChatDisabled}
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
        isStartingAnalysis={startAnalysisMut.isPending}
        startAnalysisError={startAnalysisError}
        clientId={client.id}
        resume={modalResume}
        existingKinds={realAssessments.map((a) => a.kind)}
      />

      <ResetConfirmModal
        open={isResetConfirmOpen}
        onClose={() => setIsResetConfirmOpen(false)}
        onConfirm={handleResetConfirm}
      />
    </div>
  );
};

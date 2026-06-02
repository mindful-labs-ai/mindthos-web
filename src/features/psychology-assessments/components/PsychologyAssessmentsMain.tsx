import { useEffect, useMemo, useRef, useState } from 'react';

import { useQueryClient } from '@tanstack/react-query';

import type { Client } from '@/features/client/types';
import { useAllClientSessions } from '@/features/session/hooks/useSessionsList';
import type { SessionListItem } from '@/features/session/types';
import { cn } from '@/lib/cn';
import type {
  AnalysisStatusResponse,
  AssessmentReportStatus,
  ChatActiveStatus,
} from '@/shared/api/server/assessmentUploadApi';
import { creditQueryKeys } from '@/shared/constants/queryKeys';
import {
  DebugChip,
  DebugSection,
  useDebugPanel,
} from '@/shared/hooks/useDebugPanel';
import { useDevice } from '@/shared/hooks/useDevice';
import { Spinner } from '@/shared/ui';
import { useToast } from '@/shared/ui/composites/Toast';
import { useAuthStore } from '@/stores/authStore';

import {
  getChatHistory,
  retryChatMessage,
  sendChatMessage,
} from '../api/chatApi';
import { PSYCHOLOGY_ASSESSMENT_RESET_EVENT } from '../constants/events';
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
  AssessmentItem,
  AssessmentProgress,
} from '../upload/assessmentUploadGateway';
import { deriveOcrStage, ocrReviewPercent } from '../upload/ocrProgress';
import {
  ASSESSMENT_KIND_LABEL,
  formatAssessmentDisplayText,
} from '../utils/assessmentDisplay';
import {
  CHAT_RESPONSE_ERROR,
  CHAT_RETRY_ERROR,
  getStartAnalysisErrorMessage,
} from '../utils/userMessages';

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
import { FirstChatCreditConfirmModal } from './FirstChatCreditConfirmModal';
import { NoClientSelectedView } from './NoClientSelectedView';
import { RegenerateChatAnswerModal } from './RegenerateChatAnswerModal';
import { RegisterAssessmentsModal } from './RegisterAssessmentsModal';
import { RegisteredAssessmentsCard } from './RegisteredAssessmentsCard';
import {
  RegisteredPopover,
  ResetConfirmModal,
  type RegisteredAssessmentEntry,
  type TranscriptEntry,
} from './RegisteredPopover';

type AssessmentsMode = 'empty' | 'registered' | 'analyzing' | 'analyzed';
type DebugViewState =
  | 'real'
  | 'loading'
  | 'empty'
  | 'ocr-reviewing'
  | 'ocr-needs-review'
  | 'ocr-ready'
  | 'analyzing'
  | 'chat-welcome'
  | 'chat-sending'
  | 'chat-failed'
  | 'chat-complete'
  | 'chat-multi';

// 환영 화면 예시 질문 — 클릭하면 input에 그대로 채워져 사용자가 엔터만 누르면 전송.
const CHAT_SUGGESTIONS: ChatSuggestion[] = [
  {
    id: 'sg-1',
    label: '내담자의 심리검사 결과를 종합해서 해석해줘',
    recommended: true,
  },
  { id: 'sg-2', label: '이 검사 결과로 어떤 도움을 받을 수 있는지 알려줘' },
  { id: 'sg-3', label: '현재 내담자 정보를 간단히 정리해줘' },
];

const DEBUG_ASSESSMENT_FILES: AssessmentFile[] = [
  {
    id: 'debug-mmpi',
    title: '다면적 인성검사',
    fileName: '다면적_인성검사_디버그_결과지.pdf',
  },
  {
    id: 'debug-tci',
    title: '기질 검사',
    fileName: '기질_검사_디버그_결과지.pdf',
  },
];

const DEBUG_POPOVER_ASSESSMENTS: RegisteredAssessmentEntry[] = [
  {
    id: 'debug-mmpi',
    fileName: '다면적_인성검사_디버그_결과지.pdf',
    testDate: '2026.06.02',
    pageCount: 12,
    categoryLabel: '다면적 인성검사',
    metaLabel: '다면적 인성검사 · 완료',
  },
  {
    id: 'debug-tci',
    fileName: '기질_검사_디버그_결과지.pdf',
    testDate: '2026.06.02',
    pageCount: 8,
    categoryLabel: '기질 검사',
    metaLabel: '기질 검사 · 완료',
  },
];

const DEBUG_POPOVER_TRANSCRIPTS: TranscriptEntry[] = [
  {
    id: 'debug-transcript',
    title: '디버그 내담자 축어록',
    metaLabel: '총 3회기 상담 기록',
  },
];

const DEBUG_ANALYSIS_STEPS: AnalysisStep[] = [
  { id: 'MMPI_2', label: '다면적 인성검사 분석', status: 'completed' },
  { id: 'TCI', label: '기질 검사 분석', status: 'in_progress' },
  { id: 'integration', label: '통합 해석', status: 'pending' },
];

const DEBUG_CHAT_TURNS: Record<Exclude<DebugViewState, 'real'>, ChatTurn[]> = {
  loading: [],
  empty: [],
  'ocr-reviewing': [],
  'ocr-needs-review': [],
  'ocr-ready': [],
  analyzing: [],
  'chat-welcome': [],
  'chat-sending': [
    {
      id: 'debug-user-sending',
      role: 'user',
      content: '내담자의 심리검사 결과를 종합해서 해석해줘',
    },
    {
      id: 'debug-assistant-sending',
      role: 'assistant',
      content: '깊게 생각하는 중...',
      status: 'sending',
    },
  ],
  'chat-failed': [
    {
      id: 'debug-user-failed',
      role: 'user',
      content: '현재 내담자에게 가장 중요한 상담 포인트를 알려줘',
    },
    {
      id: 'debug-assistant-failed',
      role: 'assistant',
      content: CHAT_RESPONSE_ERROR,
      messageId: 'debug-message-failed',
      status: 'failed',
    },
  ],
  'chat-complete': [
    {
      id: 'debug-user-complete',
      role: 'user',
      content: '이 검사 결과로 어떤 도움을 받을 수 있는지 알려줘',
    },
    {
      id: 'debug-assistant-complete',
      role: 'assistant',
      content:
        '검사 결과를 종합하면 내담자는 정서적 부담을 세밀하게 다루면서도, 상담 장면에서 안전감을 확인받을 때 자기 이해가 더 잘 확장되는 흐름을 보입니다.',
      messageId: 'debug-message-complete',
      status: 'ok',
    },
  ],
  'chat-multi': [
    {
      id: 'debug-user-old',
      role: 'user',
      content: '내담자의 강점부터 정리해줘',
    },
    {
      id: 'debug-assistant-old',
      role: 'assistant',
      content:
        '내담자는 관계 맥락을 민감하게 읽고, 어려운 감정을 언어화하려는 시도가 꾸준히 나타납니다.',
      messageId: 'debug-message-old',
      status: 'ok',
    },
    {
      id: 'debug-user-latest',
      role: 'user',
      content: '상담에서 조심해야 할 지점은 뭐야?',
    },
    {
      id: 'debug-assistant-latest',
      role: 'assistant',
      content:
        '초기에는 해석을 빠르게 제시하기보다 정서 반응을 충분히 확인하고, 내담자가 스스로 받아들일 수 있는 언어로 속도를 조절하는 것이 좋습니다.',
      messageId: 'debug-message-latest',
      status: 'ok',
    },
  ],
};

interface PsychologyAssessmentsMainProps {
  client: Client | null;
}

const PAGE_PADDING = {
  paddingTop: 36,
  paddingBottom: 36,
  paddingLeft: 42,
  paddingRight: 42,
};

const PROGRESS_LABEL: Record<AssessmentProgress, string> = {
  initiated: '업로드 대기',
  pending: '분석 대기',
  processing: '분석 중',
  completed: '완료',
  failed: '확인 필요',
};

const REPORT_TYPE_LABEL: Record<string, string> = {
  MMPI_2: '다면적 인성검사',
  TCI: '기질 검사',
};

const CHAT_READY_TOAST_TITLE =
  '검사 결과지가 등록됐어요. 결과지를 바탕으로 질문해보세요!';
const MAX_SESSION_KEYWORDS = 4;

interface TransitionToastSnapshot {
  clientId?: string;
  mode: AssessmentsMode;
  phase?: ChatActiveStatus;
}

interface PendingFirstChat {
  clientId: string;
  text: string;
}

function toAnalysisSteps(
  assessmentReports: AssessmentReportStatus[],
  integrationReportCompleted: boolean
): AnalysisStep[] {
  const firstIncompleteIndex = assessmentReports.findIndex((r) => !r.completed);
  const reportSteps: AnalysisStep[] = assessmentReports.map((r, index) => ({
    id: r.type,
    label: `${REPORT_TYPE_LABEL[r.type] ?? r.type} 분석`,
    status: r.completed
      ? 'completed'
      : index === firstIncompleteIndex
        ? 'in_progress'
        : 'pending',
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
  empty: '심리검사 결과지를 등록한 뒤 분석을 시작해 주세요.',
  registered: '결과지 분석을 마치면 질문할 수 있어요.',
  analyzing: '분석이 끝나면 질문할 수 있어요.',
  analyzed: '심리검사 결과에 대해 궁금한 점을 물어보세요',
};

const modeToChipStatus: Record<AssessmentsMode, AnalysisStatus> = {
  empty: 'no_assessments',
  registered: 'no_analysis',
  analyzing: 'analyzing',
  analyzed: 'analyzed',
};

function getRecordValue(
  source: Record<string, unknown> | null | undefined,
  key: string
): unknown {
  if (!source) return undefined;
  return source[key];
}

function getAssessmentScore(
  item: AssessmentItem
): Record<string, unknown> | null {
  return item.score ?? item.tempScore;
}

function getAssessmentSubjectValue(item: AssessmentItem, key: string): unknown {
  const score = getAssessmentScore(item);
  const subjectInfo = getRecordValue(score, '수검자정보');
  return subjectInfo && typeof subjectInfo === 'object'
    ? getRecordValue(subjectInfo as Record<string, unknown>, key)
    : getRecordValue(score, key);
}

function parseAssessmentDate(value: unknown): Date | null {
  if (typeof value === 'string') {
    const trimmed = value.trim();
    const ymdMatch = /^(\d{4})(\d{2})(\d{2})$/.exec(trimmed);
    const dashedMatch = /^(\d{4})[-.](\d{1,2})[-.](\d{1,2})$/.exec(trimmed);
    const matched = ymdMatch ?? dashedMatch;
    if (matched) {
      const year = Number(matched[1]);
      const month = Number(matched[2]);
      const day = Number(matched[3]);
      const date = new Date(year, month - 1, day);
      if (
        date.getFullYear() === year &&
        date.getMonth() === month - 1 &&
        date.getDate() === day
      ) {
        return date;
      }
      return null;
    }

    const date = new Date(trimmed);
    return Number.isNaN(date.getTime()) ? null : date;
  }

  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value;
  }

  return null;
}

function parseAssessmentGender(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined;
  const trimmed = value.trim();
  if (!trimmed || trimmed === '-') return undefined;
  if (trimmed === '남') return '남자';
  if (trimmed === '여') return '여자';
  return trimmed;
}

function parseAssessmentAge(value: unknown): number | undefined {
  if (typeof value === 'number') {
    return Number.isFinite(value) && value > 0 ? value : undefined;
  }
  if (typeof value !== 'string') return undefined;

  const matched = value.trim().match(/\d+/);
  if (!matched) return undefined;

  const age = Number(matched[0]);
  return Number.isFinite(age) && age > 0 ? age : undefined;
}

function formatAssessmentDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}.${month}.${day}`;
}

function extractAssessmentDate(item: AssessmentItem): Date | null {
  const scoreDate = getAssessmentSubjectValue(item, '검사일');
  return parseAssessmentDate(scoreDate) ?? parseAssessmentDate(item.createdAt);
}

function buildRecentAssessmentLabel(
  items: AssessmentItem[]
): string | undefined {
  const latestDate = items
    .map(extractAssessmentDate)
    .filter((date): date is Date => date !== null)
    .sort((a, b) => b.getTime() - a.getTime())[0];

  return latestDate
    ? `최근 검사일 ${formatAssessmentDate(latestDate)}`
    : undefined;
}

function buildAssessmentSubjectMeta(items: AssessmentItem[]): {
  gender?: string;
  age?: number;
} {
  const sorted = items
    .map((item) => ({
      item,
      dateTime: extractAssessmentDate(item)?.getTime() ?? 0,
    }))
    .sort((a, b) => b.dateTime - a.dateTime)
    .map(({ item }) => item);

  let gender: string | undefined;
  let age: number | undefined;

  for (const item of sorted) {
    gender ??= parseAssessmentGender(getAssessmentSubjectValue(item, '성별'));
    age ??= parseAssessmentAge(getAssessmentSubjectValue(item, '나이'));

    if (gender && age !== undefined) break;
  }

  return { gender, age };
}

function getCreatedAtTime(value: string): number {
  const time = Date.parse(value);
  return Number.isNaN(time) ? 0 : time;
}

function extractSessionDnaTags(dnaJson: unknown): string[] {
  if (!dnaJson || typeof dnaJson !== 'object') return [];

  const dnaRecord = dnaJson as Record<string, unknown>;
  const rawTags = Array.isArray(dnaRecord.tag) ? dnaRecord.tag : dnaRecord.tags;

  if (!Array.isArray(rawTags)) return [];

  const seen = new Set<string>();
  const tags: string[] = [];

  for (const rawTag of rawTags) {
    if (typeof rawTag !== 'string') continue;
    const tag = rawTag.trim().replace(/^#+/, '');
    if (!tag || seen.has(tag)) continue;

    seen.add(tag);
    tags.push(tag);
    if (tags.length >= MAX_SESSION_KEYWORDS) break;
  }

  return tags;
}

function buildLatestSessionKeywords(items: SessionListItem[]): string[] {
  const latestSession = [...items].sort(
    (a, b) =>
      getCreatedAtTime(b.session.created_at) -
      getCreatedAtTime(a.session.created_at)
  )[0];

  return latestSession
    ? extractSessionDnaTags(latestSession.sessionDna?.dna_json)
    : [];
}

export const PsychologyAssessmentsMain = ({
  client,
}: PsychologyAssessmentsMainProps) => {
  const { isMobile, isTablet } = useDevice();
  const isMobileView = isMobile || isTablet;
  const userId = useAuthStore((state) => state.userId);
  const { toast } = useToast();

  const [chatValue, setChatValue] = useState('');
  const [turns, setTurns] = useState<ChatTurn[]>([]);
  const [retryingTurnId, setRetryingTurnId] = useState<string | null>(null);
  const [regenerateTurnId, setRegenerateTurnId] = useState<string | null>(null);
  const [pendingFirstChat, setPendingFirstChat] =
    useState<PendingFirstChat | null>(null);
  const [debugViewState, setDebugViewState] = useState<DebugViewState>('real');
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
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);
  const chipRef = useRef<HTMLButtonElement>(null);
  const transitionToastSnapshotRef = useRef<TransitionToastSnapshot | null>(
    null
  );

  const clientId = client?.id;
  const qc = useQueryClient();
  const invalidateCreditSummary = () => {
    const userIdNumber = userId ? Number(userId) : NaN;
    if (!Number.isFinite(userIdNumber)) return;
    void qc.invalidateQueries({
      queryKey: creditQueryKeys.summary(userIdNumber),
    });
  };

  // 내담자 phase의 단일 권위 소스. clientId 있으면 진입 즉시 조회해 모드를 결정한다.
  const { data: analysisStatusData } = useAnalysisStatus(clientId, {
    enabled: !!clientId,
  });
  const phase: ChatActiveStatus | undefined =
    analysisStatusData?.chatActiveStatus;
  const analysisComplete = analysisStatusData
    ? isAnalysisComplete(analysisStatusData)
    : false;

  // 등록 결과지 실데이터 (서버 활성 배치). popover/결과지 카드가 모두 이 한 배치를 공유.
  // OCR_PHASE에서 empty/registered를 가르기 위해, 그리고 popover 표시를 위해 조회.
  const { data: realAssessments = [], isLoading: isBatchLoading } =
    useAssessmentBatch(clientId, {
      enabled:
        isPopoverOpen ||
        phase === 'OCR_PHASE' ||
        phase === undefined ||
        analysisComplete,
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
  const mode: AssessmentsMode =
    clientId && analysisStatusData
      ? analysisStatusData.chatActiveStatus === 'OCR_PHASE'
        ? realAssessments.length > 0
          ? 'registered'
          : 'empty'
        : analysisComplete
          ? 'analyzed'
          : 'analyzing'
      : 'empty';
  const debugActive = debugViewState !== 'real';
  const debugDisplayMode: AssessmentsMode | null = (() => {
    switch (debugViewState) {
      case 'empty':
        return 'empty';
      case 'ocr-reviewing':
      case 'ocr-needs-review':
      case 'ocr-ready':
        return 'registered';
      case 'analyzing':
        return 'analyzing';
      case 'chat-welcome':
      case 'chat-sending':
      case 'chat-failed':
      case 'chat-complete':
      case 'chat-multi':
        return 'analyzed';
      case 'real':
      case 'loading':
      default:
        return null;
    }
  })();
  const displayMode = debugDisplayMode ?? mode;

  const { data: clientSessionItems = [] } = useAllClientSessions({
    userId: userId ? Number(userId) : 0,
    clientId: clientId ?? '',
    enabled: !!clientId && !!userId,
    sortOrder: 'asc',
  });

  useEffect(() => {
    if (!clientId) return;

    const handleMobileHeaderReset = (event: Event) => {
      const detail = (event as CustomEvent<{ clientId?: string }>).detail;
      if (detail?.clientId !== clientId) return;

      setChatValue('');
      setTurns([]);
      setRetryingTurnId(null);
      setRegenerateTurnId(null);
      setPendingFirstChat(null);
    };

    window.addEventListener(
      PSYCHOLOGY_ASSESSMENT_RESET_EVENT,
      handleMobileHeaderReset
    );
    return () => {
      window.removeEventListener(
        PSYCHOLOGY_ASSESSMENT_RESET_EVENT,
        handleMobileHeaderReset
      );
    };
  }, [clientId]);

  const realPopoverTranscripts: TranscriptEntry[] = useMemo(() => {
    if (!client || !clientId) return [];

    const transcriptCount = clientSessionItems.filter(
      ({ transcribe }) => transcribe !== null
    ).length;
    if (transcriptCount === 0) return [];

    return [
      {
        id: `transcripts:${clientId}`,
        title: `${client.name} 축어록`,
        metaLabel: `총 ${transcriptCount}회기 상담 기록`,
      },
    ];
  }, [client, clientId, clientSessionItems]);
  const latestSessionKeywords = useMemo(
    () => buildLatestSessionKeywords(clientSessionItems),
    [clientSessionItems]
  );

  // 진입 초기 로딩 — phase 확정 전, OCR_PHASE면 배치 확정 전까지 스피너로 깜빡임 방지.
  const isInitialLoading =
    !!clientId &&
    (!analysisStatusData ||
      (analysisStatusData.chatActiveStatus === 'OCR_PHASE' && isBatchLoading));
  const displayInitialLoading =
    debugViewState === 'loading' || (!debugActive && isInitialLoading);

  // OCR_PHASE 배치의 진행 단계(서버 배치 상태 기반). 실클라이언트 + 드래프트 있을 때만.
  // reviewing(진행 중) / needs_review(검토 필요) / ready(분석 가능).
  const ocrStage =
    clientId && mode === 'registered' && realAssessments.length > 0
      ? deriveOcrStage(realAssessments)
      : null;
  const debugOcrStage =
    debugViewState === 'ocr-reviewing'
      ? ('reviewing' as const)
      : debugViewState === 'ocr-needs-review'
        ? ('needs_review' as const)
        : debugViewState === 'ocr-ready'
          ? ('ready' as const)
          : null;
  const displayOcrStage = debugOcrStage ?? ocrStage;
  const ocrPercent =
    ocrStage === 'reviewing' ? ocrReviewPercent(realAssessments) : 100;
  const displayOcrPercent =
    debugViewState === 'ocr-reviewing' ? 43 : ocrPercent;

  useEffect(() => {
    if (!clientId || !analysisStatusData) return;

    const current: TransitionToastSnapshot = {
      clientId,
      mode,
      phase,
    };
    const previous = transitionToastSnapshotRef.current;

    if (!previous || previous.clientId !== clientId) {
      transitionToastSnapshotRef.current = current;
      return;
    }

    // 상태전이 토스트는 자동으로 닫지 않고 사용자가 X 버튼을 눌러야 닫히도록 duration: 0 사용
    if (previous.mode !== 'analyzed' && mode === 'analyzed') {
      toast({ title: CHAT_READY_TOAST_TITLE, duration: 0 });
    } else if (previous.phase === 'OCR_PHASE' && phase === 'ANALYSIS_PHASE') {
      toast({
        title: '검사 결과지 분석을 시작했어요.',
        description: '분석이 끝나면 바로 질문할 수 있어요.',
        duration: 0,
      });
    }

    transitionToastSnapshotRef.current = current;
  }, [analysisStatusData, clientId, mode, phase, toast]);

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
              content: m.outputMessage ?? CHAT_RESPONSE_ERROR,
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
  const displayAnalyzingPercent =
    debugViewState === 'analyzing' ? 64 : analyzingPercent;
  const displayAnalysisSteps =
    debugViewState === 'analyzing' ? DEBUG_ANALYSIS_STEPS : analysisSteps;

  // 활성 배치 → 결과지 카드용 AssessmentFile
  const realFiles: AssessmentFile[] = realAssessments.map((it) => ({
    id: it.assessmentId,
    title: ASSESSMENT_KIND_LABEL[it.kind],
    fileName: formatAssessmentDisplayText(it.title),
  }));
  // 활성 배치 → popover 엔트리
  const realPopoverAssessments: RegisteredAssessmentEntry[] =
    realAssessments.map((it) => ({
      id: it.assessmentId,
      fileName: formatAssessmentDisplayText(it.title),
      testDate: '',
      pageCount: 0,
      categoryLabel: ASSESSMENT_KIND_LABEL[it.kind],
      metaLabel: `${ASSESSMENT_KIND_LABEL[it.kind]} · ${PROGRESS_LABEL[it.progress]}`,
    }));

  // 결과지가 표시되는 모든 곳(카드/popover/칩 카운트)이 같은 배치를 기반으로.
  const files: AssessmentFile[] = debugActive
    ? displayMode === 'empty'
      ? []
      : realFiles.length > 0
        ? realFiles
        : DEBUG_ASSESSMENT_FILES
    : realFiles;
  const popoverAssessments =
    debugActive && files.length > 0
      ? DEBUG_POPOVER_ASSESSMENTS
      : realPopoverAssessments;
  const popoverTranscripts =
    debugActive && displayMode === 'analyzed'
      ? DEBUG_POPOVER_TRANSCRIPTS
      : realPopoverTranscripts;
  const lastAssessmentLabel =
    displayMode === 'analyzed'
      ? debugActive
        ? '최근 검사일 2026.06.02'
        : buildRecentAssessmentLabel(realAssessments)
      : undefined;
  const assessmentSubjectMeta = clientId
    ? buildAssessmentSubjectMeta(realAssessments)
    : {};
  const displayAssessmentSubjectMeta = debugActive
    ? {
        gender: assessmentSubjectMeta.gender ?? '여자',
        age: assessmentSubjectMeta.age ?? 29,
      }
    : assessmentSubjectMeta;
  const analyzeCost = 50;

  const chipStatus = modeToChipStatus[displayMode];
  const chatPlaceholder = CHAT_PLACEHOLDER[displayMode];
  const isChatDisabled = displayMode !== 'analyzed';
  const displayTurns = debugActive
    ? DEBUG_CHAT_TURNS[debugViewState as Exclude<DebugViewState, 'real'>]
    : turns;

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
        onSettled: invalidateCreditSummary,
      });
    }
  };

  const startAnalysisError = startAnalysisMut.error
    ? getStartAnalysisErrorMessage(startAnalysisMut.error)
    : null;

  const handleChatSuggestionClick = (id: string) => {
    const found = CHAT_SUGGESTIONS.find((s) => s.id === id);
    if (found) setChatValue(found.label);
  };

  const submitChatMessage = (targetClientId: string, text: string) => {
    setChatValue('');

    // 서버 채팅 API 호출 — 서버가 grounding 구성 + 머신 호출 + turn 저장 후 응답 반환.
    // (히스토리는 서버가 스레드로 관리하므로 프론트가 전달하지 않는다.)
    const aid = `a-${Date.now()}`;
    setTurns((prev) => [
      ...prev,
      { id: `u-${Date.now()}`, role: 'user', content: text },
      {
        id: aid,
        role: 'assistant',
        content: '깊게 생각하는 중...',
        status: 'sending',
      },
    ]);
    void sendChatMessage(targetClientId, text)
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
      .catch(async () => {
        // 서버가 FAILED row를 만들었으면 history에서 messageId를 가져와 재시도 가능하게 한다.
        // 네트워크 실패 등 history도 못 가져오면 messageId 없이 에러 텍스트만 노출.
        let failedMessageId: string | undefined;
        try {
          const items = await getChatHistory(targetClientId, 5);
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
                  content: CHAT_RESPONSE_ERROR,
                  status: 'failed',
                  messageId: failedMessageId,
                }
              : t
          )
        );
      })
      .finally(() => {
        invalidateCreditSummary();
      });
  };

  const handleSendChat = () => {
    const text = chatValue.trim();
    if (!text) return;
    if (debugActive) {
      setChatValue('');
      setDebugViewState('chat-sending');
      return;
    }
    if (!clientId) return;

    if (turns.length === 0) {
      setPendingFirstChat((prev) =>
        prev?.clientId === clientId ? prev : { clientId, text }
      );
      return;
    }

    submitChatMessage(clientId, text);
  };

  const handleCloseFirstChatConfirm = () => {
    setPendingFirstChat(null);
  };

  const handleConfirmFirstChat = () => {
    if (!pendingFirstChat) return;
    const { clientId: targetClientId, text } = pendingFirstChat;
    setPendingFirstChat(null);
    submitChatMessage(targetClientId, text);
  };

  // 실패한 assistant 턴 재시도 — 서버 /retry로 같은 messageId의 출력을 다시 받는다.
  const handleRetryTurn = (turnId: string) => {
    if (!clientId) return;
    const turn = turns.find((t) => t.id === turnId);
    if (!turn?.messageId) return;
    setRetryingTurnId(turnId);
    setTurns((prev) =>
      prev.map((t) =>
        t.id === turnId
          ? { ...t, content: '깊게 생각하는 중...', status: 'sending' }
          : t
      )
    );
    void retryChatMessage(clientId, turn.messageId)
      .then((reply) => {
        setTurns((prev) =>
          prev.map((t) =>
            t.id === turnId ? { ...t, content: reply.message, status: 'ok' } : t
          )
        );
      })
      .catch(() => {
        setTurns((prev) =>
          prev.map((t) =>
            t.id === turnId
              ? { ...t, content: CHAT_RETRY_ERROR, status: 'failed' }
              : t
          )
        );
      })
      .finally(() => {
        setRetryingTurnId(null);
        invalidateCreditSummary();
      });
  };

  const handleOpenRegenerateModal = (turnId: string) => {
    setRegenerateTurnId(turnId);
  };

  const handleConfirmRegenerate = () => {
    if (!regenerateTurnId) return;
    const turnId = regenerateTurnId;
    setRegenerateTurnId(null);
    handleRetryTurn(turnId);
  };

  // chip 클릭 → popover toggle (채팅 가능 상태의 등록 결과지에만 제공)
  const canOpenPopover = displayMode === 'analyzed' && files.length > 0;
  const handleChipClick = canOpenPopover
    ? () => setIsPopoverOpen((prev) => !prev)
    : undefined;

  const handleResetClick = () => {
    setIsResetConfirmOpen(true);
  };

  const handleResetConfirm = () => {
    setIsResetConfirmOpen(false);

    if (debugActive) {
      setIsPopoverOpen(false);
      setDebugViewState('ocr-ready');
      return;
    }

    if (!clientId) {
      setIsPopoverOpen(false);
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

  const setFirstChatDebugModalOpen = (nextOpen: boolean) => {
    if (!nextOpen || !clientId) {
      setPendingFirstChat(null);
      return;
    }
    setPendingFirstChat({
      clientId,
      text: chatValue.trim() || '내담자의 심리검사 결과를 종합해서 해석해줘',
    });
  };

  const setRegenerateDebugModalOpen = (nextOpen: boolean) => {
    setRegenerateTurnId(nextOpen ? 'debug-assistant-complete' : null);
  };

  // DEBUG ONLY: prod 배포 전 이 force-visible 심리검사 상태 패널은 제거해야 한다.
  const debugPanel = useDebugPanel(
    '심리검사 화면',
    {
      view: {
        value: debugViewState,
        set: setDebugViewState,
        options: [
          'real',
          'loading',
          'empty',
          'ocr-reviewing',
          'ocr-needs-review',
          'ocr-ready',
          'analyzing',
          'chat-welcome',
          'chat-sending',
          'chat-failed',
          'chat-complete',
          'chat-multi',
        ] as const,
      },
      mode: {
        value: `${mode} -> ${displayMode}`,
        set: () => undefined,
      },
      chatInput: {
        value: chatValue,
        set: setChatValue,
        options: [
          '',
          '내담자의 심리검사 결과를 종합해서 해석해줘',
          '상담에서 조심해야 할 지점은 뭐야?',
        ] as const,
      },
      popover: {
        value: isPopoverOpen,
        set: setIsPopoverOpen,
      },
      resetModal: {
        value: isResetConfirmOpen,
        set: setIsResetConfirmOpen,
      },
      firstChatModal: {
        value: pendingFirstChat?.clientId === clientId,
        set: setFirstChatDebugModalOpen,
      },
      regenerateModal: {
        value: regenerateTurnId !== null,
        set: setRegenerateDebugModalOpen,
      },
    },
    <>
      <DebugSection label="quick state">
        <DebugChip
          label="OCR 진행"
          active={debugViewState === 'ocr-reviewing'}
          onClick={() => setDebugViewState('ocr-reviewing')}
        />
        <DebugChip
          label="OCR 보완"
          active={debugViewState === 'ocr-needs-review'}
          onClick={() => setDebugViewState('ocr-needs-review')}
        />
        <DebugChip
          label="분석 CTA"
          active={debugViewState === 'ocr-ready'}
          onClick={() => setDebugViewState('ocr-ready')}
        />
        <DebugChip
          label="분석 중"
          active={debugViewState === 'analyzing'}
          onClick={() => setDebugViewState('analyzing')}
        />
        <DebugChip
          label="채팅 빈"
          active={debugViewState === 'chat-welcome'}
          onClick={() => setDebugViewState('chat-welcome')}
        />
        <DebugChip
          label="답변 중"
          active={debugViewState === 'chat-sending'}
          onClick={() => setDebugViewState('chat-sending')}
        />
        <DebugChip
          label="답변 실패"
          active={debugViewState === 'chat-failed'}
          onClick={() => setDebugViewState('chat-failed')}
        />
        <DebugChip
          label="답변 완료"
          active={debugViewState === 'chat-complete'}
          onClick={() => setDebugViewState('chat-complete')}
        />
      </DebugSection>
      <DebugSection
        label={`chat turns: ${displayTurns.length}, disabled: ${isChatDisabled}`}
      >
        <DebugChip
          label="retrying"
          active={retryingTurnId !== null}
          onClick={() =>
            setRetryingTurnId((prev) =>
              prev ? null : 'debug-assistant-failed'
            )
          }
        />
        <DebugChip
          label="clear real turns"
          active={turns.length === 0}
          onClick={() => setTurns([])}
        />
      </DebugSection>
    </>,
    { force: true }
  );

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

  if (displayInitialLoading) {
    // 내담자 상태(phase) 확정 전 — empty/analyzing 깜빡임 없이 스피너만 노출.
    bodyContent = (
      <div className="flex flex-1 items-center justify-center">
        <Spinner size="lg" ariaLabel="내담자 검사 상태를 불러오는 중" />
      </div>
    );
  } else if (displayMode === 'empty') {
    bodyContent = <EmptyAssessmentsView onRegister={openUploadModal} />;
  } else if (displayMode === 'registered') {
    // OCR 단계별 분기(데모는 ocrStage null → ready로 취급).
    const stage = displayOcrStage ?? 'ready';
    const assessmentsCard = (
      <RegisteredAssessmentsCard
        files={files}
        onAddFile={openUploadModal}
        onRemoveFile={
          clientId ? (id) => deleteAssessmentMut.mutate(id) : undefined
        }
        maxFiles={2}
      />
    );
    if (stage === 'reviewing') {
      bodyContent = (
        <div className="flex flex-1 flex-col items-center justify-center gap-3">
          <Spinner size="lg" ariaLabel="결과지를 확인하는 중" />
          <span className="text-l font-emphasize text-grey-100">
            {displayOcrPercent}%
          </span>
          <p className="whitespace-pre-line text-center text-m font-medium text-grey-70">
            {'심리검사 결과지를 확인하고 있어요.\n보통 1~2분 안에 끝나요.'}
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
                '확인이 필요한 결과지가 있어요.\n빈 항목을 검토하고 채워 주세요.'
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
  } else if (displayMode === 'analyzing') {
    bodyContent = (
      <div className="flex flex-1 flex-col items-center justify-center">
        <AnalyzingProgressCard
          steps={displayAnalysisSteps}
          percent={displayAnalyzingPercent}
        />
      </div>
    );
  } else if (displayMode === 'analyzed') {
    bodyContent =
      displayTurns.length > 0 ? (
        <ChatConversationView
          turns={displayTurns}
          onRetry={handleRetryTurn}
          onRegenerate={handleOpenRegenerateModal}
          retryingId={retryingTurnId}
        />
      ) : (
        <ChatWelcomeView
          suggestions={CHAT_SUGGESTIONS}
          onSuggestionClick={handleChatSuggestionClick}
        />
      );
  }

  return (
    <div className={outerCls} style={outerStyle}>
      <div className={cardCls}>
        {/* 1) 프로필 헤더 — 모바일은 앱 MobileHeader의 내담자 선택/결과지 아이콘만 사용 */}
        {!isMobileView && (
          <div className="py-4 pl-8 pr-7">
            <ClientProfileHeader
              client={client}
              gender={displayAssessmentSubjectMeta.gender}
              age={displayAssessmentSubjectMeta.age}
              lastAssessmentLabel={lastAssessmentLabel}
              analysisStatus={chipStatus}
              showAnalysisStatusChip={canOpenPopover}
              chipRef={chipRef}
              onChipClick={handleChipClick}
              chipActive={isPopoverOpen}
              chipPopoverSlot={
                canOpenPopover && (
                  <RegisteredPopover
                    open={isPopoverOpen}
                    onClose={() => setIsPopoverOpen(false)}
                    triggerRef={chipRef as React.RefObject<HTMLElement>}
                    transcripts={popoverTranscripts}
                    assessments={popoverAssessments}
                    onReset={handleResetClick}
                  />
                )
              }
            />
          </div>
        )}

        {/* 2) 상담 키워드 바 — 모바일에서는 숨김 */}
        {!isMobileView && (
          <ChiefComplaintBar keywords={latestSessionKeywords} />
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

      <RegenerateChatAnswerModal
        open={regenerateTurnId !== null}
        onClose={() => setRegenerateTurnId(null)}
        onConfirm={handleConfirmRegenerate}
        creditCost={5}
      />

      <FirstChatCreditConfirmModal
        open={pendingFirstChat?.clientId === clientId}
        onClose={handleCloseFirstChatConfirm}
        onConfirm={handleConfirmFirstChat}
        creditCost={5}
      />

      <ResetConfirmModal
        open={isResetConfirmOpen}
        onClose={() => setIsResetConfirmOpen(false)}
        onConfirm={handleResetConfirm}
      />

      {debugPanel}
    </div>
  );
};

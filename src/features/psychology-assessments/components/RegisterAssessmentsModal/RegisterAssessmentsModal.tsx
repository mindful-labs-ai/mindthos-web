import { useEffect, useMemo, useRef, useState } from 'react';

import { useQueryClient } from '@tanstack/react-query';

import { cn } from '@/lib/cn';
import { useDevice } from '@/shared/hooks/useDevice';

import {
  assessmentBatchKeys,
  useAssessmentBatch,
  useConfirmAssessment,
  useDeleteAssessment,
} from '../../hooks/useAssessmentBatch';
import { useModalStepBack } from '../../hooks/useModalStepBack';
import { ASSESSMENT_SCHEMAS } from '../../schemas/assessmentSchemas';
import type { JsonSchema } from '../../schemas/jsonSchema.types';
import type {
  AssessmentItem,
  AssessmentKind,
  AssessmentUploadGateway,
  AssessmentUploadInput,
} from '../../upload/assessmentUploadGateway';
import {
  ocrInitialReviewCapPercent,
  ocrReviewPercent,
} from '../../upload/ocrProgress';
import { serverAssessmentUploadAdapter } from '../../upload/serverAssessmentUploadAdapter';
import { ASSESSMENT_KIND_LABEL } from '../../utils/assessmentDisplay';
import { toLoadingDisplayPercent } from '../../utils/loadingProgress';
import {
  applyMissingSchemaConstants,
  getSchemaReviewStats,
  projectScoreToSchema,
} from '../../utils/schemaReview';
import { PATH_SEP } from '../../utils/schemaToFields';
import {
  getCleanupErrorMessage,
  getConfirmErrorMessage,
  getUploadErrorMessage,
} from '../../utils/userMessages';

import { RegisterModalFooter } from './shared/RegisterModalFooter';
import { RegisterModalHeader } from './shared/RegisterModalHeader';
import { RegisterStepper } from './shared/RegisterStepper';
import { Step1UploadView, type Step1Substate } from './step1/Step1UploadView';
import {
  Step2FillingFormGroup,
  type FillingFormDescriptor,
} from './step2/Step2FillingFormGroup';
import { Step2VerifyView, type Step2Substate } from './step2/Step2VerifyView';
import { Step3CompleteView } from './step3/Step3CompleteView';
import {
  MAX_FILES,
  MAX_FILE_SIZE_MB,
  type AssessmentTypeId,
  type RegisterStep,
  type UploadedFile,
  type VerificationResult,
} from './types';

type Step2Mode = 'list-complete' | 'list-missing' | 'filling';

interface RegisterAssessmentsModalProps {
  open: boolean;
  onClose: () => void;
  /** 분석 단가 (step 3 CTA 표시용) */
  analyzeCost?: number;
  /** 등록 완료 후 분석 시작 콜백. 부모가 mutation을 실행하고 성공 시 모달을 닫는다. */
  onAnalyze?: () => void;
  /** 분석 시작 mutation pending. 버튼 비활성화 + 라벨 변경에 사용. */
  isStartingAnalysis?: boolean;
  /** 분석 시작 mutation 에러 메시지 (402/409/503 등). step3에 인라인 노출. */
  startAnalysisError?: string | null;
  /** 실제 업로드 대상 내담자 ID. 있으면 step1에서 실제 업로드 수행. */
  clientId?: string;
  /** 업로드 gateway (주입). 미지정 시 서버 adapter 사용. 테스트는 mock 주입. */
  uploadGateway?: AssessmentUploadGateway;
  /**
   * 이어보기 모드. 서버에 진행 중/검토 대기 배치가 있을 때 어디로 복원할지 지정한다.
   * - 'reviewing': OCR 진행 표시 화면(step1 reviewing)
   * - 'verify'   : 검증·보완 화면(step2)로 바로 진입
   * - 그 외(미지정): 기존대로 빈 업로드 화면(step1)에서 시작.
   */
  resume?: 'reviewing' | 'verify' | false;
  /** 이미 등록된(활성 배치) 검사 종류. 같은 종류 중복 업로드를 막는 가드에 쓴다. */
  existingKinds?: AssessmentKind[];
}

/** 프론트 검사 종류 id → 도메인 AssessmentKind. */
const TYPE_ID_TO_KIND: Record<AssessmentTypeId, AssessmentKind> = {
  mmpi: 'mmpi',
  tci: 'tci',
};

/** 파일명으로 검사 종류 추론 (업로드 편의용 기본값). */
const inferTypeIdFromName = (name: string): AssessmentTypeId | null => {
  const lower = name.toLowerCase();
  if (lower.includes('mmpi')) return 'mmpi';
  if (lower.includes('tci')) return 'tci';
  return null;
};

/** 검사 종류 → step2 검증 카드 카테고리 라벨. */
const KIND_TO_CATEGORY: Record<AssessmentKind, string> = {
  ...ASSESSMENT_KIND_LABEL,
};

const MAX_FILES_ERROR_MESSAGE =
  '결과지는 최대 2개까지 등록할 수 있어요. 다면적 인성검사와 기질 검사 결과지를 각 1개씩 다시 선택해 주세요.';

const formatRejectedFileNames = (names: string[]) => {
  if (names.length === 1) return `${names[0]} 파일`;
  const visible = names.slice(0, 2).join(', ');
  const suffix = names.length > 2 ? ` 외 ${names.length - 2}개` : '';
  return `${visible}${suffix} 파일`;
};

const getReviewScore = (item: AssessmentItem): Record<string, unknown> =>
  item.score ?? item.tempScore ?? {};

const isReviewTerminalItem = (item: AssessmentItem): boolean =>
  item.progress === 'completed' || item.progress === 'failed';

const NUMERIC_RE = /^-?\d+(\.\d+)?$/;

/** 사용자 입력값(path → 문자열)을 기존 score에 덮어써 확정용 전체 점수 객체를 만든다. */
function applyValues(
  score: Record<string, unknown>,
  values: Record<string, string>,
  schema: JsonSchema
): Record<string, unknown> {
  const clone = applyMissingSchemaConstants(schema, score);
  for (const [path, raw] of Object.entries(values)) {
    const trimmed = raw.trim();
    if (trimmed === '') continue;
    // 배열 입력(결정적문항)은 JSON 배열 문자열로 들어온다 → 배열로 복원.
    // TRIN("65T") 등 접미사 문자열은 그대로, 순수 숫자만 Number로.
    let coerced: unknown;
    if (trimmed.startsWith('[')) {
      try {
        coerced = JSON.parse(trimmed);
      } catch {
        coerced = trimmed;
      }
    } else {
      coerced = NUMERIC_RE.test(trimmed) ? Number(trimmed) : trimmed;
    }
    const segs = path.split(PATH_SEP);
    let cur: Record<string, unknown> = clone;
    for (let i = 0; i < segs.length - 1; i++) {
      const key = segs[i];
      const next = cur[key];
      if (next === null || typeof next !== 'object' || Array.isArray(next)) {
        cur[key] = {};
      }
      cur = cur[key] as Record<string, unknown>;
    }
    cur[segs[segs.length - 1]] = coerced;
  }
  return projectScoreToSchema(schema, clone);
}

/* -----------------------------------------------------
 * 데모 mock data — 실 데이터 연동 시 props/쿼리로 교체
 * -----------------------------------------------------*/

const MOCK_INITIAL_FILES: UploadedFile[] = [
  {
    id: 'f1',
    fileName: '다면적_인성검사_홍길동_결과지.pdf',
    sizeMB: 12.3,
    pageCount: 12,
    assessmentType: 'mmpi',
    status: 'ready',
  },
  {
    id: 'f2',
    fileName: '기질_검사_홍길동_결과지.pdf',
    sizeMB: 12.3,
    pageCount: 8,
    assessmentType: 'tci',
    status: 'ready',
  },
];

const DEMO_REVIEWING_PERCENT = toLoadingDisplayPercent(
  39,
  'ocr:modal-demo-reviewing'
);
const INITIAL_REVIEWING_CAP_MS = 1200;

const MOCK_VERIFICATION_RESULTS_ALL_OK: VerificationResult[] = [
  {
    fileId: 'f1',
    fileName: '다면적_인성검사_홍길동_결과지.pdf',
    categoryLabel: '다면적 인성검사',
    itemsVerified: 167,
    itemsTotal: 167,
    status: 'complete',
  },
  {
    fileId: 'f2',
    fileName: '기질_검사_홍길동_결과지.pdf',
    categoryLabel: '기질 검사',
    itemsVerified: 46,
    itemsTotal: 46,
    status: 'complete',
  },
];

const MOCK_VERIFICATION_RESULTS_MISSING: VerificationResult[] = [
  {
    fileId: 'f1',
    fileName: '다면적_인성검사_홍길동_결과지.pdf',
    categoryLabel: '다면적 인성검사',
    itemsVerified: 167,
    itemsTotal: 167,
    status: 'complete',
  },
  {
    fileId: 'f2',
    fileName: '기질_검사_홍길동_결과지.pdf',
    categoryLabel: '기질 검사',
    itemsVerified: 34,
    itemsTotal: 46,
    status: 'missing',
  },
];

const formatBy = (
  step1Sub: Step1Substate,
  files: UploadedFile[]
): UploadedFile[] => {
  if (step1Sub === 'empty') return [];
  return files;
};

export const RegisterAssessmentsModal = ({
  open,
  onClose,
  analyzeCost = 50,
  onAnalyze,
  isStartingAnalysis = false,
  startAnalysisError = null,
  clientId,
  uploadGateway = serverAssessmentUploadAdapter,
  resume = false,
  existingKinds = [],
}: RegisterAssessmentsModalProps) => {
  const { isMobile, isTablet } = useDevice();
  const isMobileView = isMobile || isTablet;
  const qc = useQueryClient();

  const [step, setStep] = useState<RegisterStep>(1);

  /* -------- 실제 업로드 (clientId 있을 때) -------- */
  // 실제 업로드 모드: clientId가 주어지면 mock 대신 서버 업로드를 수행한다.
  const realUploadMode = !!clientId;

  /* -------- step 1 state -------- */
  const [step1Sub, setStep1Sub] = useState<Step1Substate>('empty');
  // 실모드는 빈 목록에서 시작(사용자가 직접 파일 선택). 데모만 mock 프리필.
  const [files, setFiles] = useState<UploadedFile[]>(() =>
    clientId ? [] : MOCK_INITIAL_FILES
  );
  const reviewingPercent = DEMO_REVIEWING_PERCENT;
  const fileInputRef = useRef<HTMLInputElement>(null);
  const fileBlobsRef = useRef<Map<string, File>>(new Map());
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [cleaningUp, setCleaningUp] = useState(false);
  const [initialReviewingCap, setInitialReviewingCap] = useState(false);
  const [reviewItemsSnapshot, setReviewItemsSnapshot] = useState<
    AssessmentItem[]
  >([]);

  /* -------- 활성 배치 폴링 (OCR 진행 추적 + step2 검증 데이터) -------- */
  // 실모드로 열려 있는 동안 활성 배치를 구독한다(reviewing 진행 + step2 검증/보완 모두 사용).
  // 폴링은 훅 내부에서 in-flight 있을 때만 돌고, 전부 종료되면 멈춘다.
  const isReviewing = realUploadMode && open && step1Sub === 'reviewing';
  const { data: serverItems = [] } = useAssessmentBatch(clientId, {
    enabled: realUploadMode && open,
  });

  const polledItems = serverItems;
  const reviewItems =
    realUploadMode && step >= 2 && polledItems.length === 0
      ? reviewItemsSnapshot
      : polledItems;
  const reviewStatsByAssessmentId = useMemo(
    () =>
      new Map(
        reviewItems.map((item) => [
          item.assessmentId,
          getSchemaReviewStats(
            ASSESSMENT_SCHEMAS[item.kind],
            getReviewScore(item)
          ),
        ])
      ),
    [reviewItems]
  );

  const realReviewingPercent = useMemo(() => {
    const percent = ocrReviewPercent(polledItems);
    if (!initialReviewingCap) return percent;
    return Math.min(percent, ocrInitialReviewCapPercent(polledItems));
  }, [initialReviewingCap, polledItems]);

  useEffect(() => {
    if (!isReviewing || !initialReviewingCap) return;
    const timer = window.setTimeout(
      () => setInitialReviewingCap(false),
      INITIAL_REVIEWING_CAP_MS
    );
    return () => window.clearTimeout(timer);
  }, [initialReviewingCap, isReviewing]);

  // 전부 종료되면 Step2로 진행
  useEffect(() => {
    if (!isReviewing || polledItems.length === 0) return;
    const allDone = polledItems.every(isReviewTerminalItem);
    if (allDone) {
      setReviewItemsSnapshot(polledItems);
      setStep2Mode('list-missing');
      setStep(2);
    }
  }, [isReviewing, polledItems]);

  useEffect(() => {
    if (
      !realUploadMode ||
      step < 2 ||
      polledItems.length === 0 ||
      !polledItems.every(isReviewTerminalItem)
    ) {
      return;
    }
    setReviewItemsSnapshot(polledItems);
  }, [polledItems, realUploadMode, step]);

  /* -------- step 2 state -------- */
  const [step2Mode, setStep2Mode] = useState<Step2Mode>('list-missing');
  const step2Sub: Step2Substate = step2Mode === 'filling' ? 'filling' : 'list';

  /* -------- filling 폼에서 실시간 카운트 받아 summary에 반영 -------- */
  const [fillingCounts, setFillingCounts] = useState<{
    filled: number;
    total: number;
  }>({ filled: 0, total: 0 });

  // 실제 OCR 결과 → step2 검증 카드. reviewItems(활성 배치/완료 스냅샷)의 score 기반.
  const realVerificationResults: VerificationResult[] = useMemo(
    () =>
      reviewItems.map((it) => {
        if (it.validation === 'invalid' || it.progress === 'failed') {
          return {
            fileId: it.assessmentId,
            fileName: it.title,
            categoryLabel: KIND_TO_CATEGORY[it.kind],
            itemsVerified: null,
            itemsTotal: null,
            status: 'invalid' as const,
            invalidReason:
              it.progress === 'failed'
                ? '결과지를 읽지 못했어요'
                : '지원하는 결과지인지 확인해 주세요',
          };
        }
        const stats = reviewStatsByAssessmentId.get(it.assessmentId);
        if (!stats) {
          return {
            fileId: it.assessmentId,
            fileName: it.title,
            categoryLabel: KIND_TO_CATEGORY[it.kind],
            itemsVerified: null,
            itemsTotal: null,
            status: 'invalid' as const,
            invalidReason:
              '확인할 수 없는 결과지 항목이 있어요. 다시 등록해 주세요',
          };
        }
        // MISSING_FIELD는 서버가 ocr_score를 null로 두고 교집합(누락=null)을 temp_ocr_score에
        // 보관한다. object null은 스키마 하위 leaf로 펼쳐 실제 입력할 항목 수로 계산한다.
        return {
          fileId: it.assessmentId,
          fileName: it.title,
          categoryLabel: KIND_TO_CATEGORY[it.kind],
          itemsVerified: stats.verified,
          itemsTotal: stats.total,
          status:
            stats.missing > 0
              ? ('missing' as const)
              : it.validation === 'missing_field'
                ? ('invalid' as const)
                : ('complete' as const),
          invalidReason:
            it.validation === 'missing_field' && stats.missing === 0
              ? '확인할 수 없는 결과지 항목이 있어요. 다시 등록해 주세요'
              : undefined,
        };
      }),
    [reviewItems, reviewStatsByAssessmentId]
  );

  // 실모드는 서버 데이터 또는 완료 스냅샷만 사용한다. 가짜 mock을 보여주고 Step3까지
  // 진행시켜 서버 409를 맞는 사고를 막는다. (데모 모드는 mock 분기 유지.)
  const verificationResults: VerificationResult[] = realUploadMode
    ? realVerificationResults
    : step2Mode === 'list-complete'
      ? MOCK_VERIFICATION_RESULTS_ALL_OK
      : MOCK_VERIFICATION_RESULTS_MISSING;

  // 실모드 + 검수 기준 데이터 없음 = 분석 가능한 검사가 없는 상태. step2/step3 진행 차단.
  const noRealAssessments = realUploadMode && reviewItems.length === 0;

  // INITIATED는 presigned 발급 후 S3 PUT/complete가 실패해 남은 드래프트.
  // OCR이 자연 진행되지 않으므로 cleanup이 유일한 정리 경로다. 새로고침/모달 재오픈
  // 시에도 보이도록 step1 sub-state 전반에서 배너를 노출한다.
  const hasIncompleteUploads =
    realUploadMode && polledItems.some((it) => it.progress === 'initiated');
  const cleanupBannerVisible =
    hasIncompleteUploads ||
    (uploadError !== null &&
      polledItems.length > 0 &&
      step1Sub !== 'reviewing');

  /* -------- 누락 필드 확정 (write) -------- */
  // 검수 카드에서 누락으로 잡힌 검사만 채우기 대상. 사용자가 채운 값을 assessmentId별로 보관.
  const missingItems = useMemo(
    () =>
      reviewItems.filter((item) => {
        const stats = reviewStatsByAssessmentId.get(item.assessmentId);
        return (
          item.progress === 'completed' &&
          item.validation !== 'invalid' &&
          stats !== undefined &&
          stats.missing > 0
        );
      }),
    [reviewItems, reviewStatsByAssessmentId]
  );
  // 실모드는 항상 실데이터 폼만 쓴다. missing이 없으면 폼도 비어있는 상태로 렌더링.
  const useRealFilling = realUploadMode;
  const [fillingValues, setFillingValues] = useState<
    Record<string, Record<string, string>>
  >({});
  const confirmMut = useConfirmAssessment(clientId);
  const deleteMut = useDeleteAssessment(clientId);
  const [confirming, setConfirming] = useState(false);
  const [confirmError, setConfirmError] = useState<string | null>(null);

  // 실데이터 채우기 폼: 각 MISSING_FIELD 검사의 null leaf만 노출 + 입력값 수집.
  const realFillingForms: FillingFormDescriptor[] = missingItems.map((it) => {
    const stats = reviewStatsByAssessmentId.get(it.assessmentId);
    return {
      id: it.assessmentId,
      categoryLabel: KIND_TO_CATEGORY[it.kind],
      missingCount: stats?.missing ?? 0,
      formKey: it.kind,
      visibleLeaf: (path: string) => stats?.missingPaths.has(path) ?? false,
      onValuesChange: (values: Record<string, string>) =>
        setFillingValues((prev) => ({ ...prev, [it.assessmentId]: values })),
    };
  });

  // 채운 값을 기존 score에 덮어써 검사별로 confirm 호출. 전부 성공하면 step3.
  const submitConfirms = async (): Promise<void> => {
    setConfirming(true);
    setConfirmError(null);
    try {
      for (const it of missingItems) {
        // MISSING_FIELD 기반은 temp_ocr_score(교집합). 채운 값을 덮어 full score로 confirm.
        const merged = applyValues(
          it.tempScore ?? it.score ?? {},
          fillingValues[it.assessmentId] ?? {},
          ASSESSMENT_SCHEMAS[it.kind]
        );
        await confirmMut.mutateAsync({
          assessmentId: it.assessmentId,
          score: merged,
        });
      }
      setStep(3);
    } catch (err) {
      setConfirmError(getConfirmErrorMessage(err));
    } finally {
      setConfirming(false);
    }
  };

  /* -------- 실모드: 열 때 상태 초기화 / 이어보기 복원 -------- */
  // 닫힘→열림 전이에서만 실행(진행 중 재실행 방지).
  // - resume 'verify'   : 검증/보완 화면(step2)로 바로 진입.
  // - resume 'reviewing': OCR 진행 표시(step1 reviewing). 폴링이 돌며 전부 종료되면
  //   아래 effect가 step2로 올린다.
  // - 일반: 이전 세션의 step3/파일/입력값/blob을 비우고 step1 empty에서 시작.
  const wasOpenRef = useRef(false);
  useEffect(() => {
    if (open && !wasOpenRef.current) {
      setUploadError(null);
      setConfirmError(null);
      if (resume === 'verify') {
        setStep(2);
        setStep2Mode('list-missing');
        setInitialReviewingCap(false);
      } else if (resume === 'reviewing') {
        setStep(1);
        setStep1Sub('reviewing');
        setStep2Mode('list-missing');
        setInitialReviewingCap(false);
      } else {
        setStep(1);
        setStep1Sub('empty');
        setStep2Mode('list-missing');
        setInitialReviewingCap(false);
        setReviewItemsSnapshot([]);
        if (realUploadMode) setFiles([]);
        setFillingValues({});
        fileBlobsRef.current.clear();
      }
    }
    wasOpenRef.current = open;
  }, [open, realUploadMode, resume]);

  /* -------- escape / scroll lock -------- */
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.body.style.overflow = 'hidden';
    document.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = '';
      document.removeEventListener('keydown', onKey);
    };
  }, [open, onClose]);

  /* -------- step 1 handlers -------- */
  const handleSelectFiles = () => {
    if (realUploadMode) {
      const usedSlots =
        files.length + (realUploadMode ? existingKinds.length : 0);
      if (usedSlots >= MAX_FILES) {
        setUploadError(MAX_FILES_ERROR_MESSAGE);
        return;
      }
      // 실제 모드: OS 파일 선택창 열기
      fileInputRef.current?.click();
      return;
    }
    // 데모: empty → list 로 전환
    setStep1Sub('list');
    setFiles(MOCK_INITIAL_FILES);
  };

  // 실제 파일 선택 → UploadedFile 엔트리 + File 핸들 보관. PDF/크기/개수 제약을 강제한다.
  const handleFilesPicked = (picked: FileList | null) => {
    if (!picked || picked.length === 0) return;
    setUploadError(null);

    const incoming = Array.from(picked);
    const rejected: string[] = [];
    const invalidTypeFileNames: string[] = [];

    // 1) 파일 타입: PDF만 허용. accept 속성도 PDF지만 드래그/일부 OS는 우회 가능.
    const pdfOnly = incoming.filter((f) => {
      const isPdf = f.type === 'application/pdf' || /\.pdf$/i.test(f.name);
      if (!isPdf) invalidTypeFileNames.push(f.name);
      return isPdf;
    });
    if (invalidTypeFileNames.length > 0) {
      rejected.push(
        `PDF 파일만 등록할 수 있어요. ${formatRejectedFileNames(
          invalidTypeFileNames
        )}은 지원하지 않는 형식이에요.`
      );
    }

    // 2) 파일 크기 상한 (개별).
    const sizeOk = pdfOnly.filter((f) => {
      const sizeMB = f.size / (1024 * 1024);
      if (sizeMB > MAX_FILE_SIZE_MB) {
        rejected.push(
          `${formatRejectedFileNames([f.name])}은 ${MAX_FILE_SIZE_MB}MB보다 커요. 더 작은 PDF 파일을 선택해 주세요.`
        );
        return false;
      }
      return true;
    });

    // 3) 총 개수 상한. 초과 선택은 부분 수용하지 않고 이번 선택 전체를 거절한다.
    const usedSlots =
      files.length + (realUploadMode ? existingKinds.length : 0);
    const remaining = Math.max(0, MAX_FILES - usedSlots);
    if (sizeOk.length > remaining) {
      rejected.push(MAX_FILES_ERROR_MESSAGE);
    }

    if (rejected.length > 0) {
      setUploadError(rejected.join(' '));
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    if (sizeOk.length === 0) {
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    const added: UploadedFile[] = sizeOk.map((file) => {
      const id = `f-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      fileBlobsRef.current.set(id, file);
      const typeId = inferTypeIdFromName(file.name);
      return {
        id,
        fileName: file.name,
        sizeMB: Math.round((file.size / (1024 * 1024)) * 10) / 10,
        pageCount: 0,
        assessmentType: typeId,
        status: typeId ? ('ready' as const) : ('missing-type' as const),
      };
    });

    setFiles((prev) => [...prev, ...added]);
    setStep1Sub('list');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleAddMore = () => {
    const usedSlots =
      files.length + (realUploadMode ? existingKinds.length : 0);
    if (usedSlots >= MAX_FILES) {
      setUploadError(MAX_FILES_ERROR_MESSAGE);
      return;
    }
    if (realUploadMode) {
      fileInputRef.current?.click();
      return;
    }
    const next: UploadedFile = {
      id: `f-${Date.now()}`,
      fileName: '홍길동_결과지.pdf',
      sizeMB: 0,
      pageCount: 0,
      assessmentType: null,
      status: 'missing-type',
    };
    setFiles((prev) => [...prev, next]);
  };

  const handleChangeType = (fileId: string, typeId: AssessmentTypeId) => {
    setFiles((prev) =>
      prev.map((f) =>
        f.id === fileId
          ? { ...f, assessmentType: typeId, status: 'ready' as const }
          : f
      )
    );
  };

  const handleRemoveFile = (fileId: string) => {
    fileBlobsRef.current.delete(fileId);
    setUploadError(null);
    setFiles((prev) => prev.filter((f) => f.id !== fileId));
  };

  // 실제 업로드 수행: gateway가 presigned 발급 → S3 PUT → complete를 캡슐화.
  const runRealUpload = async (): Promise<boolean> => {
    if (!clientId) return false;
    const usedSlots =
      files.length + (realUploadMode ? existingKinds.length : 0);
    if (files.length > MAX_FILES || usedSlots > MAX_FILES) {
      setUploadError(MAX_FILES_ERROR_MESSAGE);
      return false;
    }
    const inputs: AssessmentUploadInput[] = [];
    for (const f of files) {
      const file = fileBlobsRef.current.get(f.id);
      if (!file || !f.assessmentType) continue; // 타입 미지정/핸들 없음 제외
      const kind = TYPE_ID_TO_KIND[f.assessmentType];
      inputs.push({ kind, title: f.fileName, file });
    }
    if (inputs.length === 0) {
      setUploadError(
        '등록할 결과지가 없어요. 다면적 인성검사 또는 기질 검사 결과지를 선택해 주세요.'
      );
      return false;
    }
    setUploading(true);
    setUploadError(null);
    try {
      const { results } = await uploadGateway.uploadAssessments(
        clientId,
        inputs
      );
      console.info('[assessment-upload] 완료:', results);
      // 업로드 직후 활성 배치를 무효화 → reviewing 폴링이 stale 캐시 대신
      // 갓 만들어진 PENDING 검사를 즉시 받아 OCR 진행을 추적한다.
      await qc.invalidateQueries({
        queryKey: assessmentBatchKeys.batch(clientId),
      });
      return true;
    } catch (err) {
      setUploadError(getUploadErrorMessage(err));
      // 부분 실패로 서버에 v0 드래프트가 남았을 수 있음. 배치를 invalidate해 사용자가
      // 정리하기 버튼으로 삭제 후 재시도할 수 있게 한다.
      await qc.invalidateQueries({
        queryKey: assessmentBatchKeys.batch(clientId),
      });
      return false;
    } finally {
      setUploading(false);
    }
  };

  // 부분 업로드 실패 후 서버에 남은 v0 드래프트를 일괄 삭제. 사용자가 step1에서 재시도 가능.
  const handleCleanupDrafts = async (): Promise<void> => {
    if (!clientId || polledItems.length === 0) return;
    setCleaningUp(true);
    setUploadError(null);
    try {
      for (const it of polledItems) {
        await deleteMut.mutateAsync(it.assessmentId);
      }
      await qc.invalidateQueries({
        queryKey: assessmentBatchKeys.batch(clientId),
      });
      // 정리 후엔 빈 업로드 화면으로 돌아간다 — reviewing UI가 0%로 멈춰있는 잔상 방지.
      setStep1Sub('empty');
      setInitialReviewingCap(false);
      setReviewItemsSnapshot([]);
      setFiles([]);
      fileBlobsRef.current.clear();
    } catch (err) {
      setUploadError(getCleanupErrorMessage(err));
    } finally {
      setCleaningUp(false);
    }
  };

  /* -------- 검사 종류 가드 (다면적 인성검사/기질 검사 각 1개) -------- */
  // 기존 활성 배치(existingKinds) + 이번에 선택한 파일의 종류를 합쳐, 같은 종류가 2개
  // 이상이면 진행 차단 + 안내. 서버도 중복을 거절하지만 즉시 UX로 알려준다.
  // 파일 선택 단계(list)에서만 평가한다. 업로드 후(reviewing/step2)에는 files가
  // 활성 배치(existingKinds)에도 그대로 잡혀 같은 파일이 이중 집계되므로 가드를 끈다.
  const duplicateKind = useMemo<AssessmentKind | null>(() => {
    if (!realUploadMode || step1Sub !== 'list') return null;
    const counts: Record<string, number> = {};
    for (const k of existingKinds) counts[k] = (counts[k] ?? 0) + 1;
    for (const f of files) {
      const k = f.assessmentType
        ? TYPE_ID_TO_KIND[f.assessmentType]
        : undefined;
      if (k) counts[k] = (counts[k] ?? 0) + 1;
    }
    const dup = (Object.keys(counts) as AssessmentKind[]).find(
      (k) => counts[k] > 1
    );
    return dup ?? null;
  }, [realUploadMode, step1Sub, existingKinds, files]);

  const duplicateKindMessage = duplicateKind
    ? `${KIND_TO_CATEGORY[duplicateKind]}는 1개만 등록할 수 있어요. 같은 종류의 결과지를 정리한 뒤 다시 선택해 주세요.`
    : null;
  const usedFileSlots =
    files.length + (realUploadMode ? existingKinds.length : 0);
  const remainingFileSlots = Math.max(0, MAX_FILES - usedFileSlots);
  const canPickMoreFiles = remainingFileSlots > 0;

  /* -------- step 진행 -------- */
  const canProceedStep1 =
    step1Sub === 'list' &&
    files.length > 0 &&
    files.length <= MAX_FILES &&
    usedFileSlots <= MAX_FILES &&
    files.every((f) => f.status !== 'missing-type') &&
    !duplicateKind;

  // 서버 계약: COMPLETED+VALID+ocrScore만 분석 확정 가능. invalid/failed는 삭제 후 재업로드.
  // missing(누락 필드)은 채우기 폼으로, invalid는 step3 진행 차단 + 인라인 삭제로 분기.
  const hasMissingVerification = useMemo(
    () => verificationResults.some((r) => r.status === 'missing'),
    [verificationResults]
  );
  const hasInvalidVerification = useMemo(
    () => verificationResults.some((r) => r.status === 'invalid'),
    [verificationResults]
  );

  const handleNext = () => {
    if (step === 1) {
      if (!canProceedStep1 || uploading) return;
      if (realUploadMode) {
        // 업로드 성공 → reviewing 단계로. OCR 진행은 폴링이 추적하고,
        // 전부 COMPLETED되면 useEffect가 Step2로 진행시킨다.
        void runRealUpload().then((ok) => {
          if (ok) {
            setInitialReviewingCap(true);
            setStep2Mode('list-missing');
            setStep1Sub('reviewing');
          }
        });
        return;
      }
      setStep(2);
      return;
    }
    if (step === 2) {
      // 실모드에 검사가 하나도 없으면 분석 시작 불가.
      if (noRealAssessments) return;
      // invalid 있으면 step3 진행 불가. 사용자가 삭제 후 step1로 돌아가야 함.
      if (step2Sub === 'list' && hasInvalidVerification) return;
      if (step2Sub === 'list' && hasMissingVerification) {
        setReviewItemsSnapshot(reviewItems);
        setFillingCounts({ filled: 0, total: 0 });
        setStep2Mode('filling');
        return;
      }
      if (step2Sub === 'filling') {
        if (useRealFilling) {
          // 모든 누락 필드를 채워야 확정 가능 (서버는 재검증 없이 그대로 저장).
          const incomplete =
            confirming ||
            fillingCounts.total === 0 ||
            fillingCounts.filled < fillingCounts.total;
          if (incomplete) return;
          // 실데이터: 채운 값으로 검사별 confirm → 성공 시 step3.
          void submitConfirms();
          return;
        }
        // 데모: 채우기 완료 → 검증 결과 전체 통과로 갱신 후 step 3
        setStep2Mode('list-complete');
        setStep(3);
        return;
      }
      setStep(3);
      return;
    }
  };

  const handleBack = () => {
    if (step === 2) {
      if (step2Sub === 'filling') {
        setStep2Mode('list-missing');
        return;
      }
      setStep(1);
      setStep1Sub(files.length > 0 ? 'list' : 'empty');
      setInitialReviewingCap(false);
      setReviewItemsSnapshot([]);
      return;
    }
  };

  const baseVerifiedCount = useMemo(
    () =>
      verificationResults
        .filter((r) => r.itemsTotal !== null)
        .reduce((acc, r) => acc + (r.itemsVerified ?? 0), 0),
    [verificationResults]
  );
  const baseTotalCount = useMemo(
    () =>
      verificationResults
        .filter((r) => r.itemsTotal !== null)
        .reduce((acc, r) => acc + (r.itemsTotal ?? 0), 0),
    [verificationResults]
  );

  // 전체 항목 수(total)는 검증 결과 기준으로 고정. 누락 필드는 이미 total에 포함돼 있으므로
  // filling 카운트를 total에 더하면 이중 집계된다(누락이 늘어나는 버그). filling 중에는
  // 채운 개수(filled)만 verified에 더해 누락이 줄어들게 한다.
  const isFilling = step2Sub === 'filling';
  const totalCount = baseTotalCount;
  const verifiedCount = isFilling
    ? Math.min(totalCount, baseVerifiedCount + fillingCounts.filled)
    : baseVerifiedCount;
  const missingCount = Math.max(0, totalCount - verifiedCount);

  // 단계 뒤로가기 가능 여부 — footer '이전' 노출 조건(isFilling || !resume)과 일치.
  // step2의 filling↔list, list→step1만 뒤로 가능하고 step1/step3/resume-list에서는 닫힌다.
  const canStepBack = step === 2 && (isFilling || !resume);

  // 모바일 헤더 뒤로가기 / 하드웨어 뒤로가기 공통 동작: 가능하면 한 단계 뒤로, 아니면 닫기.
  const handleHeaderBack = () => {
    if (canStepBack) handleBack();
    else onClose();
  };

  // 모바일: 하드웨어/브라우저 뒤로가기(엣지 스와이프 포함)를 단계 뒤로가기(handleBack)에
  // 연결(depth). 더 뒤로 갈 단계가 없으면(루트) 모달을 닫는다.
  useModalStepBack({
    enabled: open && isMobileView,
    canBack: canStepBack,
    onBack: handleBack,
    onClose,
  });

  /* -------- footer config 분기 -------- */
  const footer = (() => {
    if (step === 1) {
      return {
        rightButton: {
          label: uploading ? '업로드 중…' : '다음',
          tone:
            canProceedStep1 && !uploading
              ? ('primary' as const)
              : ('disabled' as const),
          onClick: handleNext,
        },
      };
    }
    if (step === 2) {
      const nextLabel =
        hasInvalidVerification && !isFilling
          ? '삭제 후 다시 등록'
          : hasMissingVerification && !isFilling
            ? '빈 항목 채우기'
            : confirming
              ? '저장 중…'
              : '다음';
      // 실데이터 채우기 중에는 모든 누락 필드를 채워야 확정 가능.
      const fillingIncomplete =
        useRealFilling &&
        isFilling &&
        (fillingCounts.total === 0 ||
          fillingCounts.filled < fillingCounts.total);
      const nextDisabled =
        confirming ||
        fillingIncomplete ||
        (hasInvalidVerification && !isFilling) ||
        noRealAssessments;
      // 이어보기(resume)로 step2에 바로 진입한 경우, list 단계의 '이전'은 돌아갈 step1
      // 업로드 화면이 없어 reviewing으로 튕기며 먹통이 된다 → 숨긴다.
      // filling 단계의 '이전'은 같은 step2 내 list로 가는 것이라 항상 노출.
      const showBack = isFilling || !resume;
      return {
        ...(showBack
          ? {
              leftButton: {
                label: '이전',
                tone: 'outline' as const,
                onClick: handleBack,
              },
            }
          : {}),
        rightButton: {
          label: nextLabel,
          tone: nextDisabled ? ('disabled' as const) : ('primary' as const),
          onClick: handleNext,
        },
      };
    }
    return {
      leftButton: {
        label: '닫기',
        tone: 'outline' as const,
        onClick: onClose,
      },
      rightButton: {
        label: isStartingAnalysis ? '분석 시작 중…' : '결과지 분석하기',
        tone: isStartingAnalysis ? ('disabled' as const) : ('primary' as const),
        creditCost: analyzeCost,
        // 성공 시 부모가 모달을 닫는다. 실패 시 startAnalysisError에 메시지가 잡혀
        // step3 인라인에 노출되므로, 여기서는 onClose를 호출하지 않는다.
        onClick: () => onAnalyze?.(),
      },
    };
  })();

  /* -------- 누락 채우기 폼 — 검사별 카드 그룹 -------- */
  // 실모드는 항상 실폼만 사용(없으면 빈 배열). 데모만 mock descriptor.
  const fillingFormDescriptors: FillingFormDescriptor[] = useRealFilling
    ? realFillingForms
    : [
        {
          id: 'mock-mmpi',
          categoryLabel: '다면적 인성검사',
          missingCount: 12,
          formKey: 'mmpi',
        },
        {
          id: 'mock-tci',
          categoryLabel: '기질 검사',
          missingCount: 2,
          formKey: 'tci',
        },
      ];

  const fillingForm = (
    <Step2FillingFormGroup
      forms={fillingFormDescriptors}
      onCountsChange={setFillingCounts}
    />
  );

  if (!open) return null;

  /* -------- 모달 렌더링 -------- */
  return (
    <div
      className={cn(
        'fixed inset-0 z-modal flex bg-black/40',
        isMobileView ? 'p-0' : 'items-center justify-center p-4'
      )}
      role="dialog"
      aria-modal="true"
    >
      <div
        className={cn(
          'flex flex-col overflow-hidden bg-surface',
          isMobileView
            ? 'h-full w-full rounded-none'
            : 'h-[min(820px,92vh)] w-[min(560px,92vw)] rounded-2xl shadow-prominent'
        )}
      >
        <RegisterModalHeader
          onClose={onClose}
          onBack={handleHeaderBack}
          isMobileView={isMobileView}
        />

        <div className={cn(isMobileView ? 'px-4 pb-4 pt-6' : 'px-8 pb-6 pt-6')}>
          <RegisterStepper current={step} />
        </div>

        <div
          className={cn(
            'flex min-h-0 flex-1 flex-col overflow-y-auto pb-2',
            isMobileView ? 'px-4' : 'px-[52px]'
          )}
        >
          {step === 1 && (
            <>
              {realUploadMode && (
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="application/pdf"
                  multiple={remainingFileSlots > 1}
                  disabled={!canPickMoreFiles}
                  className="hidden"
                  onChange={(e) => handleFilesPicked(e.target.files)}
                />
              )}
              <Step1UploadView
                substate={step1Sub}
                files={formatBy(step1Sub, files)}
                reviewingPercent={
                  realUploadMode ? realReviewingPercent : reviewingPercent
                }
                onSelectFiles={handleSelectFiles}
                onAddMore={canPickMoreFiles ? handleAddMore : undefined}
                onDropFiles={handleFilesPicked}
                onChangeType={handleChangeType}
                onRemove={handleRemoveFile}
              />
              {(uploadError || duplicateKindMessage) && (
                <p className="mt-3 w-full text-center text-sm text-red-80">
                  {uploadError ?? duplicateKindMessage}
                </p>
              )}
              {realUploadMode && cleanupBannerVisible && (
                <div className="bg-red-10 mt-3 flex items-center justify-between gap-3 rounded-md border border-red-80 p-3">
                  <p className="text-sm text-red-80">
                    {hasIncompleteUploads
                      ? '완료되지 않은 결과지가 남아 있어요. 정리한 뒤 다시 등록해 주세요.'
                      : '이전 등록 과정의 일부가 남아 있어요. 정리한 뒤 다시 시도해 주세요.'}
                  </p>
                  <button
                    type="button"
                    onClick={() => void handleCleanupDrafts()}
                    disabled={cleaningUp}
                    className={cn(
                      'shrink-0 rounded-md border border-red-80 px-3 py-1.5 text-sm font-medium text-red-80 transition-colors lg:hover:bg-red-20',
                      cleaningUp && 'cursor-not-allowed opacity-50'
                    )}
                  >
                    {cleaningUp ? '정리 중…' : '정리하기'}
                  </button>
                </div>
              )}
            </>
          )}
          {step === 2 && (
            <>
              <Step2VerifyView
                substate={step2Sub}
                verifiedCount={verifiedCount}
                missingCount={missingCount}
                totalCount={totalCount}
                results={verificationResults}
                onDeleteInvalid={
                  realUploadMode
                    ? (assessmentId) => {
                        setReviewItemsSnapshot((prev) =>
                          prev.filter((it) => it.assessmentId !== assessmentId)
                        );
                        deleteMut.mutate(assessmentId);
                      }
                    : undefined
                }
                deletingFileId={
                  deleteMut.isPending ? deleteMut.variables : null
                }
                fillingForm={fillingForm}
              />
              {hasInvalidVerification && step2Sub === 'list' && (
                <p className="mt-3 text-sm text-red-80">
                  등록할 수 없는 결과지가 있어요. 해당 결과지를 삭제한 뒤 다시
                  등록해 주세요.
                </p>
              )}
              {noRealAssessments && (
                <p className="mt-3 text-sm text-grey-70">
                  분석할 결과지가 없어요. 이전 단계에서 결과지를 등록해 주세요.
                </p>
              )}
              {confirmError && (
                <p className="mt-3 text-sm text-red-80">{confirmError}</p>
              )}
            </>
          )}
          {step === 3 && (
            <>
              <Step3CompleteView />
              {startAnalysisError && (
                <p className="mt-3 text-sm text-red-80">{startAnalysisError}</p>
              )}
            </>
          )}
        </div>

        <RegisterModalFooter
          leftButton={footer.leftButton}
          rightButton={footer.rightButton}
        />
      </div>
    </div>
  );
};

import { useEffect, useMemo, useRef, useState } from 'react';

import { cn } from '@/lib/cn';
import { ServerApiError } from '@/shared/api/server/serverClient';
import { useDevice } from '@/shared/hooks/useDevice';

import {
  useAssessmentBatch,
  useConfirmAssessment,
} from '../../hooks/useAssessmentBatch';
import type {
  AssessmentKind,
  AssessmentProgress,
  AssessmentUploadGateway,
  AssessmentUploadInput,
} from '../../upload/assessmentUploadGateway';
import { serverAssessmentUploadAdapter } from '../../upload/serverAssessmentUploadAdapter';

import {
  RegisterModalDebugPanel,
  type FillingFormFilter,
  type Step2DebugMode,
} from './RegisterModalDebugPanel';
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
import type {
  AssessmentTypeId,
  RegisterStep,
  UploadedFile,
  VerificationResult,
} from './types';

interface RegisterAssessmentsModalProps {
  open: boolean;
  onClose: () => void;
  /** 분석 단가 (step 3 CTA 표시용) */
  analyzeCost?: number;
  /** 등록 완료 후 분석 시작 콜백 */
  onAnalyze?: () => void;
  /** 실제 업로드 대상 내담자 ID. 있으면 step1에서 실제 업로드 수행. */
  clientId?: string;
  /** 업로드 gateway (주입). 미지정 시 서버 adapter 사용. 테스트는 mock 주입. */
  uploadGateway?: AssessmentUploadGateway;
}

/** 프론트 검사 종류 id → 도메인 AssessmentKind. 'other'는 업로드 미지원. */
const TYPE_ID_TO_KIND: Record<string, AssessmentKind | undefined> = {
  mmpi: 'mmpi',
  tci: 'tci',
  other: undefined,
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
  mmpi: '다면적 인성 검사',
  tci: '기질 검사',
};

/**
 * 검토 진행률용 건당 단계 가중치(0~1). 건들의 평균 × 100 = 전체 %.
 * 2건 기준: 건당 최대 50% → INITIATED 10 / PENDING 20 / PROCESSING 30 / COMPLETED 50.
 * (배치에 아직 안 나타난 건은 polledItems에 없어 0% 기여 → 첫 폴링 전 0%.)
 */
const STAGE_PROGRESS: Record<AssessmentProgress, number> = {
  initiated: 0.2,
  pending: 0.4,
  processing: 0.6,
  completed: 1,
  failed: 1,
};

/**
 * ocr_score(서버 교집합 결과)의 leaf 카운트. 서버 intersect-ocr-result와 동일 규칙:
 * null leaf = 비워진(불일치/누락) 필드. 0이면 VALID, 1+이면 MISSING_FIELD.
 */
function countTotalLeaves(value: unknown): number {
  if (Array.isArray(value)) {
    return value.reduce<number>((acc, v) => acc + countTotalLeaves(v), 0);
  }
  if (value !== null && typeof value === 'object') {
    return Object.values(value as Record<string, unknown>).reduce<number>(
      (acc, v) => acc + countTotalLeaves(v),
      0,
    );
  }
  return 1;
}

function countNullLeaves(value: unknown): number {
  if (value === null) return 1;
  if (Array.isArray(value)) {
    return value.reduce<number>((acc, v) => acc + countNullLeaves(v), 0);
  }
  if (typeof value === 'object') {
    return Object.values(value as Record<string, unknown>).reduce<number>(
      (acc, v) => acc + countNullLeaves(v),
      0,
    );
  }
  return 0;
}

/** score를 dotted path로 따라가 해당 leaf가 누락(null/부재/하강불가)인지. schema leaf 노출 필터용. */
function isPathMissing(score: unknown, path: string): boolean {
  let cur: unknown = score;
  for (const seg of path.split('.')) {
    if (cur === null || typeof cur !== 'object' || Array.isArray(cur)) {
      return true;
    }
    cur = (cur as Record<string, unknown>)[seg];
  }
  return cur === null || cur === undefined;
}

const NUMERIC_RE = /^-?\d+(\.\d+)?$/;

/** 사용자 입력값(path → 문자열)을 기존 score에 덮어써 확정용 전체 점수 객체를 만든다. */
function applyValues(
  score: Record<string, unknown>,
  values: Record<string, string>,
): Record<string, unknown> {
  const clone = structuredClone(score);
  for (const [path, raw] of Object.entries(values)) {
    const trimmed = raw.trim();
    if (trimmed === '') continue;
    const coerced: unknown = NUMERIC_RE.test(trimmed)
      ? Number(trimmed)
      : trimmed;
    const segs = path.split('.');
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
  return clone;
}

/* -----------------------------------------------------
 * 데모 mock data — 실 데이터 연동 시 props/쿼리로 교체
 * -----------------------------------------------------*/

const MOCK_INITIAL_FILES: UploadedFile[] = [
  {
    id: 'f1',
    fileName: 'MMPI-2_홍길동_결과지.pdf',
    sizeMB: 12.3,
    pageCount: 12,
    assessmentType: 'mmpi',
    status: 'ready',
  },
  {
    id: 'f2',
    fileName: 'TCI_홍길동_결과지.pdf',
    sizeMB: 12.3,
    pageCount: 8,
    assessmentType: 'tci',
    status: 'ready',
  },
];

const MOCK_VERIFICATION_RESULTS_ALL_OK: VerificationResult[] = [
  {
    fileId: 'f1',
    fileName: 'MMPI-2_홍길동_결과지.pdf',
    categoryLabel: '다면적 인성 검사',
    itemsVerified: 167,
    itemsTotal: 167,
    status: 'complete',
  },
  {
    fileId: 'f2',
    fileName: 'TCI_홍길동_결과지.pdf',
    categoryLabel: '기질 검사',
    itemsVerified: 46,
    itemsTotal: 46,
    status: 'complete',
  },
  {
    fileId: 'f4',
    fileName: '내담자_메모.png',
    categoryLabel: '기타 문서',
    itemsVerified: null,
    itemsTotal: null,
    status: 'complete',
  },
];

const MOCK_VERIFICATION_RESULTS_MISSING: VerificationResult[] = [
  {
    fileId: 'f1',
    fileName: 'MMPI-2_홍길동_결과지.pdf',
    categoryLabel: '다면적 인성 검사',
    itemsVerified: 167,
    itemsTotal: 167,
    status: 'complete',
  },
  {
    fileId: 'f2',
    fileName: 'TCI_홍길동_결과지.pdf',
    categoryLabel: '기질 검사',
    itemsVerified: 34,
    itemsTotal: 46,
    status: 'missing',
  },
  {
    fileId: 'f5',
    fileName: '홍길동_상담_메모.png',
    categoryLabel: '기타 문서',
    itemsVerified: null,
    itemsTotal: null,
    status: 'invalid',
    invalidReason: '알 수 없는 검사 종류',
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
  clientId,
  uploadGateway = serverAssessmentUploadAdapter,
}: RegisterAssessmentsModalProps) => {
  const { isMobile, isTablet } = useDevice();
  const isMobileView = isMobile || isTablet;

  const [step, setStep] = useState<RegisterStep>(1);

  /* -------- 실제 업로드 (clientId 있을 때) -------- */
  // 실제 업로드 모드: clientId가 주어지면 mock 대신 서버 업로드를 수행한다.
  const realUploadMode = !!clientId;

  /* -------- step 1 state -------- */
  const [step1Sub, setStep1Sub] = useState<Step1Substate>('empty');
  // 실모드는 빈 목록에서 시작(사용자가 직접 파일 선택). 데모만 mock 프리필.
  const [files, setFiles] = useState<UploadedFile[]>(() =>
    clientId ? [] : MOCK_INITIAL_FILES,
  );
  const [reviewingPercent, setReviewingPercent] = useState(48);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const fileBlobsRef = useRef<Map<string, File>>(new Map());
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  /* -------- reviewing 폴링 (업로드 후 OCR 진행 추적) -------- */
  // reviewing substate에서만 폴링. 업로드한 검사들이 전부 COMPLETED/FAILED되면 Step2로.
  const isReviewing = realUploadMode && open && step1Sub === 'reviewing';
  const { data: polledItems = [] } = useAssessmentBatch(clientId, {
    enabled: isReviewing,
  });
  // 진행률: 건당 단계 가중치(STAGE_PROGRESS)를 평균내 100% 환산. 항목 없으면 0.
  const realReviewingPercent = useMemo(() => {
    if (polledItems.length === 0) return 0;
    const sum = polledItems.reduce(
      (acc, it) => acc + (STAGE_PROGRESS[it.progress] ?? 0),
      0,
    );
    return Math.round((sum / polledItems.length) * 100);
  }, [polledItems]);

  // 전부 종료되면 Step2로 진행
  useEffect(() => {
    if (!isReviewing || polledItems.length === 0) return;
    const allDone = polledItems.every(
      (it) => it.progress === 'completed' || it.progress === 'failed',
    );
    if (allDone) setStep(2);
  }, [isReviewing, polledItems]);

  /* -------- step 2 state (debug-controlled mode 기반) -------- */
  const [step2Mode, setStep2Mode] = useState<Step2DebugMode>('list-missing');
  const step2Sub: Step2Substate = step2Mode === 'filling' ? 'filling' : 'list';

  /* -------- filling 폼에서 실시간 카운트 받아 summary에 반영 -------- */
  const [fillingCounts, setFillingCounts] = useState<{
    filled: number;
    total: number;
  }>({ filled: 0, total: 0 });

  /* -------- 디버그: filling 모드에서 특정 검사만 보기 -------- */
  const [fillingFilter, setFillingFilter] = useState<FillingFormFilter>('all');

  // 실제 OCR 결과 → step2 검증 카드. polledItems(활성 배치)의 validation/score 기반.
  const realVerificationResults: VerificationResult[] = useMemo(
    () =>
      polledItems.map((it) => {
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
                ? 'OCR 처리 실패'
                : '인식할 수 없는 검사지',
          };
        }
        const score = it.score ?? {};
        const total = countTotalLeaves(score);
        const missing = countNullLeaves(score);
        return {
          fileId: it.assessmentId,
          fileName: it.title,
          categoryLabel: KIND_TO_CATEGORY[it.kind],
          itemsVerified: total - missing,
          itemsTotal: total,
          status: missing > 0 ? ('missing' as const) : ('complete' as const),
        };
      }),
    [polledItems],
  );

  // 실제 업로드 모드 + 폴링 데이터 있으면 실데이터, 아니면(데모) mock.
  const verificationResults: VerificationResult[] =
    realUploadMode && polledItems.length > 0
      ? realVerificationResults
      : step2Mode === 'list-complete'
        ? MOCK_VERIFICATION_RESULTS_ALL_OK
        : MOCK_VERIFICATION_RESULTS_MISSING;

  /* -------- 누락 필드 확정 (write) -------- */
  // MISSING_FIELD 검사만 채우기 대상. 사용자가 채운 값을 assessmentId별로 보관.
  const missingItems = useMemo(
    () => polledItems.filter((it) => it.validation === 'missing_field'),
    [polledItems],
  );
  const useRealFilling = realUploadMode && missingItems.length > 0;
  const [fillingValues, setFillingValues] = useState<
    Record<string, Record<string, string>>
  >({});
  const confirmMut = useConfirmAssessment(clientId);
  const [confirming, setConfirming] = useState(false);
  const [confirmError, setConfirmError] = useState<string | null>(null);

  // 실데이터 채우기 폼: 각 MISSING_FIELD 검사의 null leaf만 노출 + 입력값 수집.
  const realFillingForms: FillingFormDescriptor[] = missingItems.map((it) => {
    const score = it.score ?? {};
    return {
      categoryLabel: KIND_TO_CATEGORY[it.kind],
      missingCount: countNullLeaves(score),
      formKey: it.kind,
      visibleLeaf: (path: string) => isPathMissing(score, path),
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
        const merged = applyValues(
          it.score ?? {},
          fillingValues[it.assessmentId] ?? {},
        );
        await confirmMut.mutateAsync({
          assessmentId: it.assessmentId,
          score: merged,
        });
      }
      setStep(3);
    } catch (err) {
      const msg =
        err instanceof ServerApiError
          ? `${err.message} (${err.statusCode})`
          : err instanceof Error
            ? err.message
            : '확정 실패';
      setConfirmError(msg);
    } finally {
      setConfirming(false);
    }
  };

  /* -------- 실모드: 열 때마다 깨끗하게 초기화 -------- */
  // 닫힘→열림 전이에서만 리셋(업로드 진행 중 재실행 방지). 이전 세션의 step3/파일/
  // 입력값/blob이 남지 않도록 step1 empty 상태로 되돌린다.
  const wasOpenRef = useRef(false);
  useEffect(() => {
    if (open && !wasOpenRef.current && realUploadMode) {
      setStep(1);
      setStep1Sub('empty');
      setFiles([]);
      setUploadError(null);
      setConfirmError(null);
      setFillingValues({});
      fileBlobsRef.current.clear();
    }
    wasOpenRef.current = open;
  }, [open, realUploadMode]);

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
      // 실제 모드: OS 파일 선택창 열기
      fileInputRef.current?.click();
      return;
    }
    // 데모: empty → list 로 전환
    setStep1Sub('list');
    setFiles(MOCK_INITIAL_FILES);
  };

  // 실제 파일 선택 → UploadedFile 엔트리 + File 핸들 보관
  const handleFilesPicked = (picked: FileList | null) => {
    if (!picked || picked.length === 0) return;
    setUploadError(null);
    const added: UploadedFile[] = [];
    for (const file of Array.from(picked)) {
      const id = `f-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      fileBlobsRef.current.set(id, file);
      const typeId = inferTypeIdFromName(file.name);
      added.push({
        id,
        fileName: file.name,
        sizeMB: Math.round((file.size / (1024 * 1024)) * 10) / 10,
        pageCount: 0,
        assessmentType: typeId,
        status: typeId ? 'ready' : 'missing-type',
      });
    }
    setFiles((prev) => [...prev, ...added]);
    setStep1Sub('list');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleAddMore = () => {
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
    setFiles((prev) => prev.filter((f) => f.id !== fileId));
  };

  // 실제 업로드 수행: gateway가 presigned 발급 → S3 PUT → complete를 캡슐화.
  const runRealUpload = async (): Promise<boolean> => {
    if (!clientId) return false;
    const inputs: AssessmentUploadInput[] = [];
    for (const f of files) {
      const file = fileBlobsRef.current.get(f.id);
      const kind = f.assessmentType
        ? TYPE_ID_TO_KIND[f.assessmentType]
        : undefined;
      if (!file || !kind) continue; // 'other'/타입 미지정/핸들 없음 제외
      inputs.push({ kind, title: f.fileName, file });
    }
    if (inputs.length === 0) {
      setUploadError('업로드할 결과지(MMPI/TCI)가 없습니다.');
      return false;
    }
    setUploading(true);
    setUploadError(null);
    try {
      const { results } = await uploadGateway.uploadAssessments(
        clientId,
        inputs,
      );
      // eslint-disable-next-line no-console
      console.info('[assessment-upload] 완료:', results);
      return true;
    } catch (err) {
      const msg =
        err instanceof ServerApiError
          ? `${err.message} (${err.statusCode})`
          : err instanceof Error
            ? err.message
            : '업로드 실패';
      setUploadError(msg);
      return false;
    } finally {
      setUploading(false);
    }
  };

  /* -------- step 진행 -------- */
  const canProceedStep1 =
    step1Sub === 'list' &&
    files.length > 0 &&
    files.every((f) => f.status !== 'missing-type');

  const hasMissingVerification = useMemo(
    () => verificationResults.some((r) => r.status !== 'complete'),
    [verificationResults]
  );

  const handleNext = () => {
    if (step === 1) {
      if (realUploadMode) {
        // 업로드 성공 → reviewing 단계로. OCR 진행은 폴링이 추적하고,
        // 전부 COMPLETED되면 useEffect가 Step2로 진행시킨다.
        void runRealUpload().then((ok) => {
          if (ok) setStep1Sub('reviewing');
        });
        return;
      }
      setStep(2);
      return;
    }
    if (step === 2) {
      if (step2Sub === 'list' && hasMissingVerification) {
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

  // filling 모드에서는 폼 카운트로 override — 카드에 값이 채워질 때 summary 실시간 갱신
  const isFilling = step2Sub === 'filling';
  const verifiedCount = isFilling
    ? baseVerifiedCount + fillingCounts.filled
    : baseVerifiedCount;
  const totalCount = isFilling
    ? baseTotalCount + fillingCounts.total
    : baseTotalCount;
  const missingCount = Math.max(0, totalCount - verifiedCount);

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
        hasMissingVerification && !isFilling
          ? '항목 채우기'
          : confirming
            ? '확정 중…'
            : '다음';
      // 실데이터 채우기 중에는 모든 누락 필드를 채워야 확정 가능.
      const fillingIncomplete =
        useRealFilling &&
        isFilling &&
        (fillingCounts.total === 0 || fillingCounts.filled < fillingCounts.total);
      const nextDisabled = confirming || fillingIncomplete;
      return {
        leftButton: {
          label: '이전',
          tone: 'outline' as const,
          onClick: handleBack,
        },
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
        label: '결과지 분석하기',
        tone: 'primary' as const,
        creditCost: analyzeCost,
        onClick: () => {
          onAnalyze?.();
          onClose();
        },
      },
    };
  })();

  if (!open) return null;

  /* -------- 누락 채우기 폼 — 검사별 카드 그룹 -------- */
  // 실데이터(MISSING_FIELD)가 있으면 실폼, 없으면 데모 mock descriptor.
  const allFillingFormDescriptors: FillingFormDescriptor[] = useRealFilling
    ? realFillingForms
    : [
        { categoryLabel: '다면적 인성 검사', missingCount: 12, formKey: 'mmpi' },
        { categoryLabel: '기질 검사', missingCount: 2, formKey: 'tci' },
      ];
  const fillingFormDescriptors =
    fillingFilter === 'all'
      ? allFillingFormDescriptors
      : allFillingFormDescriptors.filter((d) => d.formKey === fillingFilter);

  const fillingForm = (
    <Step2FillingFormGroup
      forms={fillingFormDescriptors}
      onCountsChange={setFillingCounts}
    />
  );

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
        <RegisterModalHeader onClose={onClose} />

        <div
          className={cn(
            isMobileView ? 'px-4 pb-4 pt-2' : 'px-8 pb-6 pt-6'
          )}
        >
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
                  multiple
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
                onAddMore={handleAddMore}
                onChangeType={handleChangeType}
                onRemove={handleRemoveFile}
              />
              {uploadError && (
                <p className="mt-3 text-sm text-red-80">{uploadError}</p>
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
                fillingForm={fillingForm}
              />
              {confirmError && (
                <p className="mt-3 text-sm text-red-80">{confirmError}</p>
              )}
            </>
          )}
          {step === 3 && <Step3CompleteView />}
        </div>

        <RegisterModalFooter
          leftButton={footer.leftButton}
          rightButton={footer.rightButton}
        />
      </div>

      <RegisterModalDebugPanel
        step={step}
        onStepChange={setStep}
        step1Sub={step1Sub}
        onStep1SubChange={setStep1Sub}
        step2Mode={step2Mode}
        onStep2ModeChange={setStep2Mode}
        reviewingPercent={reviewingPercent}
        onReviewingPercentChange={setReviewingPercent}
        fillingFilter={fillingFilter}
        onFillingFilterChange={setFillingFilter}
      />
    </div>
  );
};

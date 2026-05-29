import { useEffect, useMemo, useRef, useState } from 'react';

import { useQueryClient } from '@tanstack/react-query';

import { cn } from '@/lib/cn';
import { ServerApiError } from '@/shared/api/server/serverClient';
import { useDevice } from '@/shared/hooks/useDevice';

import {
  assessmentBatchKeys,
  useAssessmentBatch,
  useConfirmAssessment,
  useDeleteAssessment,
} from '../../hooks/useAssessmentBatch';
import type { JsonSchema } from '../../schemas/jsonSchema.types';
import mmpiSchemaJson from '../../schemas/mmpi.schema.json';
import tciSchemaJson from '../../schemas/tci.schema.json';
import type {
  AssessmentItem,
  AssessmentKind,
  AssessmentUploadGateway,
  AssessmentUploadInput,
} from '../../upload/assessmentUploadGateway';
import { ocrReviewPercent } from '../../upload/ocrProgress';
import { serverAssessmentUploadAdapter } from '../../upload/serverAssessmentUploadAdapter';
import {
  collectLeaves,
  PATH_SEP,
  schemaToFields,
} from '../../utils/schemaToFields';

import {
  RegisterModalQaPanel,
  type FakeAssessmentKind,
  type FakeAssessmentStatus,
} from './RegisterModalQaPanel';
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

const MMPI_SCHEMA = mmpiSchemaJson as JsonSchema;
const TCI_SCHEMA = tciSchemaJson as JsonSchema;

/**
 * schema의 모든 leaf path를 null로 채운 nested score 객체.
 * QA fake MISSING_FIELD가 실제 OCR 정답지처럼 schema 전체 leaf를 노출하기 위해 사용.
 * (isPathMissing이 모든 path에서 true → 기존 filling 폼 visibleLeaf 로직 그대로 전체 노출.)
 */
const buildAllNullScore = (schema: JsonSchema): Record<string, unknown> => {
  const leaves = collectLeaves(schemaToFields(schema));
  const out: Record<string, unknown> = {};
  for (const leaf of leaves) {
    const segs = leaf.path.split(PATH_SEP);
    let cur: Record<string, unknown> = out;
    for (let i = 0; i < segs.length - 1; i++) {
      const key = segs[i];
      const next = cur[key];
      if (next === null || typeof next !== 'object' || Array.isArray(next)) {
        cur[key] = {};
      }
      cur = cur[key] as Record<string, unknown>;
    }
    cur[segs[segs.length - 1]] = null;
  }
  return out;
};

const ALL_NULL_SCORE_BY_KIND: Record<AssessmentKind, Record<string, unknown>> =
  {
    mmpi: buildAllNullScore(MMPI_SCHEMA),
    tci: buildAllNullScore(TCI_SCHEMA),
  };

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

/** score를 path(PATH_SEP 구분)로 따라가 해당 leaf가 누락(null/부재/하강불가)인지. schema leaf 노출 필터용. */
function isPathMissing(score: unknown, path: string): boolean {
  let cur: unknown = score;
  for (const seg of path.split(PATH_SEP)) {
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
    clientId ? [] : MOCK_INITIAL_FILES,
  );
  const reviewingPercent = 48;
  const fileInputRef = useRef<HTMLInputElement>(null);
  const fileBlobsRef = useRef<Map<string, File>>(new Map());
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [cleaningUp, setCleaningUp] = useState(false);

  /* -------- 활성 배치 폴링 (OCR 진행 추적 + step2 검증 데이터) -------- */
  // 실모드로 열려 있는 동안 활성 배치를 구독한다(reviewing 진행 + step2 검증/보완 모두 사용).
  // 폴링은 훅 내부에서 in-flight 있을 때만 돌고, 전부 종료되면 멈춘다.
  const isReviewing = realUploadMode && open && step1Sub === 'reviewing';
  const { data: serverItems = [] } = useAssessmentBatch(clientId, {
    enabled: realUploadMode && open,
  });

  // QA 패널이 주입하는 로컬 가짜 항목. 서버 호출 없이 step2 list/filling/invalid 분기
  // + cleanup/confirm 플로우를 한 화면에서 시연할 수 있게 polledItems에 합쳐 노출한다.
  // (모달이 닫혔다가 다시 열려도 wasOpenRef 초기화로 사라지지 않음 — 명시 clear 필요.)
  const [fakeItems, setFakeItems] = useState<AssessmentItem[]>([]);
  const polledItems = useMemo(
    () => [...serverItems, ...fakeItems],
    [serverItems, fakeItems],
  );
  const isFakeAssessmentId = (id: string) => id.startsWith('fake-');

  const realReviewingPercent = useMemo(
    () => ocrReviewPercent(polledItems),
    [polledItems],
  );

  // 전부 종료되면 Step2로 진행
  useEffect(() => {
    if (!isReviewing || polledItems.length === 0) return;
    const allDone = polledItems.every(
      (it) => it.progress === 'completed' || it.progress === 'failed',
    );
    if (allDone) setStep(2);
  }, [isReviewing, polledItems]);

  /* -------- step 2 state -------- */
  const [step2Mode, setStep2Mode] = useState<Step2Mode>('list-missing');
  const step2Sub: Step2Substate = step2Mode === 'filling' ? 'filling' : 'list';

  /* -------- filling 폼에서 실시간 카운트 받아 summary에 반영 -------- */
  const [fillingCounts, setFillingCounts] = useState<{
    filled: number;
    total: number;
  }>({ filled: 0, total: 0 });

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
        // MISSING_FIELD는 서버가 ocr_score를 null로 두고 교집합(누락=null)을 temp_ocr_score에
        // 보관한다. 따라서 검증/보완은 score(=null) 대신 tempScore를 기준으로 계산한다.
        const score = it.score ?? it.tempScore ?? {};
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

  // 실모드는 항상 서버 polledItems만 사용한다. 폴링 데이터가 비면 결과도 빈 배열 —
  // 가짜 mock을 보여주고 Step3까지 진행시켜 서버 409를 맞는 사고를 막는다.
  // (데모 모드는 폴링 자체가 없으므로 mock 분기 유지.)
  const verificationResults: VerificationResult[] = realUploadMode
    ? realVerificationResults
    : step2Mode === 'list-complete'
      ? MOCK_VERIFICATION_RESULTS_ALL_OK
      : MOCK_VERIFICATION_RESULTS_MISSING;

  // 실모드 + 폴링 결과 없음 = 분석 가능한 검사가 없는 상태. step2/step3 진행 차단.
  const noRealAssessments = realUploadMode && polledItems.length === 0;

  // INITIATED는 presigned 발급 후 S3 PUT/complete가 실패해 남은 드래프트.
  // OCR이 자연 진행되지 않으므로 cleanup이 유일한 정리 경로다. 새로고침/모달 재오픈
  // 시에도 보이도록 step1 sub-state 전반에서 배너를 노출한다.
  const hasIncompleteUploads =
    realUploadMode && polledItems.some((it) => it.progress === 'initiated');
  const cleanupBannerVisible =
    hasIncompleteUploads ||
    (uploadError !== null && polledItems.length > 0 && step1Sub !== 'reviewing');

  /* -------- 누락 필드 확정 (write) -------- */
  // MISSING_FIELD 검사만 채우기 대상. 사용자가 채운 값을 assessmentId별로 보관.
  const missingItems = useMemo(
    () => polledItems.filter((it) => it.validation === 'missing_field'),
    [polledItems],
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
  // QA fake도 schema 기반 all-null tempScore라 isPathMissing 분기가 자연스럽게 전체 노출.
  const realFillingForms: FillingFormDescriptor[] = missingItems.map((it) => {
    // MISSING_FIELD는 ocr_score가 null이고 누락(null) 포함 교집합이 temp_ocr_score에 있다.
    const score = it.tempScore ?? it.score ?? {};
    return {
      categoryLabel: KIND_TO_CATEGORY[it.kind],
      missingCount: countNullLeaves(score),
      formKey: it.kind,
      visibleLeaf: (path: string) => isPathMissing(score, path),
      onValuesChange: (values: Record<string, string>) =>
        setFillingValues((prev) => ({ ...prev, [it.assessmentId]: values })),
    };
  });

  // QA용 가짜 항목 추가 — 각 status에 맞춰 score/tempScore/validation/progress만 다르게.
  const addFakeAssessment = (
    kind: FakeAssessmentKind,
    status: FakeAssessmentStatus,
  ) => {
    const id = `fake-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`;
    const base: AssessmentItem = {
      assessmentId: id,
      kind,
      title: `[FAKE ${kind.toUpperCase()}] ${status}`,
      assessmentVersion: 0,
      progress: 'completed',
      validation: 'valid',
      score: null,
      tempScore: null,
    };
    let item: AssessmentItem;
    if (status === 'valid') {
      item = { ...base, validation: 'valid', score: { __qa_filled: 1 } };
    } else if (status === 'missing_field') {
      // 실제 OCR 정답지 schema의 모든 leaf를 null로 둔 tempScore.
      // → 카드 "0/N 항목 확인됨" + filling 폼에 schema 전체 leaf 노출(isPathMissing이 전부 true).
      item = {
        ...base,
        validation: 'missing_field',
        tempScore: ALL_NULL_SCORE_BY_KIND[kind],
      };
    } else if (status === 'invalid') {
      item = { ...base, validation: 'invalid' };
    } else {
      item = { ...base, progress: 'failed', validation: null };
    }
    setFakeItems((prev) => [...prev, item]);
  };

  const clearFakeAssessments = () => {
    setFakeItems([]);
    setFillingValues((prev) => {
      const next: typeof prev = {};
      for (const [k, v] of Object.entries(prev)) {
        if (!isFakeAssessmentId(k)) next[k] = v;
      }
      return next;
    });
  };

  // 채운 값을 기존 score에 덮어써 검사별로 confirm 호출. 전부 성공하면 step3.
  const submitConfirms = async (): Promise<void> => {
    setConfirming(true);
    setConfirmError(null);
    try {
      for (const it of missingItems) {
        if (isFakeAssessmentId(it.assessmentId)) {
          // QA 가짜는 서버 confirm 호출 없이 로컬에서 VALID로 토글.
          setFakeItems((prev) =>
            prev.map((f) =>
              f.assessmentId === it.assessmentId
                ? {
                    ...f,
                    validation: 'valid',
                    score: { __qa_filled: 1 },
                    tempScore: null,
                  }
                : f,
            ),
          );
          continue;
        }
        // MISSING_FIELD 기반은 temp_ocr_score(교집합). 채운 값을 덮어 full score로 confirm.
        const merged = applyValues(
          it.tempScore ?? it.score ?? {},
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

  /* -------- 실모드: 열 때 상태 초기화 / 이어보기 복원 -------- */
  // 닫힘→열림 전이에서만 실행(진행 중 재실행 방지).
  // - resume 'verify'   : 검증/보완 화면(step2)로 바로 진입.
  // - resume 'reviewing': OCR 진행 표시(step1 reviewing). 폴링이 돌며 전부 종료되면
  //   아래 effect가 step2로 올린다.
  // - 일반: 이전 세션의 step3/파일/입력값/blob을 비우고 step1 empty에서 시작.
  const wasOpenRef = useRef(false);
  useEffect(() => {
    if (open && !wasOpenRef.current && realUploadMode) {
      setUploadError(null);
      setConfirmError(null);
      if (resume === 'verify') {
        setStep(2);
        setStep2Mode('list-missing');
      } else if (resume === 'reviewing') {
        setStep(1);
        setStep1Sub('reviewing');
      } else {
        setStep(1);
        setStep1Sub('empty');
        setFiles([]);
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

    // 1) 파일 타입: PDF만 허용. accept 속성도 PDF지만 드래그/일부 OS는 우회 가능.
    const pdfOnly = incoming.filter((f) => {
      const isPdf =
        f.type === 'application/pdf' || /\.pdf$/i.test(f.name);
      if (!isPdf) rejected.push(`${f.name} (PDF 아님)`);
      return isPdf;
    });

    // 2) 파일 크기 상한 (개별).
    const sizeOk = pdfOnly.filter((f) => {
      const sizeMB = f.size / (1024 * 1024);
      if (sizeMB > MAX_FILE_SIZE_MB) {
        rejected.push(`${f.name} (${MAX_FILE_SIZE_MB} MB 초과)`);
        return false;
      }
      return true;
    });

    // 3) 총 개수 상한. 기존 + 추가가 MAX_FILES 초과면 초과분 잘라낸다.
    const remaining = Math.max(0, MAX_FILES - files.length);
    const accepted = sizeOk.slice(0, remaining);
    if (sizeOk.length > remaining) {
      rejected.push(
        `${sizeOk.length - remaining}개 파일 (최대 ${MAX_FILES}개)`
      );
    }

    if (rejected.length > 0) {
      setUploadError(`선택 거절: ${rejected.join(', ')}`);
    }

    if (accepted.length === 0) {
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    const added: UploadedFile[] = accepted.map((file) => {
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
      console.info('[assessment-upload] 완료:', results);
      // 업로드 직후 활성 배치를 무효화 → reviewing 폴링이 stale 캐시 대신
      // 갓 만들어진 PENDING 검사를 즉시 받아 OCR 진행을 추적한다.
      await qc.invalidateQueries({
        queryKey: assessmentBatchKeys.batch(clientId),
      });
      return true;
    } catch (err) {
      const msg =
        err instanceof ServerApiError
          ? `${err.message} (${err.statusCode})`
          : err instanceof Error
            ? err.message
            : '업로드 실패';
      setUploadError(msg);
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
  // QA 가짜 항목은 서버에 없으므로 로컬 fakeItems에서만 제거.
  const handleCleanupDrafts = async (): Promise<void> => {
    if (!clientId || polledItems.length === 0) return;
    setCleaningUp(true);
    setUploadError(null);
    try {
      for (const it of polledItems) {
        if (isFakeAssessmentId(it.assessmentId)) continue;
        await deleteMut.mutateAsync(it.assessmentId);
      }
      setFakeItems([]);
      await qc.invalidateQueries({
        queryKey: assessmentBatchKeys.batch(clientId),
      });
      // 정리 후엔 빈 업로드 화면으로 돌아간다 — reviewing UI가 0%로 멈춰있는 잔상 방지.
      setStep1Sub('empty');
      setFiles([]);
      fileBlobsRef.current.clear();
    } catch (err) {
      const msg =
        err instanceof ServerApiError
          ? `${err.message} (${err.statusCode})`
          : err instanceof Error
            ? err.message
            : '드래프트 삭제 실패';
      setUploadError(msg);
    } finally {
      setCleaningUp(false);
    }
  };

  /* -------- 검사 종류 가드 (MMPI/TCI 각 1개) -------- */
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
      (k) => counts[k] > 1,
    );
    return dup ?? null;
  }, [realUploadMode, step1Sub, existingKinds, files]);

  const duplicateKindMessage = duplicateKind
    ? `${KIND_TO_CATEGORY[duplicateKind]}는 하나만 등록할 수 있어요. (MMPI·TCI 각 1개)`
    : null;

  /* -------- step 진행 -------- */
  const canProceedStep1 =
    step1Sub === 'list' &&
    files.length > 0 &&
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
      // 실모드에 검사가 하나도 없으면 분석 시작 불가.
      if (noRealAssessments) return;
      // invalid 있으면 step3 진행 불가. 사용자가 삭제 후 step1로 돌아가야 함.
      if (step2Sub === 'list' && hasInvalidVerification) return;
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

  // 전체 항목 수(total)는 검증 결과 기준으로 고정. 누락 필드는 이미 total에 포함돼 있으므로
  // filling 카운트를 total에 더하면 이중 집계된다(누락이 늘어나는 버그). filling 중에는
  // 채운 개수(filled)만 verified에 더해 누락이 줄어들게 한다.
  const isFilling = step2Sub === 'filling';
  const totalCount = baseTotalCount;
  const verifiedCount = isFilling
    ? Math.min(totalCount, baseVerifiedCount + fillingCounts.filled)
    : baseVerifiedCount;
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
        hasInvalidVerification && !isFilling
          ? '등록 불가 검사 삭제 필요'
          : hasMissingVerification && !isFilling
            ? '항목 채우기'
            : confirming
              ? '확정 중…'
              : '다음';
      // 실데이터 채우기 중에는 모든 누락 필드를 채워야 확정 가능.
      // QA 가짜만 있는 경우는 schema 전체를 채우게 강요하지 않고 confirm 통과 허용.
      const onlyFakesMissing =
        missingItems.length > 0 &&
        missingItems.every((it) => isFakeAssessmentId(it.assessmentId));
      const fillingIncomplete =
        useRealFilling &&
        isFilling &&
        !onlyFakesMissing &&
        (fillingCounts.total === 0 || fillingCounts.filled < fillingCounts.total);
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

  if (!open) return null;

  /* -------- 누락 채우기 폼 — 검사별 카드 그룹 -------- */
  // 실모드는 항상 실폼만 사용(없으면 빈 배열). 데모만 mock descriptor.
  const fillingFormDescriptors: FillingFormDescriptor[] = useRealFilling
    ? realFillingForms
    : [
        { categoryLabel: '다면적 인성 검사', missingCount: 12, formKey: 'mmpi' },
        { categoryLabel: '기질 검사', missingCount: 2, formKey: 'tci' },
      ];

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
              {(uploadError || duplicateKindMessage) && (
                <p className="mt-3 text-sm text-red-80">
                  {uploadError ?? duplicateKindMessage}
                </p>
              )}
              {realUploadMode && cleanupBannerVisible && (
                <div className="mt-3 flex items-center justify-between gap-3 rounded-md border border-red-80 bg-red-10 p-3">
                  <p className="text-sm text-red-80">
                    {hasIncompleteUploads
                      ? '업로드가 완료되지 않은 검사가 있어요. 정리한 뒤 다시 업로드해 주세요.'
                      : '이전 업로드 일부가 남아있어요. 정리한 뒤 다시 시도해 주세요.'}
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
                        if (isFakeAssessmentId(assessmentId)) {
                          // QA 가짜 invalid는 서버 호출 없이 로컬에서 제거.
                          setFakeItems((prev) =>
                            prev.filter((f) => f.assessmentId !== assessmentId),
                          );
                          return;
                        }
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
                  등록 불가 검사가 있어요. 해당 검사를 삭제한 뒤 재업로드해 주세요.
                </p>
              )}
              {noRealAssessments && (
                <p className="mt-3 text-sm text-grey-70">
                  분석할 검사가 없어요. 이전 단계에서 결과지를 업로드해 주세요.
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

      <RegisterModalQaPanel
        snapshot={{
          step,
          step1Sub,
          step2Sub,
          step2Mode,
          resume,
          realUploadMode,
          polledItems: polledItems.map((it) => ({
            kind: it.kind,
            progress: it.progress,
            validation: it.validation,
          })),
          hasIncompleteUploads,
          hasInvalidVerification,
          hasMissingVerification,
          noRealAssessments,
          duplicateKind,
          uploading,
          cleaningUp,
          confirming,
          isStartingAnalysis,
          uploadError,
          confirmError,
          startAnalysisError,
          fillingCounts,
        }}
        actions={{
          onSetStep: setStep,
          onSetStep1Sub: setStep1Sub,
          onInvalidateBatch: () => {
            if (clientId) {
              void qc.invalidateQueries({
                queryKey: assessmentBatchKeys.batch(clientId),
              });
            }
          },
          onAddFakeAssessment: addFakeAssessment,
          onClearFakeAssessments: clearFakeAssessments,
          fakeCount: fakeItems.length,
        }}
      />
    </div>
  );
};

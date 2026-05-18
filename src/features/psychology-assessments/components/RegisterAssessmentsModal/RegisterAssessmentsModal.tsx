import { useEffect, useMemo, useState } from 'react';

import { cn } from '@/lib/cn';

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
}: RegisterAssessmentsModalProps) => {
  const [step, setStep] = useState<RegisterStep>(1);

  /* -------- step 1 state -------- */
  const [step1Sub, setStep1Sub] = useState<Step1Substate>('empty');
  const [files, setFiles] = useState<UploadedFile[]>(MOCK_INITIAL_FILES);
  const [reviewingPercent, setReviewingPercent] = useState(48);

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
  const verificationResults: VerificationResult[] =
    step2Mode === 'list-complete'
      ? MOCK_VERIFICATION_RESULTS_ALL_OK
      : MOCK_VERIFICATION_RESULTS_MISSING;

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
    // 데모: empty → list 로 전환
    setStep1Sub('list');
    setFiles(MOCK_INITIAL_FILES);
  };

  const handleAddMore = () => {
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
    setFiles((prev) => prev.filter((f) => f.id !== fileId));
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
      setStep(2);
      return;
    }
    if (step === 2) {
      if (step2Sub === 'list' && hasMissingVerification) {
        setStep2Mode('filling');
        return;
      }
      if (step2Sub === 'filling') {
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
          label: '다음',
          tone: canProceedStep1 ? ('primary' as const) : ('disabled' as const),
          onClick: handleNext,
        },
      };
    }
    if (step === 2) {
      const nextLabel =
        hasMissingVerification && !isFilling ? '항목 채우기' : '다음';
      return {
        leftButton: {
          label: '이전',
          tone: 'outline' as const,
          onClick: handleBack,
        },
        rightButton: {
          label: nextLabel,
          tone: 'primary' as const,
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

  /* -------- 누락 채우기 폼 — 검사별 카드 그룹 (mock descriptor) -------- */
  const allFillingFormDescriptors: FillingFormDescriptor[] = [
    {
      categoryLabel: '다면적 인성 검사',
      missingCount: 12,
      formKey: 'mmpi',
    },
    {
      categoryLabel: '기질 검사',
      missingCount: 2,
      formKey: 'tci',
    },
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
      className="fixed inset-0 z-modal flex items-center justify-center bg-black/40 p-4"
      role="dialog"
      aria-modal="true"
    >
      <div
        className={cn(
          'flex flex-col overflow-hidden rounded-2xl bg-surface shadow-prominent',
          'h-[min(820px,92vh)] w-[min(560px,92vw)]'
        )}
      >
        <RegisterModalHeader onClose={onClose} />

        <div className="px-8 pb-6 pt-6">
          <RegisterStepper current={step} />
        </div>

        <div className="flex min-h-0 flex-1 flex-col overflow-y-auto px-[52px] pb-2">
          {step === 1 && (
            <Step1UploadView
              substate={step1Sub}
              files={formatBy(step1Sub, files)}
              reviewingPercent={reviewingPercent}
              onSelectFiles={handleSelectFiles}
              onAddMore={handleAddMore}
              onChangeType={handleChangeType}
              onRemove={handleRemoveFile}
            />
          )}
          {step === 2 && (
            <Step2VerifyView
              substate={step2Sub}
              verifiedCount={verifiedCount}
              missingCount={missingCount}
              totalCount={totalCount}
              results={verificationResults}
              fillingForm={fillingForm}
            />
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

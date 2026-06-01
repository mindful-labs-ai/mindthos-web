import { useState } from 'react';

import { cn } from '@/lib/cn';

import type { Step1Substate } from './step1/Step1UploadView';
import type { Step2Substate } from './step2/Step2VerifyView';
import type { RegisterStep } from './types';

/**
 * 결과지 등록 모달 QA 패널 — 모달 우상단에 고정 표시되는 read-only 상태 스냅샷 +
 * 강제 step 이동/배치 invalidate 같은 최소 액션. 빌드 환경과 무관하게 노출된다.
 *
 * 디자인 의도:
 * - 모달 흐름이 step1 → reviewing → step2(list/filling) → step3로 분기되고,
 *   여기에 cleanup/invalid/error 플래그가 얽혀 있어 단순 화면만으로 어느 분기인지
 *   재현하기 어렵다. 패널이 한 화면에 모든 상태를 펼쳐서 QA를 돕는다.
 * - 모달이 닫히면 패널도 같이 사라진다(모달 안에서 렌더).
 */

interface PolledItemSnapshot {
  kind: string;
  progress: string;
  validation: string | null;
}

export interface RegisterModalQaSnapshot {
  step: RegisterStep;
  step1Sub: Step1Substate;
  step2Sub: Step2Substate;
  step2Mode: string;
  resume: 'reviewing' | 'verify' | false;
  realUploadMode: boolean;

  polledItems: PolledItemSnapshot[];

  hasIncompleteUploads: boolean;
  hasInvalidVerification: boolean;
  hasMissingVerification: boolean;
  noRealAssessments: boolean;
  duplicateKind: string | null;

  uploading: boolean;
  cleaningUp: boolean;
  confirming: boolean;
  isStartingAnalysis: boolean;

  uploadError: string | null;
  confirmError: string | null;
  startAnalysisError: string | null;

  fillingCounts: { filled: number; total: number };
}

export type FakeAssessmentKind = 'mmpi' | 'tci';
export type FakeAssessmentStatus =
  | 'valid'
  | 'missing_field'
  | 'invalid'
  | 'failed';

export interface RegisterModalQaActions {
  onSetStep: (step: RegisterStep) => void;
  onSetStep1Sub: (sub: Step1Substate) => void;
  onInvalidateBatch: () => void;
  onAddFakeAssessment: (
    kind: FakeAssessmentKind,
    status: FakeAssessmentStatus
  ) => void;
  onClearFakeAssessments: () => void;
  fakeCount: number;
}

interface RegisterModalQaPanelProps {
  snapshot: RegisterModalQaSnapshot;
  actions: RegisterModalQaActions;
}

export const RegisterModalQaPanel = ({
  snapshot,
  actions,
}: RegisterModalQaPanelProps) => {
  const [collapsed, setCollapsed] = useState(false);

  // TODO(PROD-BLOCKER): 이 QA 패널은 staging 검증 편의를 위해 빌드 환경과 무관하게
  // 강제로 노출한다. 운영 배포 전에는 이 컴포넌트 렌더링과 관련 fake action 전체를 반드시
  // 제거해야 한다. 제거하지 않으면 사용자가 step 강제 이동/가짜 검사 주입 디버그 도구를 볼 수 있다.

  const {
    step,
    step1Sub,
    step2Sub,
    step2Mode,
    resume,
    realUploadMode,
    polledItems,
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
  } = snapshot;

  return (
    <div
      className={cn(
        'fixed right-3 top-3 z-tooltip flex flex-col gap-2 rounded-lg border border-border bg-surface p-3 text-[11px] text-grey-100 shadow-elevated',
        collapsed ? 'w-[120px]' : 'w-[260px]'
      )}
    >
      <button
        type="button"
        onClick={() => setCollapsed((prev) => !prev)}
        className="flex items-center justify-between text-left font-emphasize"
      >
        <span>🧪 MODAL QA</span>
        <span className="text-grey-60">{collapsed ? '▼' : '▲'}</span>
      </button>

      {!collapsed && (
        <div className="flex max-h-[80vh] flex-col gap-3 overflow-y-auto">
          <Section title="State">
            <Row k="step" v={String(step)} />
            <Row k="step1Sub" v={step1Sub} />
            <Row k="step2Sub" v={step2Sub} />
            <Row k="step2Mode" v={step2Mode} />
            <Row k="resume" v={resume === false ? '—' : resume} />
            <Row k="realUploadMode" v={String(realUploadMode)} />
          </Section>

          <Section title={`polledItems (${polledItems.length})`}>
            {polledItems.length === 0 ? (
              <p className="text-grey-60">(empty)</p>
            ) : (
              polledItems.map((it, i) => (
                <p key={i} className="font-mono text-[10px]">
                  {it.kind} · {it.progress} · {it.validation ?? '—'}
                </p>
              ))
            )}
          </Section>

          <Section title="Flags">
            <Row k="hasIncompleteUploads" v={String(hasIncompleteUploads)} />
            <Row
              k="hasInvalidVerification"
              v={String(hasInvalidVerification)}
            />
            <Row
              k="hasMissingVerification"
              v={String(hasMissingVerification)}
            />
            <Row k="noRealAssessments" v={String(noRealAssessments)} />
            <Row k="duplicateKind" v={duplicateKind ?? '—'} />
          </Section>

          <Section title="Pending">
            <Row k="uploading" v={String(uploading)} />
            <Row k="cleaningUp" v={String(cleaningUp)} />
            <Row k="confirming" v={String(confirming)} />
            <Row k="isStartingAnalysis" v={String(isStartingAnalysis)} />
          </Section>

          <Section title="Filling">
            <Row
              k="counts"
              v={`${fillingCounts.filled}/${fillingCounts.total}`}
            />
          </Section>

          {(uploadError || confirmError || startAnalysisError) && (
            <Section title="Errors">
              {uploadError && (
                <p className="text-red-80">upload: {uploadError}</p>
              )}
              {confirmError && (
                <p className="text-red-80">confirm: {confirmError}</p>
              )}
              {startAnalysisError && (
                <p className="text-red-80">analysis: {startAnalysisError}</p>
              )}
            </Section>
          )}

          <Section title="Actions">
            <div className="flex flex-wrap gap-1">
              {([1, 2, 3] as const).map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => actions.onSetStep(s)}
                  className={cn(
                    'rounded border px-2 py-1 text-[10px]',
                    step === s
                      ? 'border-primary bg-primary text-white'
                      : 'border-grey-30 lg:hover:bg-grey-10'
                  )}
                >
                  step {s}
                </button>
              ))}
            </div>
            <div className="flex flex-wrap gap-1">
              {(['empty', 'list', 'reviewing'] as const).map((sub) => (
                <button
                  key={sub}
                  type="button"
                  onClick={() => actions.onSetStep1Sub(sub)}
                  className={cn(
                    'rounded border px-2 py-1 text-[10px]',
                    step1Sub === sub
                      ? 'border-primary bg-primary text-white'
                      : 'border-grey-30 lg:hover:bg-grey-10'
                  )}
                >
                  {sub}
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={actions.onInvalidateBatch}
              className="rounded border border-grey-30 px-2 py-1 text-[10px] lg:hover:bg-grey-10"
            >
              ↻ invalidate batch
            </button>
          </Section>

          <Section title={`Fake assessments (${actions.fakeCount})`}>
            {/* 서버 호출 없이 polledItems에 합쳐지는 로컬 가짜 항목.
                step2 list/filling/invalid 분기 + cleanup/confirm 플로우를 한 화면에서 시연. */}
            {(['mmpi', 'tci'] as const).map((kind) => (
              <div key={kind} className="flex flex-col gap-1">
                <p className="text-[10px] text-grey-60">{kind.toUpperCase()}</p>
                <div className="flex flex-wrap gap-1">
                  {(
                    [
                      ['valid', 'VALID'],
                      ['missing_field', 'MISSING'],
                      ['invalid', 'INVALID'],
                      ['failed', 'FAILED'],
                    ] as const
                  ).map(([s, label]) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => actions.onAddFakeAssessment(kind, s)}
                      className="rounded border border-grey-30 px-1.5 py-0.5 text-[10px] lg:hover:bg-grey-10"
                    >
                      + {label}
                    </button>
                  ))}
                </div>
              </div>
            ))}
            <button
              type="button"
              onClick={actions.onClearFakeAssessments}
              disabled={actions.fakeCount === 0}
              className={cn(
                'rounded border px-2 py-1 text-[10px]',
                actions.fakeCount === 0
                  ? 'cursor-not-allowed border-grey-30 text-grey-60'
                  : 'lg:hover:bg-red-10 border-red-80 text-red-80'
              )}
            >
              clear fakes
            </button>
          </Section>
        </div>
      )}
    </div>
  );
};

const Section = ({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) => (
  <div className="flex flex-col gap-1">
    <p className="font-emphasize text-grey-60">{title}</p>
    <div className="flex flex-col gap-0.5">{children}</div>
  </div>
);

const Row = ({ k, v }: { k: string; v: string }) => (
  <p className="flex justify-between gap-2 font-mono text-[10px]">
    <span className="text-grey-60">{k}</span>
    <span className="truncate text-grey-100">{v}</span>
  </p>
);

import { useState } from 'react';

import { cn } from '@/lib/cn';

import type {
  AssessmentsMode,
  PsychologyDebugScenario,
  RegisterModalDebugPreset,
} from './debugTypes';

interface ScenarioOption {
  value: PsychologyDebugScenario;
  label: string;
  helper: string;
}

const SCENARIO_OPTIONS: ScenarioOption[] = [
  {
    value: 'server',
    label: '서버 상태',
    helper: '실제 API 응답으로 화면을 봅니다.',
  },
  {
    value: 'no_client',
    label: '내담자 미선택',
    helper: '내담자를 아직 선택하지 않은 상태입니다.',
  },
  {
    value: 'initial_loading',
    label: '초기 로딩',
    helper: '상태 조회 전 스피너 화면입니다.',
  },
  {
    value: 'empty',
    label: '결과지 없음',
    helper: '등록 전 빈 상태입니다.',
  },
  {
    value: 'registered_ready',
    label: '분석 가능',
    helper: '결과지 등록 후 분석 CTA 상태입니다.',
  },
  {
    value: 'registered_reviewing',
    label: '결과지 확인 중',
    helper: '결과지 인식/검토 진행 상태입니다.',
  },
  {
    value: 'registered_needs_review',
    label: '확인 필요',
    helper: '빈 항목 보완이 필요한 상태입니다.',
  },
  {
    value: 'analysis_error',
    label: '분석 시작 실패',
    helper: '크레딧 부족 등 CTA 실패 문구를 확인합니다.',
  },
  {
    value: 'analyzing',
    label: '분석 중',
    helper: '보고서 생성 진행률 화면입니다.',
  },
  {
    value: 'analyzed_empty',
    label: '채팅 시작',
    helper: '분석 완료 후 첫 질문 전 상태입니다.',
  },
  {
    value: 'chat_sending',
    label: '답변 중',
    helper: '사용자 질문 후 답변 생성 중 상태입니다.',
  },
  {
    value: 'analyzed_chat',
    label: '채팅 답변 있음',
    helper: '완료된 대화가 있는 상태입니다.',
  },
  {
    value: 'chat_failed',
    label: '채팅 실패',
    helper: '재시도 버튼과 실패 문구를 확인합니다.',
  },
  {
    value: 'chat_retrying',
    label: '재시도 중',
    helper: '실패 답변을 다시 생성하는 상태입니다.',
  },
];

const UPLOAD_PRESETS: {
  value: RegisterModalDebugPreset;
  label: string;
}[] = [
  { value: 'upload_empty', label: '빈 업로드' },
  { value: 'upload_files_ready', label: '파일 선택됨' },
  { value: 'upload_missing_type', label: '검사 종류 미선택' },
  { value: 'upload_duplicate_kind', label: '중복 결과지' },
  { value: 'uploading', label: '업로드 중' },
  { value: 'upload_failed', label: '업로드 실패' },
  { value: 'cleanup_needed', label: '이전 업로드 정리' },
];

const REVIEW_PRESETS: {
  value: RegisterModalDebugPreset;
  label: string;
}[] = [
  { value: 'reviewing', label: '결과지 확인 중' },
  { value: 'verify_complete', label: '모든 항목 확인' },
  { value: 'verify_missing', label: '빈 항목 있음' },
  { value: 'verify_filling', label: '빈 항목 입력' },
  { value: 'verify_confirm_error', label: '저장 실패' },
  { value: 'verify_invalid', label: '등록할 수 없음' },
  { value: 'verify_failed', label: '읽기 실패' },
  { value: 'complete', label: '등록 완료' },
  { value: 'complete_analysis_error', label: '완료+분석 에러' },
];

interface PsychologyAssessmentsDebugDockProps {
  scenario: PsychologyDebugScenario;
  mode: AssessmentsMode | 'no_client';
  clientName: string | null;
  fileCount: number;
  turnCount: number;
  ocrStageLabel: string;
  modalOpen: boolean;
  popoverOpen: boolean;
  resetOpen: boolean;
  startAnalysisError: string | null;
  modalPreset: RegisterModalDebugPreset | null;
  onScenarioChange: (scenario: PsychologyDebugScenario) => void;
  onOpenModalPreset: (preset: RegisterModalDebugPreset) => void;
  onOpenUploadModal: () => void;
  onOpenReviewModal: () => void;
  onOpenVerifyModal: () => void;
  onTogglePopover: () => void;
  onOpenReset: () => void;
  onSeedChatSuccess: () => void;
  onSeedChatFailure: () => void;
  onClearChat: () => void;
}

export const PsychologyAssessmentsDebugDock = ({
  scenario,
  mode,
  clientName,
  fileCount,
  turnCount,
  ocrStageLabel,
  modalOpen,
  popoverOpen,
  resetOpen,
  startAnalysisError,
  modalPreset,
  onScenarioChange,
  onOpenModalPreset,
  onOpenUploadModal,
  onOpenReviewModal,
  onOpenVerifyModal,
  onTogglePopover,
  onOpenReset,
  onSeedChatSuccess,
  onSeedChatFailure,
  onClearChat,
}: PsychologyAssessmentsDebugDockProps) => {
  const [open, setOpen] = useState(false);

  // TODO(PROD-BLOCKER): 이 dock은 localhost/staging에서 심리검사 해석 화면을 서버 없이
  // 검증하기 위한 강제 QA 도구다. 운영 배포 전에는 이 컴포넌트와 호출부, localStorage 키,
  // mock scenario 전체를 반드시 제거해야 한다. 제거하지 않으면 사용자가 화면 상태를 임의로
  // 바꾸는 디버깅 도구를 볼 수 있다.

  const activeOption = SCENARIO_OPTIONS.find((item) => item.value === scenario);

  return (
    <div className="fixed bottom-0 right-4 z-tooltip flex max-w-[calc(100vw-32px)] flex-col items-end text-xs text-grey-100">
      {open && (
        <div className="mb-2 flex max-h-[72vh] w-[360px] max-w-full flex-col gap-3 overflow-y-auto rounded-t-xl border border-grey-40 bg-surface p-3 shadow-prominent">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-emphasize">심리검사 QA 상태 도구</p>
              <p className="mt-1 text-[11px] text-grey-60">
                {activeOption?.helper ?? '상태를 선택해 주세요.'}
              </p>
            </div>
            <span
              className={cn(
                'shrink-0 rounded-md px-2 py-1 text-[11px] font-medium',
                scenario === 'server'
                  ? 'bg-grey-20 text-grey-70'
                  : 'bg-green-20 text-green-80'
              )}
            >
              {scenario === 'server' ? 'SERVER' : 'LOCAL'}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-1.5">
            {SCENARIO_OPTIONS.map((item) => (
              <button
                key={item.value}
                type="button"
                onClick={() => onScenarioChange(item.value)}
                className={cn(
                  'rounded-md border px-2 py-1.5 text-left text-[11px] transition-colors',
                  scenario === item.value
                    ? 'border-green-80 bg-green-20 text-green-80'
                    : 'border-grey-30 text-grey-80 lg:hover:bg-grey-10'
                )}
              >
                {item.label}
              </button>
            ))}
          </div>

          <Section title="현재 스냅샷">
            <Row k="client" v={clientName ?? '선택 없음'} />
            <Row k="mode" v={mode} />
            <Row k="ocrStage" v={ocrStageLabel} />
            <Row k="files" v={String(fileCount)} />
            <Row k="turns" v={String(turnCount)} />
            <Row k="modal" v={modalOpen ? 'open' : 'closed'} />
            <Row k="popover" v={popoverOpen ? 'open' : 'closed'} />
            <Row k="reset" v={resetOpen ? 'open' : 'closed'} />
            <Row k="modalPreset" v={modalPreset ?? '없음'} />
            <Row k="analysisError" v={startAnalysisError ?? '없음'} />
          </Section>

          <Section title="모달/팝오버">
            <div className="flex flex-wrap gap-1.5">
              <ActionButton onClick={onOpenUploadModal}>등록 모달</ActionButton>
              <ActionButton onClick={onOpenReviewModal}>
                확인 중 모달
              </ActionButton>
              <ActionButton onClick={onOpenVerifyModal}>보완 모달</ActionButton>
              <ActionButton onClick={onTogglePopover}>
                결과지 팝오버
              </ActionButton>
              <ActionButton onClick={onOpenReset}>초기화 모달</ActionButton>
            </div>
          </Section>

          <Section title="업로드 상세">
            <div className="grid grid-cols-2 gap-1.5">
              {UPLOAD_PRESETS.map((item) => (
                <PresetButton
                  key={item.value}
                  active={modalPreset === item.value}
                  onClick={() => onOpenModalPreset(item.value)}
                >
                  {item.label}
                </PresetButton>
              ))}
            </div>
          </Section>

          <Section title="검증/완료 상세">
            <div className="grid grid-cols-2 gap-1.5">
              {REVIEW_PRESETS.map((item) => (
                <PresetButton
                  key={item.value}
                  active={modalPreset === item.value}
                  onClick={() => onOpenModalPreset(item.value)}
                >
                  {item.label}
                </PresetButton>
              ))}
            </div>
          </Section>

          <Section title="채팅">
            <div className="flex flex-wrap gap-1.5">
              <ActionButton onClick={() => onScenarioChange('analyzed_empty')}>
                첫 질문 전
              </ActionButton>
              <ActionButton onClick={() => onScenarioChange('chat_sending')}>
                답변 중
              </ActionButton>
              <ActionButton onClick={onSeedChatSuccess}>답변 있음</ActionButton>
              <ActionButton onClick={onSeedChatFailure}>실패 상태</ActionButton>
              <ActionButton onClick={() => onScenarioChange('chat_retrying')}>
                재시도 중
              </ActionButton>
              <ActionButton onClick={onClearChat}>대화 비우기</ActionButton>
            </div>
          </Section>
        </div>
      )}

      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className={cn(
          'rounded-t-lg border border-b-0 border-grey-40 bg-surface px-4 py-2 text-xs font-emphasize shadow-elevated transition-colors lg:hover:bg-grey-10',
          open && 'bg-grey-10'
        )}
      >
        {open ? 'QA 닫기' : '심리검사 QA'}
      </button>
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
  <div className="flex flex-col gap-1.5">
    <p className="font-emphasize text-grey-60">{title}</p>
    {children}
  </div>
);

const Row = ({ k, v }: { k: string; v: string }) => (
  <p className="flex justify-between gap-2 font-mono text-[11px]">
    <span className="text-grey-60">{k}</span>
    <span className="truncate text-right text-grey-100">{v}</span>
  </p>
);

const ActionButton = ({
  children,
  onClick,
}: {
  children: React.ReactNode;
  onClick: () => void;
}) => (
  <button
    type="button"
    onClick={onClick}
    className="rounded-md border border-grey-30 px-2 py-1 text-[11px] text-grey-80 transition-colors lg:hover:bg-grey-10"
  >
    {children}
  </button>
);

const PresetButton = ({
  children,
  active,
  onClick,
}: {
  children: React.ReactNode;
  active: boolean;
  onClick: () => void;
}) => (
  <button
    type="button"
    onClick={onClick}
    className={cn(
      'rounded-md border px-2 py-1.5 text-left text-[11px] transition-colors',
      active
        ? 'border-green-80 bg-green-20 text-green-80'
        : 'border-grey-30 text-grey-80 lg:hover:bg-grey-10'
    )}
  >
    {children}
  </button>
);

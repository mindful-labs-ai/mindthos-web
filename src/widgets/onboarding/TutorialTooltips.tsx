import { Button } from '@/shared/ui';

interface TutorialTooltipProps {
  onConfirm?: () => void;
}

interface TooltipContainerProps {
  title: string;
  message: string | React.ReactNode;
  submessage?: string | React.ReactNode;
  onConfirm?: () => void;
  level?: number;
  totalSteps?: number;
  step?: number;
  confirmText?: string;
}

const LEVEL_MAP: Record<number, { mission: string; totalStep: number }> = {
  1: {
    mission: '상담기록 예시 보기',
    totalStep: 10,
  },
  2: {
    mission: '다회기 분석 예시 보기',
    totalStep: 4,
  },
  3: {
    mission: '녹음 파일 업로드하기',
    totalStep: 1,
  },
};

const ToolTipContainer = ({
  title,
  message,
  submessage,
  level,
  step,
  onConfirm,
  confirmText = '다음 단계로 넘어가기',
}: TooltipContainerProps) => (
  <div className="flex w-full max-w-[200px] flex-col justify-center gap-2">
    {level && LEVEL_MAP[level] && (
      <p className="typo-xs font-emphasize text-primary">
        가이드 - {LEVEL_MAP[level].mission}
      </p>
    )}
    <h4 className="typo-m mb-2 font-headline text-fg">{title}</h4>
    <div className="typo-sm mb-4 break-keep">{message}</div>
    {submessage && <div className="typo-sm mb-4">{submessage}</div>}
    {step && level && LEVEL_MAP[level] && (
      <p className="typo-xs mt-2 text-center font-emphasize text-fg-muted">
        {step}/{LEVEL_MAP[level].totalStep} 단계 진행 중
      </p>
    )}
    {onConfirm && (
      <Button
        size="md"
        tone="primary"
        onClick={onConfirm}
        className="mt-2 w-full py-2"
      >
        {confirmText}
      </Button>
    )}
  </div>
);

/**
 * 전역적으로 관리되는 온보딩 튜토리얼 툴팁 컨텐츠들
 */

// --- Level 1: 상담 기록 예시 보기 ---

// Step 1: 상담 기록 탭 안내 (SideTab)
export const SessionTabTooltip = () => (
  <ToolTipContainer
    title="상담 기록 페이지로 이동"
    message="상담 기록 페이지로 이동하면 작성한 모든 상담 기록을 볼 수 있어요."
    level={1}
    step={1}
  />
);

// Step 2: 특정 상담 기록 클릭 안내 (SessionHistoryPage)
export const SessionClickTooltip = () => (
  <ToolTipContainer
    title="상담 기록 상세 보기"
    message="예시 : 홍길동 3회기 기록을 눌러서 상담 기록을 확인해보세요."
    level={1}
    step={2}
  />
);

// Step 3: 축어록 탭 클릭 안내 (SessionDetailPage)
export const TranscriptTabTooltip = () => (
  <ToolTipContainer
    title="축어록 보기"
    message="상담 기록을 업로드하면 축어록이 자동으로 생성돼요. 축어록을 눌러서 확인해보세요."
    level={1}
    step={3}
  />
);

// Step 4: 축어록 스크롤 안내 (SessionDetailPage)
export const TranscriptScrollTooltip = () => (
  <ToolTipContainer
    title="축어록 보기"
    message={
      <span>
        마음토스의 고급 축어록에서는{' '}
        <p className="font-emphasize">침묵, 감정표현 등의 비언어적 표현</p>도
        잡아낼 수 있어요.
      </span>
    }
    submessage="스크롤해서 아래로 내려볼까요?"
    level={1}
    step={4}
  />
);

// Step 5: 축어록 확인 완료 안내 (SessionDetailPage)
export const TranscriptCompleteTooltip = ({
  onConfirm,
}: TutorialTooltipProps) => (
  <ToolTipContainer
    title="축어록 보기"
    message={
      <span>
        축어록을 모두 확인했어요. <br />
        이제 상담노트를 확인해볼까요?
      </span>
    }
    onConfirm={onConfirm}
    level={1}
  />
);

// Step 6: 상담노트 클릭 안내 (SessionDetailPage)
export const NoteClickTooltip = () => (
  <ToolTipContainer
    title="상담노트 보기"
    message="작성된 축어록을 바탕으로 마음토스가 자동으로 상담노트를 만들어줘요."
    submessage="상담노트를 클릭해보세요."
    level={1}
    step={6}
  />
);

// Step 7: 상담노트 스크롤 안내 (SessionDetailPage)
export const NoteScrollTooltip = () => (
  <ToolTipContainer
    title="상담노트 보기"
    message={
      <p>
        마음토스 상담노트는 자동으로{' '}
        <span className="font-emphasize">상담 이론을 감지</span>해서 적합한
        노트를 작성해줘요.
      </p>
    }
    submessage="스크롤해서 아래로 내려볼까요?"
    level={1}
    step={7}
  />
);

// Step 8: 상담노트 확인 완료 안내 (SessionDetailPage)
export const NoteCompleteTooltip = ({ onConfirm }: TutorialTooltipProps) => (
  <ToolTipContainer
    title="상담노트 보기"
    message={
      <p>
        상담노트를 모두 확인했어요. <br /> 마지막 단계로 넘어가볼까요?
      </p>
    }
    onConfirm={onConfirm}
    level={1}
  />
);

// Step 9: 상담노트 추가 버튼 안내 (SessionDetailPage)
export const AddNoteButtonTooltip = () => (
  <ToolTipContainer
    title="새로운 상담노트 만들기"
    message="마음토스에서는 다양한 상담노트 양식을 제공하고 있어요. 버튼을 눌러서 빈노트를 만들어보세요."
    level={1}
    step={9}
  />
);

// Step 10: 전체 튜토리얼 완료 안내 (SessionDetailPage)
export const TotalCompleteTooltip = ({ onConfirm }: TutorialTooltipProps) => (
  <ToolTipContainer
    title="새로운 상담노트 만들기 "
    message="필요한 상황에 맞는 상담노트 양식을 선택해서 상담사님만의 노트를 만들어보세요. 노트 양식은 노트 양식 페이지에서도 확인 할 수 있어요."
    onConfirm={onConfirm}
    confirmText="가이드 완료하기"
    level={1}
  />
);

// --- Level 2: 다회기 분석 예시 보기 ---

// Step 1: 내담자 탭 안내 (SideTab)
export const ClientTabTooltip = () => (
  <ToolTipContainer
    title="내담자 페이지로 이동"
    message="내담자 페이지로 이동하면 다회기 분석을 통한 AI 슈퍼비전을 받아볼 수 있어요."
    level={2}
    step={1}
  />
);

// Step 2: 특정 내담자 클릭 안내 (ClientListPage)
export const ClientClickTooltip = () => (
  <ToolTipContainer
    title="내담자 상세 보기"
    message="홍길동 내담자를 눌러서 상세 내용을 확인해보세요!"
    level={2}
    step={2}
  />
);

// Step 3: 다회기 분석 탭 클릭 안내 (ClientDetailPage)
export const AnalysisTabTooltip = () => (
  <ToolTipContainer
    title="다회기 분석 보기"
    message="해당 내담자에 저장된 상담 기록을 바탕으로 AI 슈퍼비전을 받을 수 있어요. 다회기 분석을 클릭해보세요."
    level={2}
    step={3}
  />
);

// Step 4: 다회기 분석 스크롤 안내 (ClientAnalysisTab)
export const AnalysisScrollTooltip = () => (
  <ToolTipContainer
    title="AI 슈퍼비전"
    message="회기를 진행하며 내담자와 나눈 대화를 바탕으로 사례 개념화 총평부터 회기별 상세 평가, 축어록 정밀 분석, 향후 로드맵 등의 슈퍼비전을 제공해요."
    submessage="스크롤해서 아래로 내려볼까요?"
    level={2}
    step={4}
  />
);

// Step 5: 다회기 분석 완료 안내 (ClientAnalysisTab)
export const MissionCompleteTooltip = ({ onConfirm }: TutorialTooltipProps) => (
  <ToolTipContainer
    title="AI 슈퍼비전"
    message="혹시나 상담이 어렵게 느껴진다면, 24시간 늘 상담사님 옆에 있는 마음토스가 제공하는 AI 슈퍼비전으로 상담의 방향성을 잡아보세요."
    onConfirm={onConfirm}
    confirmText="가이드 완료하기"
    level={2}
  />
);

// --- Level 3: 새 상담 기록 만들기 ---

// Step 3: 새 상담 기록 버튼 안내 (SideTab)
export const NewRecordButtonTooltip = ({ onConfirm }: TutorialTooltipProps) => (
  <div className="flex w-full max-w-[200px] flex-col justify-center gap-2">
    <p className="typo-xs font-emphasize text-primary">
      가이드 - {LEVEL_MAP[3].mission}
    </p>
    <h4 className="typo-m mb-2 font-headline text-fg">녹음 파일 업로드하기</h4>
    <div className="typo-sm mb-4 break-keep">
      이제 직접 상담 기록을 추가해볼까요? [녹음 파일 업로드하기] 버튼을 눌러서
      실제 내담자의 상담 기록을 올려보세요.
    </div>
    <div className="typo-sm mb-4">
      상담사님의 상담 기록을 생성하면 가이드를 달성할 수 있어요.
    </div>
    <button
      onClick={onConfirm}
      className="mt-2 w-full rounded-md bg-primary-subtle py-2 font-medium text-primary"
    >
      확인
    </button>
  </div>
);

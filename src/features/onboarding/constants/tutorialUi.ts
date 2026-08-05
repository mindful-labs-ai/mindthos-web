import type { CohortBranch } from './cohort';
import { TutorialStep } from './tutorialStep';

export const VIDEO_MIN_SECONDS = 30;
export const EXAMPLE_MIN_SECONDS = 10;
export const DIRECT_UPLOAD_MIN_SECONDS = 12;
export const TUTORIAL_FAKE_FILE_SIZE_BYTES = 12.5 * 1024 * 1024;

const TUTORIAL_SECOND_MS = 1000;
const TUTORIAL_MINUTE_SECONDS = 60;
const TUTORIAL_HOUR_SECONDS = 60 * TUTORIAL_MINUTE_SECONDS;
const TUTORIAL_DAY_SECONDS = 24 * TUTORIAL_HOUR_SECONDS;

/**
 * Tutorial 만료까지 남은 시간을 사용자에게 표시할 문자열로 변환한다.
 * 24시간 이상 남았을 때는 일수만, 24시간 미만일 때는 실시간 시계를 표시한다.
 */
export const formatTutorialRemainingTime = (remainingMs: number): string => {
  const totalSeconds = Math.max(
    0,
    Math.floor(remainingMs / TUTORIAL_SECOND_MS)
  );
  const days = Math.floor(totalSeconds / TUTORIAL_DAY_SECONDS);
  const hours = Math.floor(
    (totalSeconds % TUTORIAL_DAY_SECONDS) / TUTORIAL_HOUR_SECONDS
  );
  const minutes = Math.floor(
    (totalSeconds % TUTORIAL_HOUR_SECONDS) / TUTORIAL_MINUTE_SECONDS
  );
  const seconds = totalSeconds % TUTORIAL_MINUTE_SECONDS;
  const clock = [hours, minutes, seconds]
    .map((value) => String(value).padStart(2, '0'))
    .join(':');

  return days > 0 ? `${days}일` : clock;
};

export interface TutorialRecommendedNoteTemplate {
  id: number;
  title: string;
}

/** 상담노트 선택 미션의 cohort별 추천 순서와 표시 이름이다. */
export const TUTORIAL_RECOMMENDED_NOTE_TEMPLATES_BY_COHORT = {
  GENOGRAM: [
    { id: 8, title: '보웬 사례개념화 노트' },
    { id: 11, title: '미누친 SFT 사례개념화 노트' },
    { id: 15, title: '가족센터 상담노트' },
  ],
  CBT: [
    { id: 5, title: 'CBT 사례개념화 노트' },
    { id: 3, title: 'ACT 사례개념화 노트' },
    { id: 21, title: 'DBT 사례개념화 노트' },
    { id: 20, title: '심리도식치료 사례개념화 노트' },
  ],
  PSYCHODYNAMIC: [
    { id: 24, title: '정신분석 사례개념화 노트' },
    { id: 18, title: '대상관계이론 사례개념화 노트' },
  ],
  HUMANISTIC: [
    { id: 2, title: '인간중심 사례개념화노트' },
    { id: 12, title: '정서중심 사례개념화 노트' },
    { id: 19, title: '게슈탈트 사례개념화 노트' },
  ],
  GENERIC: [
    { id: 1, title: '마음토스 상담노트' },
    { id: 2, title: '인간중심 사례개념화' },
    { id: 5, title: 'CBT 사례개념화' },
  ],
} as const satisfies Record<
  CohortBranch,
  readonly TutorialRecommendedNoteTemplate[]
>;

export interface StepCompleteCopy {
  title: string;
  subtitle: string;
  content: string;
  nextLabel: string;
}

export interface TutorialMissionCopyText {
  subtitle: string;
  content: string;
  buttonText: string;
}

export interface TutorialMissionCopy extends TutorialMissionCopyText {
  /** GENERIC 상담노트 선택 후 영상 상태에서 사용하는 문구 */
  afterAction?: TutorialMissionCopyText;
}

const NEXT_SUPERVISION_COMPLETE_COPY = {
  subtitle: '다음은 선생님께 꼭 필요한 기능,\nAI 슈퍼비전에 대해서 알아볼까요?',
  content:
    '1회기가 아닌 다회기의 기록을 함께 분석해서\nAI가 슈퍼비전 보고서를 작성해주는 기능이에요.',
  nextLabel: '다음 단계 시작하기',
} as const;

const NEXT_GENOGRAM_COMPLETE_COPY = {
  subtitle:
    '다음은 내담자의 관계와 맥락을 살펴보는 기능,\n가계도에 대해서 알아볼까요?',
  content:
    '내담자의 가족 관계를 한눈에 정리하고\nAI가 가계도 초안을 만들어주는 기능이에요.',
  nextLabel: '다음 단계 시작하기',
} as const;

const NEXT_NOTE_COMPLETE_COPY = {
  subtitle: '이제 거의 다 왔어요!\n다음으로 나만의 상담노트 양식을 골라볼까요?',
  content:
    '기본 노트 양식으로 선택하면, 상담기록을 만들 때\n해당 양식이 기본으로 생성됩니다.',
  nextLabel: '다음 단계 시작하기',
} as const;

const NEXT_UPLOAD_COMPLETE_COPY = {
  subtitle: '이제 마지막 단계만 남았어요.\n직접 상담 기록을 만들어볼까요?',
  content:
    '마음토스로 상담 기록을 정리하는 상담사는\n평균적으로 87% 이상 시간을 절약하고 있어요.',
  nextLabel: '다음 단계 시작하기',
} as const;

const FINAL_REWARD_COMPLETE_COPY: StepCompleteCopy = {
  title: '튜토리얼 완료!',
  subtitle: '축하합니다!\n모든 튜토리얼을 완료했어요',
  content:
    '작은 선물로 스타터 플랜 1주일 체험권을 준비했어요.\n앞으로 7일간 마음토스를 자유롭게 사용해보세요!',
  nextLabel: '지금 이벤트 보상 받기',
};

/** 단계 완료 모달 문구는 이 테이블만 수정하면 전체 UI에 반영된다. */
export const STEP_COMPLETE_COPY: Record<TutorialStep, StepCompleteCopy> = {
  [TutorialStep.GENOGRAM_STAGE_1]: {
    title: '튜토리얼 1단계 완료',
    ...NEXT_GENOGRAM_COMPLETE_COPY,
  },
  [TutorialStep.GENOGRAM_STAGE_2]: {
    title: '튜토리얼 2단계 완료',
    ...NEXT_NOTE_COMPLETE_COPY,
  },
  [TutorialStep.GENOGRAM_STAGE_3]: {
    title: '튜토리얼 3단계 완료',
    ...NEXT_UPLOAD_COMPLETE_COPY,
  },
  [TutorialStep.GENOGRAM_STAGE_4]: FINAL_REWARD_COMPLETE_COPY,
  [TutorialStep.CBT_STAGE_1]: {
    title: '튜토리얼 1단계 완료',
    ...NEXT_SUPERVISION_COMPLETE_COPY,
  },
  [TutorialStep.CBT_STAGE_2]: {
    title: '튜토리얼 2단계 완료',
    ...NEXT_NOTE_COMPLETE_COPY,
  },
  [TutorialStep.CBT_STAGE_3]: {
    title: '튜토리얼 3단계 완료',
    ...NEXT_UPLOAD_COMPLETE_COPY,
  },
  [TutorialStep.CBT_STAGE_4]: FINAL_REWARD_COMPLETE_COPY,
  [TutorialStep.PSYCHODYNAMIC_STAGE_1]: {
    title: '튜토리얼 1단계 완료',
    ...NEXT_SUPERVISION_COMPLETE_COPY,
  },
  [TutorialStep.PSYCHODYNAMIC_STAGE_2]: {
    title: '튜토리얼 2단계 완료',
    ...NEXT_NOTE_COMPLETE_COPY,
  },
  [TutorialStep.PSYCHODYNAMIC_STAGE_3]: {
    title: '튜토리얼 3단계 완료',
    ...NEXT_UPLOAD_COMPLETE_COPY,
  },
  [TutorialStep.PSYCHODYNAMIC_STAGE_4]: FINAL_REWARD_COMPLETE_COPY,
  [TutorialStep.HUMANISTIC_STAGE_1]: {
    title: '튜토리얼 1단계 완료',
    ...NEXT_SUPERVISION_COMPLETE_COPY,
  },
  [TutorialStep.HUMANISTIC_STAGE_2]: {
    title: '튜토리얼 2단계 완료',
    ...NEXT_NOTE_COMPLETE_COPY,
  },
  [TutorialStep.HUMANISTIC_STAGE_3]: {
    title: '튜토리얼 3단계 완료',
    ...NEXT_UPLOAD_COMPLETE_COPY,
  },
  [TutorialStep.HUMANISTIC_STAGE_4]: FINAL_REWARD_COMPLETE_COPY,
  [TutorialStep.GENERIC_STAGE_1]: {
    title: '튜토리얼 1단계 완료',
    subtitle: '가이드를 봤으니 이제 직접 확인해볼까요?',
    content:
      '마음토스가 예시 상담기록을 준비했어요.\n우선 가상 내담자의 기록과 함께 마음토스를 살펴봐요.',
    nextLabel: '다음 단계 시작하기',
  },
  [TutorialStep.GENERIC_STAGE_2]: {
    title: '튜토리얼 2단계 완료',
    ...NEXT_NOTE_COMPLETE_COPY,
  },
  [TutorialStep.GENERIC_STAGE_3]: {
    title: '튜토리얼 3단계 완료',
    ...NEXT_UPLOAD_COMPLETE_COPY,
  },
  [TutorialStep.GENERIC_STAGE_4]: FINAL_REWARD_COMPLETE_COPY,
};

const GUIDE_COPY: TutorialMissionCopyText = {
  subtitle: '마음토스 200% 활용하는 법!',
  content: '가이드 영상을 확인하고 마음토스를 200% 활용해봐요',
  buttonText: '튜토리얼 완료',
};

const RECORD_EXAMPLE_COPY: TutorialMissionCopyText = {
  subtitle: '상담기록 예시 확인하기',
  content:
    "'상담 기록'탭에서 내담자의 <주황색>축어록</주황색>과 <주황색>상담노트</주황색>를 확인할 수 있어요. /n 마음토스가 선생님을 위해서 예시 상담기록을 준비했어요. /n 직접 확인해볼까요?",
  buttonText: '예시 상담기록 보기',
};

const SUPERVISION_EXAMPLE_COPY: TutorialMissionCopyText = {
  subtitle: 'AI 슈퍼비전 예시 확인하기',
  content:
    '여러 회기를 진행한 내담자의 경우 /n 모든 회기에 대해서 통합적으로 분석한 /n <주황색>AI 슈퍼비전</주황색>을 받아볼 수 있어요.',
  buttonText: '예시 슈퍼비전 보기',
};

const GENOGRAM_EXAMPLE_COPY: TutorialMissionCopyText = {
  subtitle: '가계도 예시 확인하기',
  content:
    '마음토스의 가계도는 간편하게 그릴 수 있을 뿐 아니라 /n 내담자의 축어록이 있다면, AI가 가계도 초안을 /n클릭 한 번으로 만들어줘요.',
  buttonText: '예시 가계도 보기',
};

const NOTE_TEMPLATE_COPY: TutorialMissionCopyText = {
  subtitle: '나의 상담노트 양식 선택하기',
  content:
    '기본 노트로 설정하면 이후 상담기록을 만들때 /n 선택한 노트 양식이 기본적으로 같이 만들어져요. /n 자주 쓰는 양식은 기본 노트로 설정해보세요!',
  buttonText: '다음',
};

const NOTE_TEMPLATE_VIDEO_COPY: TutorialMissionCopyText = {
  subtitle: '나의 상담노트 양식 선택하기',
  content:
    "이제 기본 노트가 설정되었어요! /n 기본 노트 설정은 '상담노트 양식' 탭에서 /n 언제든지 바꿀 수 있어요.",
  buttonText: '튜토리얼 완료',
};

const NOTE_TEMPLATE_MISSION_COPY: TutorialMissionCopy = {
  ...NOTE_TEMPLATE_COPY,
  afterAction: NOTE_TEMPLATE_VIDEO_COPY,
};

const SESSION_CREATE_COPY: TutorialMissionCopyText = {
  subtitle: '직접 상담 기록 만들기',
  content: '이제 상담 녹음 파일을 직접 업로드해서 /n 상담 기록을 만들어볼까요?',
  buttonText: '상담 기록 만들기',
};

/**
 * 실제 미션 모달의 문구는 이 테이블에서 단계별로 수정한다.
 * 같은 미션을 사용하는 cohort는 같은 문구 객체를 공유하되, 단계 키는
 * TutorialStep으로 유지해 이후 단계별 문구 변경을 허용한다.
 */
export const TUTORIAL_MISSION_COPY: Record<TutorialStep, TutorialMissionCopy> =
  {
    [TutorialStep.GENOGRAM_STAGE_1]: RECORD_EXAMPLE_COPY,
    [TutorialStep.GENOGRAM_STAGE_2]: GENOGRAM_EXAMPLE_COPY,
    [TutorialStep.GENOGRAM_STAGE_3]: NOTE_TEMPLATE_MISSION_COPY,
    [TutorialStep.GENOGRAM_STAGE_4]: SESSION_CREATE_COPY,
    [TutorialStep.CBT_STAGE_1]: RECORD_EXAMPLE_COPY,
    [TutorialStep.CBT_STAGE_2]: SUPERVISION_EXAMPLE_COPY,
    [TutorialStep.CBT_STAGE_3]: NOTE_TEMPLATE_MISSION_COPY,
    [TutorialStep.CBT_STAGE_4]: SESSION_CREATE_COPY,
    [TutorialStep.PSYCHODYNAMIC_STAGE_1]: RECORD_EXAMPLE_COPY,
    [TutorialStep.PSYCHODYNAMIC_STAGE_2]: SUPERVISION_EXAMPLE_COPY,
    [TutorialStep.PSYCHODYNAMIC_STAGE_3]: NOTE_TEMPLATE_MISSION_COPY,
    [TutorialStep.PSYCHODYNAMIC_STAGE_4]: SESSION_CREATE_COPY,
    [TutorialStep.HUMANISTIC_STAGE_1]: RECORD_EXAMPLE_COPY,
    [TutorialStep.HUMANISTIC_STAGE_2]: SUPERVISION_EXAMPLE_COPY,
    [TutorialStep.HUMANISTIC_STAGE_3]: NOTE_TEMPLATE_MISSION_COPY,
    [TutorialStep.HUMANISTIC_STAGE_4]: SESSION_CREATE_COPY,
    [TutorialStep.GENERIC_STAGE_1]: GUIDE_COPY,
    [TutorialStep.GENERIC_STAGE_2]: RECORD_EXAMPLE_COPY,
    [TutorialStep.GENERIC_STAGE_3]: NOTE_TEMPLATE_MISSION_COPY,
    [TutorialStep.GENERIC_STAGE_4]: SESSION_CREATE_COPY,
  };

const TUTORIAL_VIDEO_SOURCE = {
  OVERVIEW: '/tutorial/mindthos-tutorial-overview-v0.mp4',
  RECORD_EXAMPLE: '/tutorial/mindthos-tutorial-record-example-v1.mp4',
  AI_SUPERVISION: '/tutorial/mindthos-tutorial-ai-supervision-v1.mp4',
} as const;

/**
 * 아직 전용 영상이 없는 가계도·상담노트·업로드 단계는 AI 슈퍼비전 영상을
 * 임시 사용한다. 새 영상이 도착하면 해당 단계의 src만 교체한다.
 */
export const GUIDE_VIDEO_SOURCES: Record<TutorialStep, string> = {
  [TutorialStep.GENOGRAM_STAGE_1]: TUTORIAL_VIDEO_SOURCE.RECORD_EXAMPLE,
  [TutorialStep.GENOGRAM_STAGE_2]: TUTORIAL_VIDEO_SOURCE.AI_SUPERVISION,
  [TutorialStep.GENOGRAM_STAGE_3]: TUTORIAL_VIDEO_SOURCE.AI_SUPERVISION,
  [TutorialStep.GENOGRAM_STAGE_4]: TUTORIAL_VIDEO_SOURCE.AI_SUPERVISION,
  [TutorialStep.CBT_STAGE_1]: TUTORIAL_VIDEO_SOURCE.RECORD_EXAMPLE,
  [TutorialStep.CBT_STAGE_2]: TUTORIAL_VIDEO_SOURCE.AI_SUPERVISION,
  [TutorialStep.CBT_STAGE_3]: TUTORIAL_VIDEO_SOURCE.AI_SUPERVISION,
  [TutorialStep.CBT_STAGE_4]: TUTORIAL_VIDEO_SOURCE.AI_SUPERVISION,
  [TutorialStep.PSYCHODYNAMIC_STAGE_1]: TUTORIAL_VIDEO_SOURCE.RECORD_EXAMPLE,
  [TutorialStep.PSYCHODYNAMIC_STAGE_2]: TUTORIAL_VIDEO_SOURCE.AI_SUPERVISION,
  [TutorialStep.PSYCHODYNAMIC_STAGE_3]: TUTORIAL_VIDEO_SOURCE.AI_SUPERVISION,
  [TutorialStep.PSYCHODYNAMIC_STAGE_4]: TUTORIAL_VIDEO_SOURCE.AI_SUPERVISION,
  [TutorialStep.HUMANISTIC_STAGE_1]: TUTORIAL_VIDEO_SOURCE.RECORD_EXAMPLE,
  [TutorialStep.HUMANISTIC_STAGE_2]: TUTORIAL_VIDEO_SOURCE.AI_SUPERVISION,
  [TutorialStep.HUMANISTIC_STAGE_3]: TUTORIAL_VIDEO_SOURCE.AI_SUPERVISION,
  [TutorialStep.HUMANISTIC_STAGE_4]: TUTORIAL_VIDEO_SOURCE.AI_SUPERVISION,
  [TutorialStep.GENERIC_STAGE_1]: TUTORIAL_VIDEO_SOURCE.OVERVIEW,
  [TutorialStep.GENERIC_STAGE_2]: TUTORIAL_VIDEO_SOURCE.RECORD_EXAMPLE,
  [TutorialStep.GENERIC_STAGE_3]: TUTORIAL_VIDEO_SOURCE.AI_SUPERVISION,
  [TutorialStep.GENERIC_STAGE_4]: TUTORIAL_VIDEO_SOURCE.AI_SUPERVISION,
};

export const COHORT_TUTORIAL_CLIENT = {
  GENOGRAM: 'LEE_YOUNGSUK',
  DEFAULT: 'JUNG_SUA',
} as const;

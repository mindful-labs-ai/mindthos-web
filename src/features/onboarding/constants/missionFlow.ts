import type { CohortBranch } from './cohort';

/** UI renderer 종류는 4개로 고정하고, 화면 내용은 cohort별 variant로 바꾼다. */
export const MISSION_TYPE = {
  GUIDE_VIDEO: 'GUIDE_VIDEO',
  EXAMPLE: 'EXAMPLE',
  NOTE: 'NOTE',
  CLIENT_AUDIO: 'CLIENT_AUDIO',
} as const;

export type MissionType = (typeof MISSION_TYPE)[keyof typeof MISSION_TYPE];

export const MISSION_STAGE_STATE = {
  NOT_STARTED: 'NOT_STARTED',
  IN_PROGRESS: 'IN_PROGRESS',
  COMPLETED: 'COMPLETED',
} as const;

export type MissionStageState =
  (typeof MISSION_STAGE_STATE)[keyof typeof MISSION_STAGE_STATE];

export type MissionStage = 1 | 2 | 3 | 4;

export interface MissionStepConfig {
  stage: MissionStage;
  type: MissionType;
  variant: string;
  state: MissionStageState;
}

const step = (
  stage: MissionStage,
  type: MissionType,
  variant: string
): MissionStepConfig => ({
  stage,
  type,
  variant,
  state: MISSION_STAGE_STATE.NOT_STARTED,
});

/**
 * 기획 문서의 5개 cohort 분기를 프론트 설정으로 표현한다.
 * - GENOGRAM은 2단계를 가계도 예시로 제공한다.
 * - CBT/PSYCHODYNAMIC/HUMANISTIC은 AI 슈퍼비전 예시 renderer를 공유한다.
 * - 가이드 영상과 예시보기 단계는 동일한 video_modal UI를 공유한다.
 */
export const COHORT_MISSION_FLOWS: Record<CohortBranch, MissionStepConfig[]> = {
  GENOGRAM: [
    step(1, MISSION_TYPE.EXAMPLE, 'RECORD_COUPLE_FAMILY'),
    step(2, MISSION_TYPE.EXAMPLE, 'GENOGRAM'),
    step(3, MISSION_TYPE.NOTE, 'FAMILY_SYSTEMIC'),
    step(4, MISSION_TYPE.CLIENT_AUDIO, 'COUPLE_FAMILY'),
  ],
  CBT: [
    step(1, MISSION_TYPE.EXAMPLE, 'RECORD_ADULT'),
    step(2, MISSION_TYPE.EXAMPLE, 'AI_SUPERVISION'),
    step(3, MISSION_TYPE.NOTE, 'CBT'),
    step(4, MISSION_TYPE.CLIENT_AUDIO, 'ADULT'),
  ],
  PSYCHODYNAMIC: [
    step(1, MISSION_TYPE.EXAMPLE, 'RECORD_ADULT'),
    step(2, MISSION_TYPE.EXAMPLE, 'AI_SUPERVISION'),
    step(3, MISSION_TYPE.NOTE, 'PSYCHODYNAMIC'),
    step(4, MISSION_TYPE.CLIENT_AUDIO, 'ADULT'),
  ],
  HUMANISTIC: [
    step(1, MISSION_TYPE.EXAMPLE, 'RECORD_ADULT'),
    step(2, MISSION_TYPE.EXAMPLE, 'AI_SUPERVISION'),
    step(3, MISSION_TYPE.NOTE, 'HUMANISTIC'),
    step(4, MISSION_TYPE.CLIENT_AUDIO, 'ADULT'),
  ],
  GENERIC: [
    step(1, MISSION_TYPE.GUIDE_VIDEO, 'GENERIC'),
    step(2, MISSION_TYPE.EXAMPLE, 'RECORD_ADULT'),
    step(3, MISSION_TYPE.NOTE, 'DEFAULT'),
    step(4, MISSION_TYPE.CLIENT_AUDIO, 'ADULT'),
  ],
};

export function getCohortMissionFlow(
  cohort: CohortBranch
): readonly MissionStepConfig[] {
  return COHORT_MISSION_FLOWS[cohort];
}

/**
 * 영상 시청 후 다음 액션으로 이어지는 미션인지 판정한다.
 * EXAMPLE은 영상 확인 뒤 실제 예시 페이지로 이동하고, GUIDE_VIDEO는
 * 바로 단계 완료로 이어지지만 두 단계의 미션 모달 UI는 동일하다.
 */
export function isVideoMission(type: MissionType): boolean {
  return type === MISSION_TYPE.GUIDE_VIDEO || type === MISSION_TYPE.EXAMPLE;
}

/** 30초 최소 시청은 범용 1단계의 일반 가이드 영상에만 적용한다. */
export function requiresMinimumVideoWatch(type: MissionType): boolean {
  return type === MISSION_TYPE.GUIDE_VIDEO;
}

export function getCurrentMissionStep(
  cohort: CohortBranch,
  completedStage: number
): MissionStepConfig | null {
  return (
    getCohortMissionFlow(cohort).find(
      (mission) => mission.stage === completedStage + 1
    ) ?? null
  );
}

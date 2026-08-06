import { describe, expect, it } from 'vitest';

import {
  COHORT_MISSION_FLOWS,
  getCurrentMissionStep,
  MISSION_TYPE,
  requiresMinimumVideoWatch,
} from './missionFlow';

describe('missionFlow', () => {
  it('5개 cohort가 모두 4단계 상태를 가진다', () => {
    Object.values(COHORT_MISSION_FLOWS).forEach((flow) => {
      expect(flow).toHaveLength(4);
      expect(flow.map((mission) => mission.stage)).toEqual([1, 2, 3, 4]);
      expect(flow.every((mission) => mission.state === 'NOT_STARTED')).toBe(
        true
      );
    });
  });

  it('CBT·정신역동·인본경험은 AI 슈퍼비전 예시 renderer를 공유한다', () => {
    expect(COHORT_MISSION_FLOWS.CBT[1]).toMatchObject({
      type: MISSION_TYPE.EXAMPLE,
      variant: 'AI_SUPERVISION',
    });
    expect(COHORT_MISSION_FLOWS.PSYCHODYNAMIC[1]).toMatchObject({
      type: MISSION_TYPE.EXAMPLE,
      variant: 'AI_SUPERVISION',
    });
    expect(COHORT_MISSION_FLOWS.HUMANISTIC[1]).toMatchObject({
      type: MISSION_TYPE.EXAMPLE,
      variant: 'AI_SUPERVISION',
    });
  });

  it('cohort와 완료 단계로 현재 미션을 찾는다', () => {
    expect(getCurrentMissionStep('GENOGRAM', 1)).toMatchObject({
      stage: 2,
      variant: 'GENOGRAM',
    });
    expect(getCurrentMissionStep('GENERIC', 4)).toBeNull();
  });

  it('30초 최소 시청은 일반 가이드 영상에만 적용한다', () => {
    expect(requiresMinimumVideoWatch(MISSION_TYPE.GUIDE_VIDEO)).toBe(true);
    expect(requiresMinimumVideoWatch(MISSION_TYPE.EXAMPLE)).toBe(false);
    expect(requiresMinimumVideoWatch(MISSION_TYPE.NOTE)).toBe(false);
    expect(requiresMinimumVideoWatch(MISSION_TYPE.CLIENT_AUDIO)).toBe(false);
  });
});

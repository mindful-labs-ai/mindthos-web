import { describe, expect, it } from 'vitest';

import { TutorialStep } from './tutorialStep';
import {
  DIRECT_UPLOAD_MIN_SECONDS,
  formatTutorialRemainingTime,
  GUIDE_VIDEO_SOURCES,
  STEP_COMPLETE_COPY,
  TUTORIAL_FAKE_FILE_SIZE_BYTES,
  TUTORIAL_MISSION_COPY,
  TUTORIAL_RECOMMENDED_NOTE_TEMPLATES_BY_COHORT,
  VIDEO_MIN_SECONDS,
} from './tutorialUi';

describe('tutorialUi', () => {
  it('모든 서버 TutorialStep에 완료 모달 문구가 중앙화되어 있다', () => {
    expect(Object.keys(STEP_COMPLETE_COPY)).toHaveLength(
      Object.values(TutorialStep).length
    );

    Object.values(STEP_COMPLETE_COPY).forEach((copy) => {
      expect(copy.title).toBeTruthy();
      expect(copy.subtitle).toBeTruthy();
      expect(copy.content).toBeTruthy();
      expect(copy.nextLabel).toBeTruthy();
    });
  });

  it('미션 완료 워딩 이미지를 실제 다음 기능에 맞게 적용한다', () => {
    expect(STEP_COMPLETE_COPY[TutorialStep.GENOGRAM_STAGE_1]).toMatchObject({
      title: '튜토리얼 1단계 완료',
      subtitle: expect.stringContaining('가계도'),
      content: expect.stringContaining('가족 관계'),
    });

    expect(STEP_COMPLETE_COPY[TutorialStep.GENERIC_STAGE_1]).toMatchObject({
      subtitle: '가이드를 봤으니 이제 직접 확인해볼까요?',
      content:
        '마음토스가 예시 상담기록을 준비했어요.\n우선 가상 내담자의 기록과 함께 마음토스를 살펴봐요.',
    });

    [
      TutorialStep.CBT_STAGE_1,
      TutorialStep.PSYCHODYNAMIC_STAGE_1,
      TutorialStep.HUMANISTIC_STAGE_1,
    ].forEach((step) => {
      expect(STEP_COMPLETE_COPY[step].subtitle).toContain('AI 슈퍼비전');
    });

    [
      TutorialStep.GENOGRAM_STAGE_2,
      TutorialStep.CBT_STAGE_2,
      TutorialStep.PSYCHODYNAMIC_STAGE_2,
      TutorialStep.HUMANISTIC_STAGE_2,
      TutorialStep.GENERIC_STAGE_2,
    ].forEach((step) => {
      expect(STEP_COMPLETE_COPY[step].subtitle).toContain(
        '나만의 상담노트 양식'
      );
    });

    [
      TutorialStep.GENOGRAM_STAGE_3,
      TutorialStep.CBT_STAGE_3,
      TutorialStep.PSYCHODYNAMIC_STAGE_3,
      TutorialStep.HUMANISTIC_STAGE_3,
      TutorialStep.GENERIC_STAGE_3,
    ].forEach((step) => {
      expect(STEP_COMPLETE_COPY[step].subtitle).toContain(
        '직접 상담 기록을 만들어볼까요?'
      );
    });

    [
      TutorialStep.GENOGRAM_STAGE_4,
      TutorialStep.CBT_STAGE_4,
      TutorialStep.PSYCHODYNAMIC_STAGE_4,
      TutorialStep.HUMANISTIC_STAGE_4,
      TutorialStep.GENERIC_STAGE_4,
    ].forEach((step) => {
      expect(STEP_COMPLETE_COPY[step]).toMatchObject({
        title: '튜토리얼 완료!',
        subtitle: '축하합니다!\n모든 튜토리얼을 완료했어요',
        nextLabel: '지금 이벤트 보상 받기',
      });
    });
  });

  it('미션과 단계 완료 모달의 subtitle에는 코호트명이 노출되지 않는다', () => {
    const cohortNamePattern = /커플·가족|가족체계|성인|CBT|정신역동|인간중심/;

    Object.values(STEP_COMPLETE_COPY).forEach((copy) => {
      expect(copy.subtitle).not.toMatch(cohortNamePattern);
    });
    Object.values(TUTORIAL_MISSION_COPY).forEach((copy) => {
      expect(copy.subtitle).not.toMatch(cohortNamePattern);
      expect(copy.afterAction?.subtitle ?? '').not.toMatch(cohortNamePattern);
    });
  });

  it('가이드 영상 완료 기준은 30초다', () => {
    expect(VIDEO_MIN_SECONDS).toBe(30);
  });

  it('모든 TutorialStep에 재생 가능한 영상 src가 연결되어 있다', () => {
    expect(Object.keys(GUIDE_VIDEO_SOURCES)).toHaveLength(
      Object.values(TutorialStep).length
    );
    expect(GUIDE_VIDEO_SOURCES[TutorialStep.GENERIC_STAGE_1]).toContain(
      'overview'
    );
    expect(GUIDE_VIDEO_SOURCES[TutorialStep.CBT_STAGE_1]).toContain(
      'record-example'
    );
    expect(GUIDE_VIDEO_SOURCES[TutorialStep.CBT_STAGE_2]).toContain(
      'ai-supervision'
    );
    expect(GUIDE_VIDEO_SOURCES[TutorialStep.GENOGRAM_STAGE_2]).toContain(
      'genogram'
    );
    expect(GUIDE_VIDEO_SOURCES[TutorialStep.CBT_STAGE_3]).toContain(
      'selectnote'
    );
    expect(GUIDE_VIDEO_SOURCES[TutorialStep.CBT_STAGE_4]).toContain('upload');
  });

  it('튜토리얼 업로드 준비 상태의 시간과 파일 크기를 고정한다', () => {
    expect(DIRECT_UPLOAD_MIN_SECONDS).toBe(12);
    expect(TUTORIAL_FAKE_FILE_SIZE_BYTES).toBe(12.5 * 1024 * 1024);
  });

  it('24시간 이상 남으면 일수만, 24시간 미만이면 시·분·초로 표시한다', () => {
    expect(
      formatTutorialRemainingTime(
        2 * 24 * 60 * 60 * 1000 + 3 * 60 * 60 * 1000 + 4 * 60 * 1000 + 5 * 1000
      )
    ).toBe('2일');
    expect(formatTutorialRemainingTime(24 * 60 * 60 * 1000)).toBe('1일');
    expect(formatTutorialRemainingTime(24 * 60 * 60 * 1000 - 1000)).toBe(
      '23:59:59'
    );
    expect(formatTutorialRemainingTime(59 * 1000)).toBe('00:00:59');
    expect(formatTutorialRemainingTime(-1)).toBe('00:00:00');
  });

  it('모든 코호트의 상담노트 선택 단계가 후속 영상을 가진다', () => {
    const noteSteps = Object.entries(TUTORIAL_MISSION_COPY).filter(([step]) =>
      step.endsWith('_STAGE_3')
    );

    expect(noteSteps).toHaveLength(5);
    noteSteps.forEach(([, copy]) => {
      expect(copy.afterAction?.buttonText).toBe('튜토리얼 완료');
    });
  });

  it('코호트별 추천 상담노트 템플릿 매핑이 중앙화되어 있다', () => {
    expect(TUTORIAL_RECOMMENDED_NOTE_TEMPLATES_BY_COHORT).toEqual({
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
    });
  });

  it('모든 TutorialStep에 미션 문구와 버튼 문구가 중앙화되어 있다', () => {
    expect(Object.keys(TUTORIAL_MISSION_COPY)).toHaveLength(
      Object.values(TutorialStep).length
    );

    Object.values(TUTORIAL_MISSION_COPY).forEach((copy) => {
      expect(copy.subtitle).toBeTruthy();
      expect(copy.content).toBeTruthy();
      expect(copy.buttonText).toBeTruthy();

      if (copy.afterAction) {
        expect(copy.afterAction.subtitle).toBeTruthy();
        expect(copy.afterAction.content).toBeTruthy();
        expect(copy.afterAction.buttonText).toBeTruthy();
      }
    });
  });
});

import { act, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  ExampleMission,
  NoteMission,
  VideoMission,
} from './TutorialRebootModal';

afterEach(() => {
  vi.useRealTimers();
});

describe('VideoMission', () => {
  it('영상이 너비와 높이 안에서 비율을 유지하도록 표시한다', () => {
    const { container } = render(
      <VideoMission
        source="/tutorial/guide.mp4"
        content="가이드"
        canContinue
        minimumWatchSeconds={0}
        onTimeUpdate={vi.fn()}
      />
    );

    const video = container.querySelector('video');
    expect(video).toHaveClass('h-full', 'w-full', 'object-contain');
    expect(video?.parentElement).toHaveClass('overflow-hidden');
  });

  it('모달이 열리면 영상을 자동 반복 재생한다', () => {
    const play = vi
      .spyOn(window.HTMLMediaElement.prototype, 'play')
      .mockResolvedValue(undefined);

    const { container } = render(
      <VideoMission
        source="/tutorial/guide.mp4"
        content="가이드"
        canContinue
        minimumWatchSeconds={0}
        onTimeUpdate={vi.fn()}
      />
    );

    const video = container.querySelector('video');
    expect(video).toHaveAttribute('autoplay');
    expect(video).toHaveAttribute('loop');
    expect(play).toHaveBeenCalled();

    play.mockRestore();
  });

  it('소리 있는 자동재생이 차단되면 음소거로 재시도한다', async () => {
    const play = vi
      .spyOn(window.HTMLMediaElement.prototype, 'play')
      .mockRejectedValueOnce(new DOMException('blocked', 'NotAllowedError'))
      .mockResolvedValue(undefined);

    const { container } = render(
      <VideoMission
        source="/tutorial/guide.mp4"
        content="가이드"
        canContinue
        minimumWatchSeconds={0}
        onTimeUpdate={vi.fn()}
      />
    );

    const video = container.querySelector('video');
    await vi.waitFor(() => {
      expect(play).toHaveBeenCalledTimes(2);
      expect(video?.muted).toBe(true);
    });

    play.mockRestore();
  });

  it('최소 시청 시간이 있는 placeholder의 경과 시간을 매초 알린다', () => {
    vi.useFakeTimers();
    const onTimeUpdate = vi.fn();

    render(
      <VideoMission
        content="가이드"
        canContinue={false}
        minimumWatchSeconds={30}
        onTimeUpdate={onTimeUpdate}
      />
    );

    act(() => vi.advanceTimersByTime(1_000));
    expect(onTimeUpdate).toHaveBeenLastCalledWith(1);

    act(() => vi.advanceTimersByTime(29_000));
    expect(onTimeUpdate).toHaveBeenLastCalledWith(30);
    expect(onTimeUpdate).toHaveBeenCalledTimes(30);
  });

  it('placeholder를 닫았다 다시 열면 카운트다운을 1초부터 다시 시작한다', () => {
    vi.useFakeTimers();
    const firstRun = vi.fn();
    const firstModal = render(
      <VideoMission
        content="가이드"
        canContinue={false}
        minimumWatchSeconds={30}
        onTimeUpdate={firstRun}
      />
    );

    act(() => vi.advanceTimersByTime(5_000));
    expect(firstRun).toHaveBeenLastCalledWith(5);
    firstModal.unmount();

    const secondRun = vi.fn();
    render(
      <VideoMission
        content="가이드"
        canContinue={false}
        minimumWatchSeconds={30}
        onTimeUpdate={secondRun}
      />
    );

    act(() => vi.advanceTimersByTime(1_000));
    expect(secondRun).toHaveBeenLastCalledWith(1);
    expect(secondRun).toHaveBeenCalledTimes(1);
  });
});

describe('ExampleMission', () => {
  it('가상 내담자 데이터가 준비되기 전에는 예시 이동을 막는다', () => {
    render(
      <ExampleMission
        content="예시를 확인해보세요."
        disabled
        onOpenExample={vi.fn()}
      />
    );

    expect(
      screen.getByRole('button', { name: '예시 보러가기' })
    ).toBeDisabled();
  });
});

describe('NoteMission', () => {
  it('선택 테두리를 카드 내부에 표시한다', () => {
    render(
      <NoteMission
        cohort="GENERIC"
        templates={[
          {
            id: 1,
            title: '마음토스 상담노트',
            description: '기본 상담노트입니다.',
          },
        ]}
        selectedTemplateId={1}
        isLoading={false}
        onSelect={vi.fn()}
      />
    );

    expect(
      screen.getByRole('button', { name: /마음토스 상담노트/ })
    ).toHaveClass('ring-inset');
  });

  it('기본 상담노트 양식을 미선택 상태로 표시한다', () => {
    render(
      <NoteMission
        cohort="GENERIC"
        templates={[
          {
            id: 1,
            title: '마음토스 상담노트',
            description: '기본 상담노트입니다.',
          },
        ]}
        selectedTemplateId={null}
        isLoading={false}
        onSelect={vi.fn()}
      />
    );

    expect(
      screen.getByRole('button', { name: /마음토스 상담노트/ })
    ).toHaveAttribute('aria-pressed', 'false');
    expect(
      screen.queryByText('나의 상담노트 양식 선택하기')
    ).not.toBeInTheDocument();
    expect(screen.getByTestId('tutorial-note-template-container')).toHaveClass(
      'flex',
      'min-h-0',
      'overflow-hidden'
    );
    expect(screen.getByTestId('tutorial-note-template-list')).toHaveClass(
      'min-h-0',
      'flex-1',
      'overflow-y-auto'
    );
  });
});

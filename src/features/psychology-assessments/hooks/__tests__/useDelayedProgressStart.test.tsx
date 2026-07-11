import { act, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { useDelayedProgressStart } from '../useDelayedProgressStart';

const ProgressProbe = ({ value }: { value: number }) => (
  <span>{useDelayedProgressStart(value)}</span>
);

describe('useDelayedProgressStart', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('holds progress at 0% for the initial 0.5 seconds', () => {
    vi.useFakeTimers();

    render(<ProgressProbe value={37} />);

    expect(screen.getByText('0')).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(499);
    });
    expect(screen.getByText('0')).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(1);
    });
    expect(screen.getByText('37')).toBeInTheDocument();
  });
});

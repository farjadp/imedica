import { act, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { Timer } from './Timer.js';

describe('Timer', () => {
  it('renders the formatted time', () => {
    render(<Timer seconds={125} isRunning={false} />);

    expect(screen.getByRole('timer')).toHaveTextContent('2:05');
  });

  it('calls onComplete when countdown reaches zero', () => {
    vi.useFakeTimers();
    const onComplete = vi.fn();

    render(<Timer seconds={1} isRunning={true} onComplete={onComplete} />);

    act(() => {
      vi.advanceTimersByTime(1000);
    });

    expect(onComplete).toHaveBeenCalledTimes(1);
    vi.useRealTimers();
  });
});

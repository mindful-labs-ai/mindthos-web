import type { Meta, StoryObj } from '@storybook/react';

import { Remain } from './Remain';

const meta = {
  title: 'Composites/Remain',
  component: Remain,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof Remain>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    endTime: new Date(Date.now() + 60 * 60 * 1000), // 1 hour from now
  },
};

export const ShortFormat: Story = {
  args: {
    endTime: new Date(Date.now() + 2 * 60 * 60 * 1000), // 2 hours from now
    format: 'short',
  },
};

export const MinimalFormat: Story = {
  args: {
    endTime: new Date(Date.now() + 45 * 60 * 1000), // 45 minutes from now
    format: 'minimal',
  },
};

export const DifferentDurations: Story = {
  render: () => {
    const now = Date.now();
    return (
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-3">
          <span className="w-32 text-sm text-fg-muted">30 seconds:</span>
          <Remain endTime={new Date(now + 30 * 1000)} format="short" />
        </div>
        <div className="flex items-center gap-3">
          <span className="w-32 text-sm text-fg-muted">5 minutes:</span>
          <Remain endTime={new Date(now + 5 * 60 * 1000)} format="short" />
        </div>
        <div className="flex items-center gap-3">
          <span className="w-32 text-sm text-fg-muted">1 hour:</span>
          <Remain endTime={new Date(now + 60 * 60 * 1000)} format="short" />
        </div>
        <div className="flex items-center gap-3">
          <span className="w-32 text-sm text-fg-muted">1 day:</span>
          <Remain
            endTime={new Date(now + 24 * 60 * 60 * 1000)}
            format="short"
          />
        </div>
      </div>
    );
  },
};

export const AutoTone: Story = {
  render: () => {
    const now = Date.now();
    return (
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-1">
          <span className="text-xs text-fg-muted">Neutral (1 hour left)</span>
          <Remain endTime={new Date(now + 60 * 60 * 1000)} format="short" />
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-xs text-fg-muted">
            Warning (20 minutes left)
          </span>
          <Remain endTime={new Date(now + 20 * 60 * 1000)} format="short" />
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-xs text-fg-muted">Danger (3 minutes left)</span>
          <Remain endTime={new Date(now + 3 * 60 * 1000)} format="short" />
        </div>
      </div>
    );
  },
};

export const ManualTone: Story = {
  render: () => (
    <div className="flex flex-col gap-4">
      <Remain
        endTime={new Date(Date.now() + 60 * 60 * 1000)}
        tone="neutral"
        format="short"
      />
      <Remain
        endTime={new Date(Date.now() + 60 * 60 * 1000)}
        tone="warn"
        format="short"
      />
      <Remain
        endTime={new Date(Date.now() + 60 * 60 * 1000)}
        tone="danger"
        format="short"
      />
    </div>
  ),
};

export const WithoutIcon: Story = {
  args: {
    endTime: new Date(Date.now() + 30 * 60 * 1000),
    format: 'short',
    icon: null,
  },
};

export const CustomIcon: Story = {
  args: {
    endTime: new Date(Date.now() + 45 * 60 * 1000),
    format: 'short',
    icon: (
      <svg
        className="h-4 w-4"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
        />
      </svg>
    ),
  },
};

export const WithCallback: Story = {
  args: {
    endTime: new Date(Date.now() + 5 * 1000), // 5 seconds
    format: 'short',
    onEnd: () => {
      alert('Countdown ended!');
    },
  },
};

export const InContext: Story = {
  render: () => {
    const now = Date.now();
    return (
      <div className="w-[400px] space-y-4">
        <div className="rounded-lg border-2 border-border bg-surface p-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-fg">Flash Sale</h3>
            <Remain
              endTime={new Date(now + 2 * 60 * 60 * 1000)}
              format="short"
            />
          </div>
          <p className="mt-2 text-sm text-fg-muted">
            Get 50% off on selected items. Hurry up!
          </p>
        </div>

        <div className="border-warn/20 bg-warn/10 rounded-lg border-2 p-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-warn">Session Timeout</h3>
            <Remain
              endTime={new Date(now + 5 * 60 * 1000)}
              format="minimal"
              tone="warn"
            />
          </div>
          <p className="mt-2 text-sm text-fg-muted">
            Your session will expire soon. Please save your work.
          </p>
        </div>
      </div>
    );
  },
};

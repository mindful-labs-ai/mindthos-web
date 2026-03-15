import type { Meta, StoryObj } from '@storybook/react';

import { TimeStamp } from './TimeStamp';

const meta = {
  title: 'Composites/TimeStamp',
  component: TimeStamp,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof TimeStamp>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    value: new Date(),
  },
};

export const Relative: Story = {
  args: {
    value: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
    relative: true,
  },
};

export const RelativeTimes: Story = {
  render: () => {
    const now = Date.now();
    return (
      <div className="flex flex-col gap-2">
        <TimeStamp value={new Date(now - 30 * 1000)} relative />
        <TimeStamp value={new Date(now - 5 * 60 * 1000)} relative />
        <TimeStamp value={new Date(now - 2 * 60 * 60 * 1000)} relative />
        <TimeStamp value={new Date(now - 3 * 24 * 60 * 60 * 1000)} relative />
        <TimeStamp value={new Date(now - 14 * 24 * 60 * 60 * 1000)} relative />
        <TimeStamp value={new Date(now - 60 * 24 * 60 * 60 * 1000)} relative />
      </div>
    );
  },
};

export const WithFormat: Story = {
  args: {
    value: new Date(),
    format: 'custom',
  },
};

export const FromString: Story = {
  args: {
    value: '2024-01-15T10:30:00Z',
  },
};

export const FromTimestamp: Story = {
  args: {
    value: Date.now(),
    relative: true,
  },
};

export const InContext: Story = {
  render: () => (
    <div className="flex flex-col gap-3 rounded-lg border-2 border-border bg-surface p-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-fg">Comment</h3>
        <TimeStamp value={new Date(Date.now() - 3 * 60 * 60 * 1000)} relative />
      </div>
      <p className="text-sm text-fg-muted">
        This is a sample comment showing how TimeStamp can be used in a real
        context.
      </p>
    </div>
  ),
};

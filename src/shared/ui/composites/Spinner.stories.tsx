import type { Meta, StoryObj } from '@storybook/react';

import { Spinner } from './Spinner';

const meta = {
  title: 'Composites/Spinner',
  component: Spinner,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof Spinner>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {},
};

export const Sizes: Story = {
  render: () => (
    <div className="flex items-center gap-8">
      <Spinner size="sm" />
      <Spinner size="md" />
      <Spinner size="lg" />
    </div>
  ),
};

export const CustomLabel: Story = {
  args: {
    ariaLabel: 'Loading your content',
  },
};

export const InContext: Story = {
  render: () => (
    <div className="flex flex-col items-center gap-4 rounded-lg border-2 border-border bg-surface p-8">
      <Spinner size="lg" />
      <p className="text-sm text-fg-muted">Loading your data...</p>
    </div>
  ),
};

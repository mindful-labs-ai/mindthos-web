import type { Meta, StoryObj } from '@storybook/react';

import { ProgressCircle } from './ProgressCircle';

const meta = {
  title: 'Atoms/ProgressCircle',
  component: ProgressCircle,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof ProgressCircle>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    value: 50,
  },
};

export const WithLabel: Story = {
  args: {
    value: 75,
    label: 'Processing',
  },
};

export const Indeterminate: Story = {
  args: {
    value: 0,
    indeterminate: true,
    label: 'Loading...',
  },
};

export const Sizes: Story = {
  render: () => (
    <div className="flex items-center gap-8">
      <ProgressCircle value={50} size={32} strokeWidth={3} />
      <ProgressCircle value={50} size={48} strokeWidth={4} />
      <ProgressCircle value={50} size={64} strokeWidth={5} />
      <ProgressCircle value={50} size={80} strokeWidth={6} />
    </div>
  ),
};

export const DifferentValues: Story = {
  render: () => (
    <div className="flex items-center gap-8">
      <ProgressCircle value={0} />
      <ProgressCircle value={25} />
      <ProgressCircle value={50} />
      <ProgressCircle value={75} />
      <ProgressCircle value={100} />
    </div>
  ),
};

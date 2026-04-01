import type { Meta, StoryObj } from '@storybook/react';

import { ProgressBar } from './ProgressBar';

const meta = {
  title: 'Atoms/ProgressBar',
  component: ProgressBar,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof ProgressBar>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    value: 50,
  },
  render: (args) => (
    <div className="w-[400px]">
      <ProgressBar {...args} />
    </div>
  ),
};

export const WithLabel: Story = {
  args: {
    value: 75,
    label: 'Upload progress',
  },
  render: (args) => (
    <div className="w-[400px]">
      <ProgressBar {...args} />
    </div>
  ),
};

export const Indeterminate: Story = {
  args: {
    value: 0,
    indeterminate: true,
    label: 'Loading...',
  },
  render: (args) => (
    <div className="w-[400px]">
      <ProgressBar {...args} />
    </div>
  ),
};

export const DifferentValues: Story = {
  render: () => (
    <div className="flex w-[400px] flex-col gap-6">
      <ProgressBar value={0} label="0%" />
      <ProgressBar value={25} label="25%" />
      <ProgressBar value={50} label="50%" />
      <ProgressBar value={75} label="75%" />
      <ProgressBar value={100} label="100%" />
    </div>
  ),
};

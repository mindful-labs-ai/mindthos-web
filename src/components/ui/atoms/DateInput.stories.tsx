import type { Meta, StoryObj } from '@storybook/react';

import { DateInput } from './DateInput';

const meta = {
  title: 'Atoms/DateInput',
  component: DateInput,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof DateInput>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {},
  render: (args) => (
    <div className="w-[300px]">
      <DateInput {...args} />
    </div>
  ),
};

export const WithValue: Story = {
  args: {
    defaultValue: '2024-01-15',
  },
  render: (args) => (
    <div className="w-[300px]">
      <DateInput {...args} />
    </div>
  ),
};

export const WithMinMax: Story = {
  args: {
    min: '2024-01-01',
    max: '2024-12-31',
    defaultValue: '2024-06-15',
  },
  render: (args) => (
    <div className="w-[300px]">
      <DateInput {...args} />
    </div>
  ),
};

export const Sizes: Story = {
  render: () => (
    <div className="flex flex-col gap-4 w-[300px]">
      <DateInput size="sm" />
      <DateInput size="md" />
      <DateInput size="lg" />
    </div>
  ),
};

export const Disabled: Story = {
  args: {
    disabled: true,
    defaultValue: '2024-01-15',
  },
  render: (args) => (
    <div className="w-[300px]">
      <DateInput {...args} />
    </div>
  ),
};

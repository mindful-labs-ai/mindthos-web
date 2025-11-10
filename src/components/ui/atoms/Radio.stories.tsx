import { useState } from 'react';

import type { Meta, StoryObj } from '@storybook/react';

import { Radio } from './Radio';

const meta = {
  title: 'Atoms/Radio',
  component: Radio,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof Radio>;

export default meta;
type Story = StoryObj<typeof meta>;

const options = [
  { value: '1', label: 'Option 1' },
  { value: '2', label: 'Option 2' },
  { value: '3', label: 'Option 3' },
  { value: '4', label: 'Option 4', disabled: true },
];

const optionsWithDesc = [
  { value: 'standard', label: 'Standard', description: 'Free forever' },
  { value: 'pro', label: 'Pro', description: '$10/month' },
  { value: 'enterprise', label: 'Enterprise', description: 'Contact sales' },
];

export const Default: Story = {
  args: {
    options,
    defaultValue: '1',
  },
};

export const Horizontal: Story = {
  args: {
    options,
    orientation: 'horizontal',
    defaultValue: '1',
  },
};

export const Sizes: Story = {
  render: () => (
    <div className="flex flex-col gap-6">
      <Radio options={options} size="sm" defaultValue="1" />
      <Radio options={options} size="md" defaultValue="1" />
      <Radio options={options} size="lg" defaultValue="1" />
    </div>
  ),
};

export const WithDescriptions: Story = {
  args: {
    options: optionsWithDesc,
    defaultValue: 'standard',
  },
  render: (args) => (
    <div className="w-[300px]">
      <Radio {...args} />
    </div>
  ),
};

export const Disabled: Story = {
  args: {
    options,
    disabled: true,
    defaultValue: '1',
  },
};

export const Controlled: Story = {
  render: () => {
    const Component = () => {
      const [value, setValue] = useState('1');
      return (
        <div className="flex flex-col gap-4">
          <Radio options={options} value={value} onChange={setValue} />
          <p className="text-sm text-fg-muted">Selected: {value}</p>
          <button
            onClick={() => setValue('2')}
            className="rounded-lg bg-primary px-4 py-2 text-sm text-surface"
          >
            Select Option 2
          </button>
        </div>
      );
    };
    return <Component />;
  },
};

export const HorizontalWithDescriptions: Story = {
  args: {
    options: optionsWithDesc,
    orientation: 'horizontal',
    defaultValue: 'pro',
  },
  render: (args) => (
    <div className="w-[600px]">
      <Radio {...args} />
    </div>
  ),
};

export const InContext: Story = {
  render: () => {
    const Component = () => {
      const [plan, setPlan] = useState('standard');
      return (
        <div className="w-[400px] rounded-lg border-2 border-border bg-surface p-6">
          <h3 className="mb-4 text-lg font-semibold text-fg">Choose your plan</h3>
          <Radio
            options={optionsWithDesc}
            value={plan}
            onChange={setPlan}
            size="md"
          />
          <button className="mt-6 w-full rounded-lg bg-primary px-4 py-2 text-sm font-medium text-surface hover:opacity-90">
            Continue with {plan.charAt(0).toUpperCase() + plan.slice(1)}
          </button>
        </div>
      );
    };
    return <Component />;
  },
};

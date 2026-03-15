import { useState } from 'react';

import type { Meta, StoryObj } from '@storybook/react';

import { CheckBox } from './CheckBox';

const meta = {
  title: 'Atoms/CheckBox',
  component: CheckBox,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof CheckBox>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    label: 'Accept terms and conditions',
  },
};

export const WithDescription: Story = {
  args: {
    label: 'Marketing emails',
    description: 'Receive promotional emails and updates',
  },
};

export const Indeterminate: Story = {
  args: {
    indeterminate: true,
    label: 'Select all',
  },
};

export const Sizes: Story = {
  render: () => (
    <div className="flex flex-col gap-4">
      <CheckBox size="sm" label="Small" />
      <CheckBox size="md" label="Medium" />
      <CheckBox size="lg" label="Large" />
    </div>
  ),
};

export const Tones: Story = {
  render: () => (
    <div className="flex flex-col gap-4">
      <CheckBox tone="primary" label="Primary" defaultChecked />
      <CheckBox tone="secondary" label="Secondary" defaultChecked />
      <CheckBox tone="accent" label="Accent" defaultChecked />
      <CheckBox tone="neutral" label="Neutral" defaultChecked />
    </div>
  ),
};

export const Controlled: Story = {
  render: () => {
    const Component = () => {
      const [checked, setChecked] = useState(false);
      return (
        <div className="flex flex-col gap-2">
          <CheckBox
            checked={checked}
            onChange={(e) => setChecked(e.target.checked)}
            label="Controlled checkbox"
          />
          <p className="text-sm text-fg-muted">
            Status: {checked ? 'Checked' : 'Unchecked'}
          </p>
        </div>
      );
    };
    return <Component />;
  },
};

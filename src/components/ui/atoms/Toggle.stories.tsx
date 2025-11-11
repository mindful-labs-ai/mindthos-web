import { useState } from 'react';

import type { Meta, StoryObj } from '@storybook/react';

import { Toggle } from './Toggle';

const meta = {
  title: 'Atoms/Toggle',
  component: Toggle,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof Toggle>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Checked: Story = {
  args: {
    defaultChecked: true,
  },
};

export const Sizes: Story = {
  render: () => (
    <div className="flex items-center gap-4">
      <Toggle size="sm" />
      <Toggle size="md" />
      <Toggle size="lg" />
    </div>
  ),
};

export const Disabled: Story = {
  args: {
    disabled: true,
  },
};

export const Controlled: Story = {
  render: () => {
    const Component = () => {
      const [enabled, setEnabled] = useState(false);
      return (
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-3">
            <Toggle checked={enabled} onChange={setEnabled} />
            <span className="text-sm">{enabled ? 'Enabled' : 'Disabled'}</span>
          </div>
        </div>
      );
    };
    return <Component />;
  },
};

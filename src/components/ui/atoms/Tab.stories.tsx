import { useState } from 'react';

import type { Meta, StoryObj } from '@storybook/react';

import { Tab } from './Tab';

const items = [
  { value: 'tab1', label: 'First Tab' },
  { value: 'tab2', label: 'Second Tab' },
  { value: 'tab3', label: 'Third Tab' },
  { value: 'tab4', label: 'Disabled', disabled: true },
];

const meta = {
  title: 'Atoms/Tab',
  component: Tab,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof Tab>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    items,
    defaultValue: 'tab1',
  },
};

export const Sizes: Story = {
  render: () => (
    <div className="flex flex-col gap-4">
      <Tab items={items} size="sm" defaultValue="tab1" />
      <Tab items={items} size="md" defaultValue="tab1" />
      <Tab items={items} size="lg" defaultValue="tab1" />
    </div>
  ),
};

export const Controlled: Story = {
  render: () => {
    const Component = () => {
      const [value, setValue] = useState('tab1');
      return (
        <div className="flex flex-col gap-4">
          <Tab items={items} value={value} onValueChange={setValue} />
          <p className="text-sm text-fg-muted">Selected: {value}</p>
        </div>
      );
    };
    return <Component />;
  },
};

export const WithContent: Story = {
  render: () => {
    const Component = () => {
      const [value, setValue] = useState('tab1');
      return (
        <div className="flex flex-col gap-4">
          <Tab items={items} value={value} onValueChange={setValue} />
          <div className="rounded-md border-2 border-border p-4">
            {value === 'tab1' && <p>Content for First Tab</p>}
            {value === 'tab2' && <p>Content for Second Tab</p>}
            {value === 'tab3' && <p>Content for Third Tab</p>}
          </div>
        </div>
      );
    };
    return <Component />;
  },
};

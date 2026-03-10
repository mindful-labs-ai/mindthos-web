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
  args: {
    items,
  },
  render: () => (
    <div className="flex flex-col gap-4">
      <Tab items={items} size="sm" defaultValue="tab1" />
      <Tab items={items} size="md" defaultValue="tab1" />
      <Tab items={items} size="lg" defaultValue="tab1" />
    </div>
  ),
};

export const Controlled: Story = {
  args: {
    items,
  },
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
  args: {
    items,
  },
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

export const UnderlineVariant: Story = {
  args: {
    items,
    defaultValue: 'tab1',
    variant: 'underline',
  },
};

export const UnderlineSizes: Story = {
  args: {
    items,
  },
  render: () => (
    <div className="flex flex-col gap-8">
      <div className="space-y-2">
        <p className="text-sm text-fg-muted">Small</p>
        <div className="border-b border-border">
          <Tab
            items={items}
            size="sm"
            variant="underline"
            defaultValue="tab1"
          />
        </div>
      </div>
      <div className="space-y-2">
        <p className="text-sm text-fg-muted">Medium</p>
        <div className="border-b border-border">
          <Tab
            items={items}
            size="md"
            variant="underline"
            defaultValue="tab1"
          />
        </div>
      </div>
      <div className="space-y-2">
        <p className="text-sm text-fg-muted">Large</p>
        <div className="border-b border-border">
          <Tab
            items={items}
            size="lg"
            variant="underline"
            defaultValue="tab1"
          />
        </div>
      </div>
    </div>
  ),
};

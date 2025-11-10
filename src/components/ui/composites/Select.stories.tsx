import { useState } from 'react';

import type { Meta, StoryObj } from '@storybook/react';

import { Select } from './Select';

const meta = {
  title: 'Composites/Select',
  component: Select,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof Select>;

export default meta;
type Story = StoryObj<typeof meta>;

const items = [
  { value: '1', label: 'Option 1' },
  { value: '2', label: 'Option 2' },
  { value: '3', label: 'Option 3' },
  { value: '4', label: 'Option 4', disabled: true },
];

export const Single: Story = {
  args: {
    items,
    placeholder: 'Select an option',
  },
  render: (args) => (
    <div className="w-[300px]">
      <Select {...args} />
    </div>
  ),
};

export const Multiple: Story = {
  args: {
    items,
    multiple: true,
    placeholder: 'Select options',
  },
  render: (args) => (
    <div className="w-[300px]">
      <Select {...args} />
    </div>
  ),
};

export const ControlledSingle: Story = {
  render: () => {
    const Component = () => {
      const [value, setValue] = useState('');
      return (
        <div className="w-[300px] space-y-4">
          <Select items={items} value={value} onChange={(v) => setValue(v as string)} />
          <p className="text-sm text-fg-muted">Selected: {value || 'None'}</p>
        </div>
      );
    };
    return <Component />;
  },
};

export const ControlledMultiple: Story = {
  render: () => {
    const Component = () => {
      const [values, setValues] = useState<string[]>([]);
      return (
        <div className="w-[300px] space-y-4">
          <Select
            items={items}
            multiple
            value={values}
            onChange={(v) => setValues(v as string[])}
          />
          <p className="text-sm text-fg-muted">
            Selected: {values.length > 0 ? values.join(', ') : 'None'}
          </p>
        </div>
      );
    };
    return <Component />;
  },
};

export const Disabled: Story = {
  args: {
    items,
    disabled: true,
    defaultValue: '1',
  },
  render: (args) => (
    <div className="w-[300px]">
      <Select {...args} />
    </div>
  ),
};

export const ManyItems: Story = {
  render: () => {
    const manyItems = Array.from({ length: 20 }, (_, i) => ({
      value: String(i + 1),
      label: `Option ${i + 1}`,
    }));
    return (
      <div className="w-[300px]">
        <Select items={manyItems} placeholder="Select from many options" />
      </div>
    );
  },
};

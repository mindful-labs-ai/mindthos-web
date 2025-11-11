import type { Meta, StoryObj } from '@storybook/react';

import { List } from './List';

const meta = {
  title: 'Composites/List',
  component: List,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof List>;

export default meta;
type Story = StoryObj<typeof meta>;

const items = [
  'First item in the list',
  'Second item with more content',
  'Third item to demonstrate',
  'Fourth item for completeness',
];

export const Unordered: Story = {
  args: {
    items,
  },
  render: (args) => (
    <div className="w-[400px]">
      <List {...args} />
    </div>
  ),
};

export const Ordered: Story = {
  args: {
    items,
    ordered: true,
  },
  render: (args) => (
    <div className="w-[400px]">
      <List {...args} />
    </div>
  ),
};

export const WithComponents: Story = {
  render: () => (
    <div className="w-[400px]">
      <List
        items={[
          <strong key="1">Bold first item</strong>,
          <em key="2">Italic second item</em>,
          <span key="3" className="text-primary">
            Colored third item
          </span>,
        ]}
      />
    </div>
  ),
};

export const LongContent: Story = {
  args: {
    items: [
      'This is a much longer item that demonstrates how the list handles longer content that might wrap to multiple lines.',
      'Another item with extended content to show the spacing and layout behavior.',
      'Short item',
      'Yet another longer item that provides additional context about how this component works in practice.',
    ],
  },
  render: (args) => (
    <div className="w-[400px]">
      <List {...args} />
    </div>
  ),
};

import type { Meta, StoryObj } from '@storybook/react';

import { Text } from './Text';

const meta = {
  title: 'Atoms/Text',
  component: Text,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof Text>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    children: 'This is regular text',
  },
};

export const Muted: Story = {
  args: {
    muted: true,
    children: 'This is muted text',
  },
};

export const Truncated: Story = {
  args: {
    truncate: true,
    children:
      'This is a very long text that will be truncated with an ellipsis when it exceeds the maximum width',
    className: 'max-w-[200px]',
  },
};

export const AsSpan: Story = {
  args: {
    as: 'span',
    children: 'This is inline span text',
  },
};

export const AsDiv: Story = {
  args: {
    as: 'div',
    children: 'This is a div text',
  },
};

export const AllVariants: Story = {
  render: () => (
    <div className="flex flex-col gap-2">
      <Text>Regular paragraph text</Text>
      <Text muted>Muted text</Text>
      <Text as="span">Inline span text</Text>
      <Text truncate className="max-w-xs">
        Very long text that will be truncated: Lorem ipsum dolor sit amet
        consectetur adipisicing elit
      </Text>
    </div>
  ),
};

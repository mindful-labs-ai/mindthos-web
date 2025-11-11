import type { Meta, StoryObj } from '@storybook/react';

import { Title } from './Title';

const meta = {
  title: 'Atoms/Title',
  component: Title,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof Title>;

export default meta;
type Story = StoryObj<typeof meta>;

export const H1: Story = {
  args: {
    as: 'h1',
    children: 'This is H1 Title',
  },
};

export const H2: Story = {
  args: {
    as: 'h2',
    children: 'This is H2 Title',
  },
};

export const H3: Story = {
  args: {
    as: 'h3',
    children: 'This is H3 Title',
  },
};

export const H4: Story = {
  args: {
    as: 'h4',
    children: 'This is H4 Title',
  },
};

export const AllLevels: Story = {
  render: () => (
    <div className="flex flex-col gap-4">
      <Title as="h1">Heading 1</Title>
      <Title as="h2">Heading 2</Title>
      <Title as="h3">Heading 3</Title>
      <Title as="h4">Heading 4</Title>
    </div>
  ),
};

export const WithCustomClass: Story = {
  args: {
    as: 'h2',
    children: 'Custom Colored Title',
    className: 'text-primary',
  },
};

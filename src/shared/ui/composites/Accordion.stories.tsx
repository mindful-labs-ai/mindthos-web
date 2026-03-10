import type { Meta, StoryObj } from '@storybook/react';

import { Accordion } from './Accordion';

const items = [
  {
    value: '1',
    header: 'What is React?',
    content:
      'React is a JavaScript library for building user interfaces. It lets you compose complex UIs from small and isolated pieces of code called components.',
  },
  {
    value: '2',
    header: 'What is TypeScript?',
    content:
      'TypeScript is a strongly typed programming language that builds on JavaScript, giving you better tooling at any scale.',
  },
  {
    value: '3',
    header: 'What is Tailwind CSS?',
    content:
      'Tailwind CSS is a utility-first CSS framework that provides low-level utility classes to build custom designs.',
  },
  {
    value: '4',
    header: 'Disabled Item',
    content: 'This content is not accessible.',
    disabled: true,
  },
];

const meta = {
  title: 'Composites/Accordion',
  component: Accordion,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof Accordion>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Single: Story = {
  args: {
    type: 'single',
    items,
    defaultValue: '1',
  },
  render: (args) => (
    <div className="w-[500px]">
      <Accordion {...args} />
    </div>
  ),
};

export const Multiple: Story = {
  args: {
    type: 'multiple',
    items,
    defaultValue: ['1', '2'],
  },
  render: (args) => (
    <div className="w-[500px]">
      <Accordion {...args} />
    </div>
  ),
};

export const AllClosed: Story = {
  args: {
    type: 'single',
    items,
  },
  render: (args) => (
    <div className="w-[500px]">
      <Accordion {...args} />
    </div>
  ),
};

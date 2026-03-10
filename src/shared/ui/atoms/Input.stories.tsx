import type { Meta, StoryObj } from '@storybook/react';

import { Input } from './Input';

const meta = {
  title: 'Atoms/Input',
  component: Input,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg', 'free'],
    },
    variant: {
      control: 'select',
      options: ['solid', 'outline', 'ghost', 'soft'],
    },
    tone: {
      control: 'select',
      options: ['primary', 'secondary', 'accent', 'neutral'],
    },
    error: {
      control: 'boolean',
    },
  },
} satisfies Meta<typeof Input>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    placeholder: 'Enter text...',
  },
};

export const WithPrefixSuffix: Story = {
  render: () => (
    <div className="flex min-w-[300px] flex-col gap-4">
      <Input prefix={<span>🔍</span>} placeholder="Search..." />
      <Input suffix={<span>@example.com</span>} placeholder="username" />
      <Input
        prefix={<span>$</span>}
        suffix={<span>.00</span>}
        placeholder="0"
      />
    </div>
  ),
};

export const Sizes: Story = {
  render: () => (
    <div className="flex min-w-[300px] flex-col gap-4">
      <Input size="sm" placeholder="Small" />
      <Input size="md" placeholder="Medium" />
      <Input size="lg" placeholder="Large" />
    </div>
  ),
};

export const Variants: Story = {
  render: () => (
    <div className="flex min-w-[300px] flex-col gap-4">
      <Input variant="solid" placeholder="Solid" />
      <Input variant="outline" placeholder="Outline" />
      <Input variant="ghost" placeholder="Ghost" />
      <Input variant="soft" placeholder="Soft" />
    </div>
  ),
};

export const ErrorState: Story = {
  args: {
    error: true,
    placeholder: 'Invalid input',
    'aria-describedby': 'error-message',
  },
};

export const Disabled: Story = {
  args: {
    disabled: true,
    placeholder: 'Disabled',
  },
};

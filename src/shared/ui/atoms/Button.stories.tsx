import type { Meta, StoryObj } from '@storybook/react';
import { expect, userEvent, within } from '@storybook/test';

import { Button } from './Button';

const meta = {
  title: 'Atoms/Button',
  component: Button,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['solid', 'outline', 'ghost', 'soft'],
      description: 'Visual style variant',
    },
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg', 'free'],
      description: 'Button size',
    },
    tone: {
      control: 'select',
      options: ['primary', 'secondary', 'accent', 'neutral'],
      description: 'Color tone',
    },
    loading: {
      control: 'boolean',
      description: 'Shows loading spinner',
    },
    disabled: {
      control: 'boolean',
      description: 'Disables the button',
    },
  },
  args: {
    children: 'Button',
  },
} satisfies Meta<typeof Button>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Primary: Story = {
  args: {
    tone: 'primary',
    variant: 'solid',
  },
};

export const Secondary: Story = {
  args: {
    tone: 'secondary',
    variant: 'solid',
  },
};

export const Accent: Story = {
  args: {
    tone: 'accent',
    variant: 'solid',
  },
};

export const AllVariants: Story = {
  render: () => (
    <div className="flex flex-col gap-4">
      <div className="flex gap-4">
        <Button variant="solid" tone="primary">
          Solid
        </Button>
        <Button variant="outline" tone="primary">
          Outline
        </Button>
        <Button variant="ghost" tone="primary">
          Ghost
        </Button>
        <Button variant="soft" tone="primary">
          Soft
        </Button>
      </div>
    </div>
  ),
};

export const AllTones: Story = {
  render: () => (
    <div className="flex flex-col gap-4">
      {(['primary', 'secondary', 'accent', 'neutral'] as const).map((tone) => (
        <div key={tone} className="flex gap-4">
          <Button tone={tone} variant="solid">
            {tone}
          </Button>
          <Button tone={tone} variant="outline">
            {tone}
          </Button>
          <Button tone={tone} variant="ghost">
            {tone}
          </Button>
          <Button tone={tone} variant="soft">
            {tone}
          </Button>
        </div>
      ))}
    </div>
  ),
};

export const AllSizes: Story = {
  render: () => (
    <div className="flex items-center gap-4">
      <Button size="sm">Small</Button>
      <Button size="md">Medium</Button>
      <Button size="lg">Large</Button>
    </div>
  ),
};

export const WithIcons: Story = {
  render: () => (
    <div className="flex gap-4">
      <Button icon={<span>🔍</span>}>Search</Button>
      <Button iconRight={<span>→</span>}>Next</Button>
      <Button icon={<span>←</span>} iconRight={<span>→</span>}>
        Both
      </Button>
    </div>
  ),
};

export const Loading: Story = {
  args: {
    loading: true,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const button = canvas.getByRole('button');
    await expect(button).toHaveAttribute('aria-busy', 'true');
    await expect(button).toBeDisabled();
  },
};

export const Disabled: Story = {
  args: {
    disabled: true,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const button = canvas.getByRole('button');
    await expect(button).toBeDisabled();
  },
};

export const KeyboardAccessible: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const button = canvas.getByRole('button');
    button.focus();
    await expect(button).toHaveFocus();
    await userEvent.keyboard('{Enter}');
  },
};

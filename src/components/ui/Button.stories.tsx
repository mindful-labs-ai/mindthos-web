import type { Meta, StoryObj } from '@storybook/react';
import { expect, userEvent, within } from '@storybook/test';

import { Button } from './Button';

const meta = {
  title: 'UI/Button',
  component: Button,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['solid', 'outline', 'ghost'],
      description: 'Visual style variant',
    },
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg'],
      description: 'Button size',
    },
    isLoading: {
      control: 'boolean',
      description: 'Shows loading spinner',
    },
    disabled: {
      control: 'boolean',
      description: 'Disables the button',
    },
    children: {
      control: 'text',
      description: 'Button content',
    },
  },
  args: {
    children: 'Button',
  },
} satisfies Meta<typeof Button>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Solid: Story = {
  args: {
    variant: 'solid',
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const button = canvas.getByRole('button');

    // Verify button is visible and has correct classes
    await expect(button).toBeVisible();
    await expect(button).toHaveClass('bg-primary-500');

    // Test click interaction
    await userEvent.click(button);
  },
};

export const Outline: Story = {
  args: {
    variant: 'outline',
  },
};

export const Ghost: Story = {
  args: {
    variant: 'ghost',
  },
};

export const Small: Story = {
  args: {
    size: 'sm',
    variant: 'solid',
  },
};

export const Medium: Story = {
  args: {
    size: 'md',
    variant: 'solid',
  },
};

export const Large: Story = {
  args: {
    size: 'lg',
    variant: 'solid',
  },
};

export const Disabled: Story = {
  args: {
    disabled: true,
    variant: 'solid',
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const button = canvas.getByRole('button');

    // Verify button is disabled
    await expect(button).toBeDisabled();
    await expect(button).toHaveAttribute('aria-disabled', 'true');
  },
};

export const Loading: Story = {
  args: {
    isLoading: true,
    variant: 'solid',
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const button = canvas.getByRole('button');

    // Verify loading state
    await expect(button).toHaveAttribute('aria-busy', 'true');
    await expect(button).toBeDisabled();

    // Verify spinner is present
    const spinner = button.querySelector('svg');
    await expect(spinner).toBeInTheDocument();
  },
};

export const AllVariants: Story = {
  render: () => (
    <div className="flex flex-col gap-4">
      <div className="flex gap-4">
        <Button variant="solid">Solid</Button>
        <Button variant="outline">Outline</Button>
        <Button variant="ghost">Ghost</Button>
      </div>
      <div className="flex gap-4">
        <Button variant="solid" disabled>
          Disabled
        </Button>
        <Button variant="outline" disabled>
          Disabled
        </Button>
        <Button variant="ghost" disabled>
          Disabled
        </Button>
      </div>
      <div className="flex gap-4">
        <Button variant="solid" isLoading>
          Loading
        </Button>
        <Button variant="outline" isLoading>
          Loading
        </Button>
        <Button variant="ghost" isLoading>
          Loading
        </Button>
      </div>
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

export const KeyboardAccessible: Story = {
  args: {
    variant: 'solid',
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const button = canvas.getByRole('button');

    // Test keyboard focus
    button.focus();
    await expect(button).toHaveFocus();

    // Test keyboard activation
    await userEvent.keyboard('{Enter}');
  },
};

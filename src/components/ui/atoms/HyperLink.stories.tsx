import type { Meta, StoryObj } from '@storybook/react';

import { HyperLink } from './HyperLink';

const meta = {
  title: 'Atoms/HyperLink',
  component: HyperLink,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof HyperLink>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    href: '#',
    children: 'Click me',
  },
};

export const External: Story = {
  args: {
    href: 'https://example.com',
    external: true,
    children: 'External link',
  },
};

export const UnderlineVariants: Story = {
  render: () => (
    <div className="flex flex-col gap-4">
      <HyperLink href="#" underline="auto">
        Auto underline (default)
      </HyperLink>
      <HyperLink href="#" underline="hover">
        Underline on hover
      </HyperLink>
      <HyperLink href="#" underline="always">
        Always underline
      </HyperLink>
      <HyperLink href="#" underline={false}>
        No underline
      </HyperLink>
    </div>
  ),
};

export const AllVariants: Story = {
  render: () => (
    <div className="flex flex-col gap-4">
      <HyperLink href="#">Internal link</HyperLink>
      <HyperLink href="https://example.com" external>
        External link with icon
      </HyperLink>
      <HyperLink href="#" underline="hover">
        Hover to underline
      </HyperLink>
      <HyperLink href="#" className="text-accent">
        Custom colored link
      </HyperLink>
    </div>
  ),
};

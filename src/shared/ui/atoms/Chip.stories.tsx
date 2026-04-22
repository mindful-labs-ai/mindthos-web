import type { Meta, StoryObj } from '@storybook/react';

import { Chip } from './Chip';

const meta = {
  title: 'Atoms/Chip',
  component: Chip,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof Chip>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    label: 'Chip',
  },
};

export const WithClose: Story = {
  args: {
    label: 'Closeable',
    onClose: () => alert('Closed!'),
  },
};

export const Sizes: Story = {
  render: () => (
    <div className="flex items-center gap-4">
      <Chip label="Small" size="sm" />
      <Chip label="Medium" size="md" />
      <Chip label="Large" size="lg" />
    </div>
  ),
};

export const Tones: Story = {
  render: () => (
    <div className="flex flex-wrap gap-2">
      <Chip label="Primary" tone="primary" />
      <Chip label="Secondary" tone="secondary" />
      <Chip label="Accent" tone="accent" />
      <Chip label="Neutral" tone="neutral" />
    </div>
  ),
};

export const TonesWithClose: Story = {
  render: () => (
    <div className="flex flex-wrap gap-2">
      <Chip label="Primary" tone="primary" onClose={() => {}} />
      <Chip label="Secondary" tone="secondary" onClose={() => {}} />
      <Chip label="Accent" tone="accent" onClose={() => {}} />
      <Chip label="Neutral" tone="neutral" onClose={() => {}} />
    </div>
  ),
};

export const TagList: Story = {
  render: () => (
    <div className="flex flex-wrap gap-2">
      <Chip label="React" tone="primary" onClose={() => {}} />
      <Chip label="TypeScript" tone="primary" onClose={() => {}} />
      <Chip label="Tailwind" tone="accent" onClose={() => {}} />
      <Chip label="Vite" tone="secondary" onClose={() => {}} />
    </div>
  ),
};

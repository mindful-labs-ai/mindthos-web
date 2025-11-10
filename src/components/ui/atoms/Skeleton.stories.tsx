import type { Meta, StoryObj } from '@storybook/react';

import { Skeleton } from './Skeleton';

const meta = {
  title: 'Atoms/Skeleton',
  component: Skeleton,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof Skeleton>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Text: Story = {
  args: {
    variant: 'text',
    width: '200px',
  },
  render: (args) => (
    <div className="w-[300px]">
      <Skeleton {...args} />
    </div>
  ),
};

export const Circle: Story = {
  args: {
    variant: 'circle',
    width: 40,
    height: 40,
  },
};

export const Rectangle: Story = {
  args: {
    variant: 'rectangle',
    width: '300px',
    height: 200,
  },
};

export const TextLines: Story = {
  render: () => (
    <div className="w-[400px] space-y-3">
      <Skeleton variant="text" width="100%" />
      <Skeleton variant="text" width="90%" />
      <Skeleton variant="text" width="95%" />
      <Skeleton variant="text" width="85%" />
    </div>
  ),
};

export const ProfileCard: Story = {
  render: () => (
    <div className="w-[300px] rounded-lg border-2 border-border bg-surface p-6">
      <div className="flex items-center gap-4">
        <Skeleton variant="circle" width={60} height={60} />
        <div className="flex-1 space-y-2">
          <Skeleton variant="text" width="70%" height="1.2em" />
          <Skeleton variant="text" width="50%" height="0.9em" />
        </div>
      </div>
      <div className="mt-4 space-y-2">
        <Skeleton variant="text" width="100%" />
        <Skeleton variant="text" width="95%" />
        <Skeleton variant="text" width="80%" />
      </div>
      <div className="mt-4">
        <Skeleton variant="rectangle" width="100%" height={40} />
      </div>
    </div>
  ),
};

export const BlogPost: Story = {
  render: () => (
    <div className="w-[600px] space-y-4">
      <Skeleton variant="rectangle" width="100%" height={300} />
      <Skeleton variant="text" width="60%" height="2em" />
      <div className="flex items-center gap-3">
        <Skeleton variant="circle" width={32} height={32} />
        <Skeleton variant="text" width="150px" height="0.9em" />
      </div>
      <div className="space-y-2">
        <Skeleton variant="text" width="100%" />
        <Skeleton variant="text" width="100%" />
        <Skeleton variant="text" width="100%" />
        <Skeleton variant="text" width="90%" />
        <Skeleton variant="text" width="95%" />
      </div>
    </div>
  ),
};

export const DataTable: Story = {
  render: () => (
    <div className="w-[600px] space-y-3">
      <div className="grid grid-cols-4 gap-4">
        <Skeleton variant="text" height="1.5em" />
        <Skeleton variant="text" height="1.5em" />
        <Skeleton variant="text" height="1.5em" />
        <Skeleton variant="text" height="1.5em" />
      </div>
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="grid grid-cols-4 gap-4">
          <Skeleton variant="text" />
          <Skeleton variant="text" />
          <Skeleton variant="text" />
          <Skeleton variant="text" />
        </div>
      ))}
    </div>
  ),
};

export const CardGrid: Story = {
  render: () => (
    <div className="grid w-[600px] grid-cols-3 gap-4">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="space-y-3">
          <Skeleton variant="rectangle" width="100%" height={120} />
          <Skeleton variant="text" width="80%" />
          <Skeleton variant="text" width="60%" />
        </div>
      ))}
    </div>
  ),
};

export const CommentList: Story = {
  render: () => (
    <div className="w-[500px] space-y-4">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="flex gap-3">
          <Skeleton variant="circle" width={40} height={40} />
          <div className="flex-1 space-y-2">
            <Skeleton variant="text" width="30%" height="1em" />
            <Skeleton variant="text" width="100%" />
            <Skeleton variant="text" width="90%" />
          </div>
        </div>
      ))}
    </div>
  ),
};

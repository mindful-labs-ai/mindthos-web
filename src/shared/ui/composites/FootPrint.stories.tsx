import type { Meta, StoryObj } from '@storybook/react';

import { FootPrint } from './FootPrint';

const meta = {
  title: 'Composites/FootPrint',
  component: FootPrint,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof FootPrint>;

export default meta;
type Story = StoryObj<typeof meta>;

const UserIcon = () => (
  <svg
    className="h-3.5 w-3.5"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
    />
  </svg>
);

const ClockIcon = () => (
  <svg
    className="h-3.5 w-3.5"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
    />
  </svg>
);

const EyeIcon = () => (
  <svg
    className="h-3.5 w-3.5"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
    />
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
    />
  </svg>
);

export const Default: Story = {
  args: {
    items: [
      { icon: <UserIcon />, label: 'Author', value: 'John Doe' },
      { icon: <ClockIcon />, label: 'Created', value: '2 hours ago' },
    ],
  },
};

export const WithoutIcons: Story = {
  args: {
    items: [
      { label: 'Author', value: 'Jane Smith' },
      { label: 'Updated', value: 'Yesterday' },
      { label: 'Status', value: 'Published' },
    ],
  },
};

export const WithoutValues: Story = {
  args: {
    items: [
      { icon: <UserIcon />, label: 'Anonymous' },
      { icon: <ClockIcon />, label: 'Just now' },
    ],
  },
};

export const Extended: Story = {
  args: {
    items: [
      { icon: <UserIcon />, label: 'Author', value: 'John Doe' },
      { icon: <ClockIcon />, label: 'Created', value: '2 hours ago' },
      { icon: <EyeIcon />, label: 'Views', value: '1,234' },
      { label: 'Category', value: 'Technology' },
    ],
  },
};

export const InContext: Story = {
  render: () => (
    <div className="w-[600px] space-y-4 rounded-lg border-2 border-border bg-surface p-6">
      <h2 className="text-xl font-bold text-fg">Article Title</h2>
      <FootPrint
        items={[
          { icon: <UserIcon />, label: 'Author', value: 'John Doe' },
          { icon: <ClockIcon />, label: 'Published', value: '2 days ago' },
          { icon: <EyeIcon />, label: 'Views', value: '5,678' },
        ]}
      />
      <p className="text-sm text-fg-muted">
        This is a sample article content that demonstrates how the FootPrint
        component can be used to display metadata about a post or article.
      </p>
    </div>
  ),
};

import type { Meta, StoryObj } from '@storybook/react';

import { BreadCrumb } from './BreadCrumb';

const meta = {
  title: 'Composites/BreadCrumb',
  component: BreadCrumb,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof BreadCrumb>;

export default meta;
type Story = StoryObj<typeof meta>;

const HomeIcon = () => (
  <svg
    className="h-4 w-4"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
    />
  </svg>
);

export const Default: Story = {
  args: {
    items: [
      { label: 'Home', href: '/' },
      { label: 'Products', href: '/products' },
      { label: 'Electronics', href: '/products/electronics' },
      { label: 'Laptop' },
    ],
  },
  render: (args) => (
    <div className="w-[600px]">
      <BreadCrumb {...args} />
    </div>
  ),
};

export const WithIcons: Story = {
  args: {
    items: [
      { label: 'Home', href: '/', icon: <HomeIcon /> },
      { label: 'Documents', href: '/documents' },
      { label: 'Projects', href: '/documents/projects' },
      { label: 'Report.pdf' },
    ],
  },
  render: (args) => (
    <div className="w-[600px]">
      <BreadCrumb {...args} />
    </div>
  ),
};

export const CustomSeparator: Story = {
  args: {
    items: [
      { label: 'Home', href: '/' },
      { label: 'Blog', href: '/blog' },
      { label: 'Article' },
    ],
    separator: '›',
  },
  render: (args) => (
    <div className="w-[600px]">
      <BreadCrumb {...args} />
    </div>
  ),
};

export const DotSeparator: Story = {
  args: {
    items: [
      { label: 'Home', href: '/' },
      { label: 'Category', href: '/category' },
      { label: 'Subcategory', href: '/category/sub' },
      { label: 'Item' },
    ],
    separator: '•',
  },
  render: (args) => (
    <div className="w-[600px]">
      <BreadCrumb {...args} />
    </div>
  ),
};

export const ShortPath: Story = {
  args: {
    items: [{ label: 'Home', href: '/' }, { label: 'Current Page' }],
  },
  render: (args) => (
    <div className="w-[600px]">
      <BreadCrumb {...args} />
    </div>
  ),
};

export const LongPath: Story = {
  args: {
    items: [
      { label: 'Home', href: '/' },
      { label: 'Level 1', href: '/l1' },
      { label: 'Level 2', href: '/l1/l2' },
      { label: 'Level 3', href: '/l1/l2/l3' },
      { label: 'Level 4', href: '/l1/l2/l3/l4' },
      { label: 'Current Page' },
    ],
  },
  render: (args) => (
    <div className="w-[600px]">
      <BreadCrumb {...args} />
    </div>
  ),
};

export const WithClickHandler: Story = {
  args: {
    items: [
      { label: 'Dashboard', href: '/dashboard' },
      { label: 'Settings', href: '/settings' },
      { label: 'Profile' },
    ],
    onItemClick: (item, index) => {
      console.log('Clicked:', item.label, 'at index:', index);
      alert(`Navigating to: ${item.label}`);
    },
  },
  render: (args) => (
    <div className="w-[600px]">
      <BreadCrumb {...args} />
    </div>
  ),
};

export const InContext: Story = {
  render: () => (
    <div className="w-[800px] space-y-4">
      <div className="border-b-2 border-border bg-surface p-4">
        <BreadCrumb
          items={[
            { label: 'Home', href: '/', icon: <HomeIcon /> },
            { label: 'Products', href: '/products' },
            { label: 'Electronics', href: '/products/electronics' },
            { label: 'Laptop Details' },
          ]}
        />
      </div>
      <div className="p-4">
        <h1 className="text-2xl font-bold text-fg">Laptop Details</h1>
        <p className="mt-2 text-sm text-fg-muted">
          This demonstrates how breadcrumbs appear in a typical page layout.
        </p>
      </div>
    </div>
  ),
};

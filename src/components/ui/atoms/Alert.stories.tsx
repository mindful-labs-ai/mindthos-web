import { useState } from 'react';

import type { Meta, StoryObj } from '@storybook/react';

import { Alert } from './Alert';

const meta = {
  title: 'Atoms/Alert',
  component: Alert,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof Alert>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Info: Story = {
  args: {
    tone: 'info',
    title: 'Information',
    children: 'This is an informational alert message.',
  },
  render: (args) => (
    <div className="w-[500px]">
      <Alert {...args} />
    </div>
  ),
};

export const Success: Story = {
  args: {
    tone: 'success',
    title: 'Success',
    children: 'Your changes have been saved successfully.',
  },
  render: (args) => (
    <div className="w-[500px]">
      <Alert {...args} />
    </div>
  ),
};

export const Warning: Story = {
  args: {
    tone: 'warn',
    title: 'Warning',
    children: 'Please review your input before proceeding.',
  },
  render: (args) => (
    <div className="w-[500px]">
      <Alert {...args} />
    </div>
  ),
};

export const Danger: Story = {
  args: {
    tone: 'danger',
    title: 'Error',
    children: 'An error occurred while processing your request.',
  },
  render: (args) => (
    <div className="w-[500px]">
      <Alert {...args} />
    </div>
  ),
};

export const WithoutTitle: Story = {
  args: {
    tone: 'info',
    children: 'This is an alert without a title.',
  },
  render: (args) => (
    <div className="w-[500px]">
      <Alert {...args} />
    </div>
  ),
};

export const WithoutIcon: Story = {
  args: {
    tone: 'info',
    title: 'Note',
    showIcon: false,
    children: 'This alert has no icon.',
  },
  render: (args) => (
    <div className="w-[500px]">
      <Alert {...args} />
    </div>
  ),
};

export const Dismissible: Story = {
  render: () => {
    const Component = () => {
      const [visible, setVisible] = useState(true);
      if (!visible) {
        return (
          <button
            onClick={() => setVisible(true)}
            className="text-sm text-primary"
          >
            Show alert again
          </button>
        );
      }
      return (
        <div className="w-[500px]">
          <Alert
            tone="warn"
            title="Warning"
            dismissible
            onDismiss={() => setVisible(false)}
          >
            This alert can be dismissed by clicking the X button.
          </Alert>
        </div>
      );
    };
    return <Component />;
  },
};

export const AllTones: Story = {
  render: () => (
    <div className="flex w-[500px] flex-col gap-4">
      <Alert tone="info" title="Info">
        Informational message
      </Alert>
      <Alert tone="success" title="Success">
        Operation completed successfully
      </Alert>
      <Alert tone="warn" title="Warning">
        Please review this notice
      </Alert>
      <Alert tone="danger" title="Error">
        An error has occurred
      </Alert>
    </div>
  ),
};

export const LongContent: Story = {
  args: {
    tone: 'info',
    title: 'Detailed Information',
    children:
      'This is a longer alert message that contains more detailed information about the situation. It can span multiple lines and provide comprehensive context to the user about what they need to know or what action they need to take.',
  },
  render: (args) => (
    <div className="w-[500px]">
      <Alert {...args} />
    </div>
  ),
};

export const CustomIcon: Story = {
  args: {
    tone: 'info',
    title: 'Custom Icon',
    icon: (
      <svg
        className="h-5 w-5"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"
        />
      </svg>
    ),
    children: 'This alert uses a custom icon.',
  },
  render: (args) => (
    <div className="w-[500px]">
      <Alert {...args} />
    </div>
  ),
};

export const InContext: Story = {
  render: () => (
    <div className="w-[600px] space-y-4">
      <div className="rounded-lg border-2 border-border bg-surface p-6">
        <h2 className="mb-4 text-xl font-bold text-fg">Account Settings</h2>
        <div className="space-y-4">
          <Alert tone="warn" title="Email not verified">
            Please verify your email address to access all features.
          </Alert>
          <div className="space-y-2">
            <label
              htmlFor="email-input"
              className="text-sm font-medium text-fg"
            >
              Email
            </label>
            <input
              id="email-input"
              type="email"
              className="w-full rounded-lg border-2 border-border bg-surface px-3 py-2 text-fg"
              value="user@example.com"
              readOnly
            />
          </div>
        </div>
      </div>
    </div>
  ),
};

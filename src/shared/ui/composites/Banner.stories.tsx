import { useState } from 'react';

import type { Meta, StoryObj } from '@storybook/react';

import { Banner } from './Banner';

const meta = {
  title: 'Composites/Banner',
  component: Banner,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof Banner>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Info: Story = {
  args: {
    tone: 'info',
    title: 'New feature available',
    description: 'Check out our latest updates and improvements.',
  },
  render: (args) => (
    <div className="w-[600px]">
      <Banner {...args} />
    </div>
  ),
};

export const Success: Story = {
  args: {
    tone: 'success',
    title: 'Changes saved successfully',
    description: 'Your settings have been updated.',
  },
  render: (args) => (
    <div className="w-[600px]">
      <Banner {...args} />
    </div>
  ),
};

export const Warning: Story = {
  args: {
    tone: 'warn',
    title: 'Action required',
    description: 'Please verify your email address to continue.',
  },
  render: (args) => (
    <div className="w-[600px]">
      <Banner {...args} />
    </div>
  ),
};

export const Danger: Story = {
  args: {
    tone: 'danger',
    title: 'Critical error',
    description: 'There was a problem processing your request.',
  },
  render: (args) => (
    <div className="w-[600px]">
      <Banner {...args} />
    </div>
  ),
};

export const WithAction: Story = {
  args: {
    tone: 'info',
    title: 'Update available',
    description: 'A new version is ready to install.',
    action: {
      label: 'Update now',
      onClick: () => console.log('Update clicked'),
    },
  },
  render: (args) => (
    <div className="w-[600px]">
      <Banner {...args} />
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
            Show banner again
          </button>
        );
      }
      return (
        <div className="w-[600px]">
          <Banner
            tone="info"
            title="Cookie notice"
            description="We use cookies to improve your experience."
            dismissible
            onDismiss={() => setVisible(false)}
          />
        </div>
      );
    };
    return <Component />;
  },
};

export const AllTones: Story = {
  render: () => (
    <div className="flex w-[600px] flex-col gap-4">
      <Banner
        tone="info"
        title="Information"
        description="This is an informational message."
      />
      <Banner
        tone="success"
        title="Success"
        description="Operation completed successfully."
      />
      <Banner
        tone="warn"
        title="Warning"
        description="Please review this important notice."
      />
      <Banner
        tone="danger"
        title="Error"
        description="An error occurred during processing."
      />
    </div>
  ),
};

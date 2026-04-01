import type { Meta, StoryObj } from '@storybook/react';

import { Button } from '../atoms/Button';

import { ToastProvider, useToast } from './Toast';

const meta = {
  title: 'Composites/Toast',
  component: ToastProvider,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof ToastProvider>;

export default meta;
type Story = StoryObj<typeof meta>;

const ToastDemo = () => {
  const { toast } = useToast();

  return (
    <div className="flex flex-col gap-4">
      <Button
        onClick={() =>
          toast({
            title: 'Success!',
            description: 'Your changes have been saved.',
          })
        }
      >
        Show Success Toast
      </Button>
      <Button
        onClick={() =>
          toast({
            title: 'Error occurred',
            description: 'Something went wrong. Please try again.',
          })
        }
      >
        Show Error Toast
      </Button>
      <Button
        onClick={() =>
          toast({
            title: 'Action required',
            action: {
              label: 'Undo',
              onClick: () => console.log('Undo clicked'),
            },
          })
        }
      >
        Toast with Action
      </Button>
      <Button
        onClick={() =>
          toast({
            title: 'Quick notification',
            duration: 2000,
          })
        }
      >
        Short Duration (2s)
      </Button>
    </div>
  );
};

export const Demo: Story = {
  render: () => (
    <ToastProvider>
      <ToastDemo />
    </ToastProvider>
  ),
};

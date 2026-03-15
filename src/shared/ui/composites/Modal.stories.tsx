import { useState } from 'react';

import type { Meta, StoryObj } from '@storybook/react';

import { Button } from '../atoms/Button';

import { Modal } from './Modal';

const meta = {
  title: 'Composites/Modal',
  component: Modal,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof Modal>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => {
    const Component = () => {
      const [open, setOpen] = useState(false);
      return (
        <>
          <Button onClick={() => setOpen(true)}>Open Modal</Button>
          <Modal
            open={open}
            onOpenChange={setOpen}
            title="Modal Title"
            description="This is a modal description"
          >
            <p className="text-fg">Modal content goes here.</p>
            <div className="mt-4 flex justify-end gap-2">
              <Button size="sm" onClick={() => setOpen(false)}>
                Confirm
              </Button>
              <Button
                size="sm"
                variant="outline"
                tone="neutral"
                onClick={() => setOpen(false)}
              >
                Cancel
              </Button>
            </div>
          </Modal>
        </>
      );
    };
    return <Component />;
  },
};

export const WithoutDescription: Story = {
  render: () => {
    const Component = () => {
      const [open, setOpen] = useState(false);
      return (
        <>
          <Button onClick={() => setOpen(true)}>Open Modal</Button>
          <Modal open={open} onOpenChange={setOpen} title="Simple Modal">
            <p className="text-fg">Just a title and content.</p>
          </Modal>
        </>
      );
    };
    return <Component />;
  },
};

export const LargeContent: Story = {
  render: () => {
    const Component = () => {
      const [open, setOpen] = useState(false);
      return (
        <>
          <Button onClick={() => setOpen(true)}>Open Large Modal</Button>
          <Modal
            open={open}
            onOpenChange={setOpen}
            title="Terms and Conditions"
          >
            <div className="space-y-4">
              {Array.from({ length: 20 }).map((_, i) => (
                <p key={i} className="text-sm text-fg">
                  Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed
                  do eiusmod tempor incididunt ut labore et dolore magna aliqua.
                </p>
              ))}
            </div>
          </Modal>
        </>
      );
    };
    return <Component />;
  },
};

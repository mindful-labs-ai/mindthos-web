import { useState } from 'react';

import type { Meta, StoryObj } from '@storybook/react';

import { Button } from '../atoms/Button';

import { SnackBar } from './SnackBar';

const meta = {
  title: 'Composites/SnackBar',
  component: SnackBar,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof SnackBar>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => {
    const Component = () => {
      const [open, setOpen] = useState(false);
      return (
        <div>
          <Button onClick={() => setOpen(true)}>Show SnackBar</Button>
          <SnackBar
            open={open}
            message="This is a simple snackbar message"
            onOpenChange={setOpen}
          />
        </div>
      );
    };
    return <Component />;
  },
};

export const WithAction: Story = {
  render: () => {
    const Component = () => {
      const [open, setOpen] = useState(false);
      return (
        <div>
          <Button onClick={() => setOpen(true)}>Show with Action</Button>
          <SnackBar
            open={open}
            message="File deleted successfully"
            action={{
              label: 'Undo',
              onClick: () => console.log('Undo clicked'),
            }}
            onOpenChange={setOpen}
          />
        </div>
      );
    };
    return <Component />;
  },
};

export const NoDismiss: Story = {
  render: () => {
    const Component = () => {
      const [open, setOpen] = useState(false);
      return (
        <div>
          <Button onClick={() => setOpen(true)}>Show No Auto-hide</Button>
          <SnackBar
            open={open}
            message="This message won't auto-hide"
            duration={0}
            onOpenChange={setOpen}
          />
        </div>
      );
    };
    return <Component />;
  },
};

export const ShortDuration: Story = {
  render: () => {
    const Component = () => {
      const [open, setOpen] = useState(false);
      return (
        <div>
          <Button onClick={() => setOpen(true)}>Show Quick Message</Button>
          <SnackBar
            open={open}
            message="This disappears in 2 seconds"
            duration={2000}
            onOpenChange={setOpen}
          />
        </div>
      );
    };
    return <Component />;
  },
};

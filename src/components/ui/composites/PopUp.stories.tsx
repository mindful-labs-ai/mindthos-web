import { useState } from 'react';

import type { Meta, StoryObj } from '@storybook/react';

import { Button } from '../atoms/Button';

import { PopUp } from './PopUp';

const meta = {
  title: 'Composites/PopUp',
  component: PopUp,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof PopUp>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    trigger: <Button>Click me</Button>,
    content: (
      <div>
        <h3 className="font-semibold text-fg">Popup Title</h3>
        <p className="mt-2 text-sm text-fg-muted">
          This is the popup content. It can contain any React elements.
        </p>
      </div>
    ),
  },
};

export const Placements: Story = {
  render: () => (
    <div className="flex flex-col items-center gap-32">
      <PopUp
        trigger={<Button>Top</Button>}
        placement="top"
        content={<p className="text-sm">Popup positioned on top</p>}
      />
      <div className="flex gap-32">
        <PopUp
          trigger={<Button>Left</Button>}
          placement="left"
          content={<p className="text-sm">Popup positioned on left</p>}
        />
        <PopUp
          trigger={<Button>Right</Button>}
          placement="right"
          content={<p className="text-sm">Popup positioned on right</p>}
        />
      </div>
      <PopUp
        trigger={<Button>Bottom</Button>}
        placement="bottom"
        content={<p className="text-sm">Popup positioned on bottom</p>}
      />
    </div>
  ),
};

export const Controlled: Story = {
  render: () => {
    const Component = () => {
      const [open, setOpen] = useState(false);
      return (
        <div className="flex flex-col gap-4">
          <PopUp
            trigger={<Button>Toggle Popup</Button>}
            open={open}
            onOpenChange={setOpen}
            content={
              <div>
                <p className="text-sm text-fg">Controlled popup</p>
                <Button
                  size="sm"
                  className="mt-2"
                  onClick={() => setOpen(false)}
                >
                  Close
                </Button>
              </div>
            }
          />
          <p className="text-sm text-fg-muted">
            Popup is {open ? 'open' : 'closed'}
          </p>
        </div>
      );
    };
    return <Component />;
  },
};

export const RichContent: Story = {
  args: {
    trigger: <Button>View Profile</Button>,
    content: (
      <div className="space-y-3">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary font-semibold text-surface">
            JD
          </div>
          <div>
            <div className="font-semibold text-fg">John Doe</div>
            <div className="text-xs text-fg-muted">john@example.com</div>
          </div>
        </div>
        <div className="text-sm text-fg-muted">
          Software Engineer with 5 years of experience
        </div>
        <Button size="sm" className="w-full">
          View Full Profile
        </Button>
      </div>
    ),
  },
};

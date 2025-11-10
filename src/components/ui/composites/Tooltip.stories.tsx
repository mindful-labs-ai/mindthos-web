import type { Meta, StoryObj } from '@storybook/react';

import { Button } from '../atoms/Button';

import { Tooltip } from './Tooltip';

const meta = {
  title: 'Composites/Tooltip',
  component: Tooltip,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof Tooltip>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    content: 'This is a tooltip',
    children: <Button>Hover me</Button>,
  },
};

export const Placements: Story = {
  render: () => (
    <div className="flex flex-col items-center gap-32">
      <Tooltip content="Tooltip on top" placement="top">
        <Button>Top</Button>
      </Tooltip>
      <div className="flex gap-32">
        <Tooltip content="Tooltip on left" placement="left">
          <Button>Left</Button>
        </Tooltip>
        <Tooltip content="Tooltip on right" placement="right">
          <Button>Right</Button>
        </Tooltip>
      </div>
      <Tooltip content="Tooltip on bottom" placement="bottom">
        <Button>Bottom</Button>
      </Tooltip>
    </div>
  ),
};

export const LongContent: Story = {
  args: {
    content: 'This is a longer tooltip message that will wrap to multiple lines when it exceeds the maximum width.',
    children: <Button>Hover for long tooltip</Button>,
  },
};

export const NoDelay: Story = {
  args: {
    content: 'Appears immediately',
    delay: 0,
    children: <Button>No delay</Button>,
  },
};

export const LongDelay: Story = {
  args: {
    content: 'Takes 1 second to appear',
    delay: 1000,
    children: <Button>Long delay (1s)</Button>,
  },
};

export const Disabled: Story = {
  args: {
    content: 'This should not appear',
    disabled: true,
    children: <Button>Disabled tooltip</Button>,
  },
};

export const OnIcon: Story = {
  render: () => (
    <Tooltip content="Help information">
      <button className="inline-flex items-center justify-center rounded-full p-1 hover:bg-surface-contrast">
        <svg
          className="h-5 w-5 text-fg-muted"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      </button>
    </Tooltip>
  ),
};

export const InContext: Story = {
  render: () => (
    <div className="w-[400px] space-y-4 rounded-lg border-2 border-border bg-surface p-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-fg">Settings</h3>
        <Tooltip content="Click to learn more about settings">
          <button className="rounded p-1 hover:bg-surface-contrast">
            <svg
              className="h-5 w-5 text-fg-muted"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </button>
        </Tooltip>
      </div>
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-sm text-fg">Notifications</span>
            <Tooltip content="Enable to receive email notifications">
              <svg
                className="h-4 w-4 text-fg-muted"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </Tooltip>
          </div>
          <input type="checkbox" className="h-4 w-4" />
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-sm text-fg">Auto-save</span>
            <Tooltip content="Automatically save changes every 5 minutes">
              <svg
                className="h-4 w-4 text-fg-muted"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </Tooltip>
          </div>
          <input type="checkbox" className="h-4 w-4" defaultChecked />
        </div>
      </div>
    </div>
  ),
};

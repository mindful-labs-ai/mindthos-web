import type { Meta, StoryObj } from '@storybook/react';

import { TextArea } from './TextArea';

const meta = {
  title: 'Atoms/TextArea',
  component: TextArea,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof TextArea>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    placeholder: 'Enter text...',
  },
};

export const Sizes: Story = {
  render: () => (
    <div className="flex min-w-[400px] flex-col gap-4">
      <TextArea size="sm" placeholder="Small" rows={3} />
      <TextArea size="md" placeholder="Medium" rows={4} />
      <TextArea size="lg" placeholder="Large" rows={5} />
    </div>
  ),
};

export const Variants: Story = {
  render: () => (
    <div className="flex min-w-[400px] flex-col gap-4">
      <TextArea variant="solid" placeholder="Solid" />
      <TextArea variant="outline" placeholder="Outline" />
      <TextArea variant="ghost" placeholder="Ghost" />
      <TextArea variant="soft" placeholder="Soft" />
    </div>
  ),
};

export const ErrorState: Story = {
  args: {
    error: true,
    placeholder: 'Invalid input',
    'aria-describedby': 'error-message',
  },
};

export const Disabled: Story = {
  args: {
    disabled: true,
    placeholder: 'Disabled',
    defaultValue: 'This is disabled text',
  },
};

export const WithContent: Story = {
  args: {
    defaultValue:
      'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.',
    rows: 6,
  },
};

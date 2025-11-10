import type { Meta, StoryObj } from '@storybook/react';

import { ChatBubble } from './ChatBubble';

const meta = {
  title: 'Composites/ChatBubble',
  component: ChatBubble,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof ChatBubble>;

export default meta;
type Story = StoryObj<typeof meta>;

const Avatar = ({ name }: { name: string }) => (
  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-surface font-semibold">
    {name[0]}
  </div>
);

export const Default: Story = {
  args: {
    author: 'John Doe',
    time: '2:30 PM',
    children: 'Hello, how are you doing today?',
    avatar: <Avatar name="John Doe" />,
  },
  render: (args) => (
    <div className="w-[600px]">
      <ChatBubble {...args} />
    </div>
  ),
};

export const Mine: Story = {
  args: {
    mine: true,
    author: 'You',
    time: '2:31 PM',
    children: "I'm doing great, thanks for asking!",
    avatar: <Avatar name="You" />,
  },
  render: (args) => (
    <div className="w-[600px]">
      <ChatBubble {...args} />
    </div>
  ),
};

export const WithoutAvatar: Story = {
  args: {
    author: 'System',
    time: '2:32 PM',
    children: 'Welcome to the chat!',
  },
  render: (args) => (
    <div className="w-[600px]">
      <ChatBubble {...args} />
    </div>
  ),
};

export const Conversation: Story = {
  render: () => (
    <div className="w-[600px] space-y-4">
      <ChatBubble author="Alice" time="2:30 PM" avatar={<Avatar name="Alice" />}>
        Hey, did you see the latest updates?
      </ChatBubble>
      <ChatBubble mine author="You" time="2:31 PM" avatar={<Avatar name="You" />}>
        Yes! The new features look amazing.
      </ChatBubble>
      <ChatBubble author="Alice" time="2:32 PM" avatar={<Avatar name="Alice" />}>
        I agree! Can't wait to try them out.
      </ChatBubble>
      <ChatBubble mine author="You" time="2:33 PM" avatar={<Avatar name="You" />}>
        Same here. Let's catch up later!
      </ChatBubble>
    </div>
  ),
};

import type { Meta, StoryObj } from '@storybook/react';

import { Button } from '../atoms/Button';

import { Card } from './Card';

const meta = {
  title: 'Composites/Card',
  component: Card,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof Card>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <Card className="w-[400px]">
      <Card.Body>
        <p className="text-fg">This is a simple card with just a body.</p>
      </Card.Body>
    </Card>
  ),
};

export const WithHeader: Story = {
  render: () => (
    <Card className="w-[400px]">
      <Card.Header>
        <h3 className="text-lg font-semibold">Card Title</h3>
      </Card.Header>
      <Card.Body>
        <p className="text-fg">Card content goes here.</p>
      </Card.Body>
    </Card>
  ),
};

export const Full: Story = {
  render: () => (
    <Card className="w-[400px]">
      <Card.Header>
        <h3 className="text-lg font-semibold">User Profile</h3>
        <p className="text-sm text-fg-muted">Manage your account settings</p>
      </Card.Header>
      <Card.Body>
        <p className="text-fg">
          Your profile information and preferences are displayed here.
        </p>
      </Card.Body>
      <Card.Footer>
        <div className="flex gap-2">
          <Button size="sm">Save</Button>
          <Button size="sm" variant="outline" tone="neutral">
            Cancel
          </Button>
        </div>
      </Card.Footer>
    </Card>
  ),
};

export const AsArticle: Story = {
  render: () => (
    <Card as="article" className="w-[400px]">
      <Card.Header>
        <h2 className="text-xl font-bold">Article Title</h2>
      </Card.Header>
      <Card.Body>
        <p className="text-fg">Article content...</p>
      </Card.Body>
    </Card>
  ),
};

import { useState } from 'react';

import type { Meta, StoryObj } from '@storybook/react';

import { Button } from '../atoms/Button';

import { Stepper } from './Stepper';

const meta = {
  title: 'Composites/Stepper',
  component: Stepper,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof Stepper>;

export default meta;
type Story = StoryObj<typeof meta>;

const steps = [
  { label: 'Personal Info', description: 'Basic details' },
  { label: 'Address', description: 'Shipping info' },
  { label: 'Payment', description: 'Payment method' },
  { label: 'Review', description: 'Confirm order' },
];

export const Horizontal: Story = {
  args: {
    steps,
    currentStep: 1,
    orientation: 'horizontal',
  },
  render: (args) => (
    <div className="w-[600px]">
      <Stepper {...args} />
    </div>
  ),
};

export const Vertical: Story = {
  args: {
    steps,
    currentStep: 1,
    orientation: 'vertical',
  },
};

export const Clickable: Story = {
  render: () => {
    const Component = () => {
      const [current, setCurrent] = useState(2);
      return (
        <div className="w-[600px]">
          <Stepper
            steps={steps}
            currentStep={current}
            clickable
            onStepClick={setCurrent}
          />
        </div>
      );
    };
    return <Component />;
  },
};

export const Interactive: Story = {
  render: () => {
    const Component = () => {
      const [current, setCurrent] = useState(0);
      return (
        <div className="w-[600px] space-y-6">
          <Stepper steps={steps} currentStep={current} />
          <div className="rounded-lg border-2 border-border bg-surface p-6">
            <h3 className="mb-4 text-lg font-semibold text-fg">
              {steps[current].label}
            </h3>
            <p className="mb-6 text-sm text-fg-muted">
              Complete this step: {steps[current].description}
            </p>
            <div className="flex gap-3">
              <Button
                size="sm"
                variant="outline"
                tone="neutral"
                onClick={() => setCurrent(Math.max(0, current - 1))}
                disabled={current === 0}
              >
                Back
              </Button>
              <Button
                size="sm"
                onClick={() =>
                  setCurrent(Math.min(steps.length - 1, current + 1))
                }
                disabled={current === steps.length - 1}
              >
                {current === steps.length - 1 ? 'Complete' : 'Next'}
              </Button>
            </div>
          </div>
        </div>
      );
    };
    return <Component />;
  },
};

export const Completed: Story = {
  args: {
    steps,
    currentStep: 4,
  },
  render: (args) => (
    <div className="w-[600px]">
      <Stepper {...args} />
    </div>
  ),
};

export const Simple: Story = {
  args: {
    steps: [{ label: 'Step 1' }, { label: 'Step 2' }, { label: 'Step 3' }],
    currentStep: 1,
  },
  render: (args) => (
    <div className="w-[400px]">
      <Stepper {...args} />
    </div>
  ),
};

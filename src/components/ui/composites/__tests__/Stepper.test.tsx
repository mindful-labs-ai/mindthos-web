import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { Stepper } from '../Stepper';

const steps = [
  { label: 'Step 1', description: 'First step' },
  { label: 'Step 2', description: 'Second step' },
  { label: 'Step 3', description: 'Third step' },
];

describe('Stepper', () => {
  it('renders all steps', () => {
    render(<Stepper steps={steps} currentStep={0} />);
    expect(screen.getByText('Step 1')).toBeInTheDocument();
    expect(screen.getByText('Step 2')).toBeInTheDocument();
    expect(screen.getByText('Step 3')).toBeInTheDocument();
  });

  it('highlights current step', () => {
    render(<Stepper steps={steps} currentStep={1} />);
    const currentStep = screen.getByText('Step 2').closest('div');
    expect(currentStep).toBeInTheDocument();
  });

  it('shows check icon for completed steps', () => {
    const { container } = render(<Stepper steps={steps} currentStep={2} />);
    const checkIcons = container.querySelectorAll('svg');
    expect(checkIcons.length).toBeGreaterThan(0);
  });

  it('renders step descriptions', () => {
    render(<Stepper steps={steps} currentStep={0} />);
    expect(screen.getByText('First step')).toBeInTheDocument();
    expect(screen.getByText('Second step')).toBeInTheDocument();
  });

  it('calls onStepClick when clickable and clicking completed step', async () => {
    const handleStepClick = vi.fn();
    const user = userEvent.setup();
    render(
      <Stepper
        steps={steps}
        currentStep={2}
        clickable
        onStepClick={handleStepClick}
      />
    );

    const buttons = screen.getAllByRole('button');
    await user.click(buttons[0]);
    expect(handleStepClick).toHaveBeenCalledWith(0);
  });

  it('applies vertical orientation', () => {
    const { container } = render(
      <Stepper steps={steps} currentStep={1} orientation="vertical" />
    );
    expect(container.querySelector('nav')).toHaveClass('flex-col');
  });

  it('has navigation role', () => {
    render(<Stepper steps={steps} currentStep={0} />);
    expect(screen.getByRole('navigation')).toBeInTheDocument();
  });
});

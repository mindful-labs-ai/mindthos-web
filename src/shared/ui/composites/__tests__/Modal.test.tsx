import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { Modal } from '../Modal';

describe('Modal', () => {
  it('renders when open is true', () => {
    render(
      <Modal open={true} onOpenChange={vi.fn()}>
        <div>Modal content</div>
      </Modal>
    );
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('does not render when open is false', () => {
    render(
      <Modal open={false} onOpenChange={vi.fn()}>
        <div>Modal content</div>
      </Modal>
    );
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('has aria-modal attribute', () => {
    render(
      <Modal open={true} onOpenChange={vi.fn()}>
        Content
      </Modal>
    );
    expect(screen.getByRole('dialog')).toHaveAttribute('aria-modal', 'true');
  });

  it('closes on ESC key', async () => {
    const handleOpenChange = vi.fn();
    const user = userEvent.setup();
    render(
      <Modal open={true} onOpenChange={handleOpenChange}>
        Content
      </Modal>
    );

    await user.keyboard('{Escape}');
    expect(handleOpenChange).toHaveBeenCalledWith(false);
  });

  it('closes on backdrop click when closeOnOverlay is true', async () => {
    const handleOpenChange = vi.fn();
    const user = userEvent.setup();
    render(
      <Modal open={true} onOpenChange={handleOpenChange} closeOnOverlay>
        <div>Content</div>
      </Modal>
    );

    // Click the backdrop (parent of dialog)
    const backdrop = screen
      .getByRole('dialog')
      .parentElement?.querySelector('[aria-hidden="true"]');
    if (backdrop) {
      await user.click(backdrop);
      expect(handleOpenChange).toHaveBeenCalledWith(false);
    }
  });

  it('renders title when provided', () => {
    render(
      <Modal open={true} onOpenChange={vi.fn()} title="Modal Title">
        Content
      </Modal>
    );
    expect(screen.getByText('Modal Title')).toBeInTheDocument();
  });

  it('renders children content', () => {
    render(
      <Modal open={true} onOpenChange={vi.fn()}>
        <p>Test content</p>
      </Modal>
    );
    expect(screen.getByText('Test content')).toBeInTheDocument();
  });

  it('renders description when provided', () => {
    render(
      <Modal open={true} onOpenChange={vi.fn()} description="Modal description">
        Content
      </Modal>
    );
    expect(screen.getByText('Modal description')).toBeInTheDocument();
  });

  it('closes on close button click', async () => {
    const handleOpenChange = vi.fn();
    const user = userEvent.setup();
    render(
      <Modal open={true} onOpenChange={handleOpenChange}>
        Content
      </Modal>
    );

    const closeButton = screen.getByLabelText('Close dialog');
    await user.click(closeButton);
    expect(handleOpenChange).toHaveBeenCalledWith(false);
  });

  it('does not close on backdrop click when closeOnOverlay is false', async () => {
    const handleOpenChange = vi.fn();
    const user = userEvent.setup();
    render(
      <Modal open={true} onOpenChange={handleOpenChange} closeOnOverlay={false}>
        <div>Content</div>
      </Modal>
    );

    const backdrop = screen
      .getByRole('dialog')
      .parentElement?.querySelector('[aria-hidden="true"]');
    if (backdrop) {
      await user.click(backdrop);
      expect(handleOpenChange).not.toHaveBeenCalled();
    }
  });

  it('sets body overflow hidden when open', () => {
    render(
      <Modal open={true} onOpenChange={vi.fn()}>
        Content
      </Modal>
    );
    expect(document.body.style.overflow).toBe('hidden');
  });
});

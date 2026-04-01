import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { Pagination } from '../Pagination';

describe('Pagination', () => {
  it('renders with navigation role', () => {
    render(
      <Pagination currentPage={1} totalPages={5} onPageChange={vi.fn()} />
    );
    expect(screen.getByRole('navigation')).toBeInTheDocument();
  });

  it('renders page numbers', () => {
    render(
      <Pagination currentPage={1} totalPages={3} onPageChange={vi.fn()} />
    );
    expect(screen.getByText('1')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
  });

  it('highlights current page', () => {
    render(
      <Pagination currentPage={2} totalPages={5} onPageChange={vi.fn()} />
    );
    const currentPage = screen.getByText('2');
    expect(currentPage).toHaveAttribute('aria-current', 'page');
  });

  it('calls onPageChange when page clicked', async () => {
    const handlePageChange = vi.fn();
    const user = userEvent.setup();
    render(
      <Pagination
        currentPage={1}
        totalPages={5}
        onPageChange={handlePageChange}
      />
    );

    await user.click(screen.getByText('3'));
    expect(handlePageChange).toHaveBeenCalledWith(3);
  });

  it('navigates to next page', async () => {
    const handlePageChange = vi.fn();
    const user = userEvent.setup();
    render(
      <Pagination
        currentPage={2}
        totalPages={5}
        onPageChange={handlePageChange}
      />
    );

    await user.click(screen.getByLabelText('Go to next page'));
    expect(handlePageChange).toHaveBeenCalledWith(3);
  });

  it('navigates to previous page', async () => {
    const handlePageChange = vi.fn();
    const user = userEvent.setup();
    render(
      <Pagination
        currentPage={3}
        totalPages={5}
        onPageChange={handlePageChange}
      />
    );

    await user.click(screen.getByLabelText('Go to previous page'));
    expect(handlePageChange).toHaveBeenCalledWith(2);
  });

  it('disables previous button on first page', () => {
    render(
      <Pagination currentPage={1} totalPages={5} onPageChange={vi.fn()} />
    );
    expect(screen.getByLabelText('Go to previous page')).toBeDisabled();
  });

  it('disables next button on last page', () => {
    render(
      <Pagination currentPage={5} totalPages={5} onPageChange={vi.fn()} />
    );
    expect(screen.getByLabelText('Go to next page')).toBeDisabled();
  });

  it('shows ellipsis for many pages', () => {
    render(
      <Pagination currentPage={10} totalPages={20} onPageChange={vi.fn()} />
    );
    const ellipses = screen.getAllByText('...');
    expect(ellipses.length).toBeGreaterThan(0);
  });
});

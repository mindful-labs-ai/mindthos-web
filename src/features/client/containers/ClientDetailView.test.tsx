import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { ClientDetailNotFoundView } from './ClientDetailView';

const mocks = vi.hoisted(() => ({
  navigate: vi.fn(),
  navigateWithUtm: vi.fn(),
}));

vi.mock('react-router-dom', () => ({
  useNavigate: () => mocks.navigate,
}));

vi.mock('@/shared/hooks/useNavigateWithUtm', () => ({
  useNavigateWithUtm: () => ({ navigateWithUtm: mocks.navigateWithUtm }),
}));

describe('ClientDetailNotFoundView', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('keeps the mobile detail header when the client cannot be found', () => {
    render(<ClientDetailNotFoundView isMobileView />);

    expect(screen.getByText('내담자 상세')).toBeInTheDocument();
    expect(screen.getByText('내담자를 찾을 수 없어요.')).toBeInTheDocument();
  });

  it('keeps the desktop detail header and sidebar when the client cannot be found', () => {
    render(
      <ClientDetailNotFoundView
        isMobileView={false}
        sidebar={<aside>내담자 목록</aside>}
      />
    );

    expect(screen.getByText('내담자 목록')).toBeInTheDocument();
    expect(screen.getByText('내담자 상세')).toBeInTheDocument();
    expect(screen.getByText('내담자를 찾을 수 없어요.')).toBeInTheDocument();
  });
});

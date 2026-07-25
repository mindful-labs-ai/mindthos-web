import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import UnsubscribePage from './UnsubscribePage';

function renderPage() {
  render(
    <MemoryRouter initialEntries={['/unsubscribe?token=unsubscribe-token']}>
      <UnsubscribePage />
    </MemoryRouter>
  );
}

describe('UnsubscribePage', () => {
  const supabaseUrl = import.meta.env.VITE_WEBAPP_SUPABASE_URL.replace(
    /\/+$/,
    ''
  );

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('CRM 소유자인 Supabase Edge Function으로 수신거부 토큰을 보낸다', async () => {
    const user = userEvent.setup();
    const fetchMock = vi.fn().mockResolvedValue({
      json: vi.fn().mockResolvedValue({ success: true }),
    });
    vi.stubGlobal('fetch', fetchMock);
    renderPage();

    await user.click(screen.getByRole('button', { name: '수신거부' }));

    expect(fetchMock).toHaveBeenCalledWith(
      `${supabaseUrl}/functions/v1/unsubscribe`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: 'unsubscribe-token' }),
      }
    );
    expect(
      await screen.findByRole('heading', { name: '수신거부가 완료되었어요' })
    ).toBeInTheDocument();
  });

  it('Edge Function이 반환한 수신거부 오류 메시지를 표시한다', async () => {
    const user = userEvent.setup();
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        json: vi.fn().mockResolvedValue({
          success: false,
          message: '수신거부 링크가 만료되었어요.',
        }),
      })
    );
    renderPage();

    await user.click(screen.getByRole('button', { name: '수신거부' }));

    expect(
      await screen.findByText('수신거부 링크가 만료되었어요.')
    ).toBeInTheDocument();
  });
});

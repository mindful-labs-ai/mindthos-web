import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { ServerApiError } from '@/shared/api/server/serverClient';

import UnsubscribePage from './UnsubscribePage';

const mocks = vi.hoisted(() => ({
  serverRequestPublic: vi.fn(),
}));

vi.mock('@/shared/api/server/serverClient', () => {
  class MockServerApiError extends Error {
    readonly status: number;
    readonly statusCode: string;
    readonly raw?: unknown;

    constructor(
      status: number,
      statusCode: string,
      message: string,
      raw?: unknown
    ) {
      super(message);
      this.status = status;
      this.statusCode = statusCode;
      this.raw = raw;
    }
  }

  return {
    ServerApiError: MockServerApiError,
    serverRequestPublic: mocks.serverRequestPublic,
  };
});

function renderPage() {
  render(
    <MemoryRouter initialEntries={['/unsubscribe?token=unsubscribe-token']}>
      <UnsubscribePage />
    </MemoryRouter>
  );
}

describe('UnsubscribePage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('공개 서버 API로 수신거부 토큰을 보낸다', async () => {
    const user = userEvent.setup();
    mocks.serverRequestPublic.mockResolvedValue({ success: true });
    renderPage();

    await user.click(screen.getByRole('button', { name: '수신거부' }));

    expect(mocks.serverRequestPublic).toHaveBeenCalledWith('/unsubscribe', {
      method: 'POST',
      body: { token: 'unsubscribe-token' },
    });
    expect(
      await screen.findByRole('heading', { name: '수신거부가 완료되었어요' })
    ).toBeInTheDocument();
  });

  it('서버가 반환한 수신거부 오류 메시지를 표시한다', async () => {
    const user = userEvent.setup();
    mocks.serverRequestPublic.mockRejectedValue(
      new ServerApiError(400, 'OK', '요청 실패', {
        data: { message: '수신거부 링크가 만료되었어요.' },
      })
    );
    renderPage();

    await user.click(screen.getByRole('button', { name: '수신거부' }));

    expect(
      await screen.findByText('수신거부 링크가 만료되었어요.')
    ).toBeInTheDocument();
  });
});

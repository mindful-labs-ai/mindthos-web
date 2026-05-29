import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { GenogramExportModal } from '../GenogramExportModal';

const mocks = vi.hoisted(() => ({
  download: vi.fn(),
  openModal: vi.fn(),
  setBackgroundId: vi.fn(),
  setShowWatermark: vi.fn(),
  trackEvent: vi.fn(),
  useCreditInfo: vi.fn(),
  useGenogramExport: vi.fn(
    (options: { defaultShowWatermark?: boolean } = {}) => ({
      backgroundId: 'transparent',
      download: vi.fn(),
      isProcessing: false,
      previewUrl: 'data:image/png;base64,preview',
      setBackgroundId: vi.fn(),
      setShowWatermark: vi.fn(),
      showWatermark: options.defaultShowWatermark ?? true,
    })
  ),
}));

vi.mock('@/features/genogram/hooks/useGenogramExport', () => ({
  useGenogramExport: mocks.useGenogramExport,
}));

vi.mock('@/features/settings/hooks/useCreditInfo', () => ({
  useCreditInfo: mocks.useCreditInfo,
}));

vi.mock('@/lib/mixpanel', () => ({
  trackEvent: mocks.trackEvent,
}));

vi.mock('@/shared/hooks/useDevice', () => ({
  useDevice: () => ({ isMobile: false, isTablet: false }),
}));

vi.mock('@/stores/modalStore', () => ({
  useModalStore: (selector: (state: { openModal: () => void }) => unknown) =>
    selector({ openModal: mocks.openModal }),
}));

function renderExportModal(planType: string) {
  mocks.setShowWatermark = vi.fn();
  mocks.setBackgroundId = vi.fn();
  mocks.download = vi.fn();
  mocks.useCreditInfo.mockReturnValue({
    creditInfo: {
      plan: { type: planType },
    },
    error: null,
    isLoading: false,
    refetch: vi.fn(),
  });
  mocks.useGenogramExport.mockImplementation(
    (options: { defaultShowWatermark?: boolean } = {}) => ({
      backgroundId: 'transparent',
      download: mocks.download,
      isProcessing: false,
      previewUrl: 'data:image/png;base64,preview',
      setBackgroundId: mocks.setBackgroundId,
      setShowWatermark: mocks.setShowWatermark,
      showWatermark: options.defaultShowWatermark ?? true,
    })
  );

  render(
    <GenogramExportModal
      open
      onOpenChange={vi.fn()}
      imageData="data:image/png;base64,raw"
      defaultFileName="가계도_260529"
      watermarkSrc="/genogram/genogram-export-watermark.png"
    />
  );
}

describe('GenogramExportModal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('defaults to removing the watermark for plus-or-above users', () => {
    renderExportModal('plus');

    expect(mocks.useGenogramExport).toHaveBeenCalledWith(
      expect.objectContaining({ defaultShowWatermark: false })
    );
    expect(
      screen.getByRole('button', { name: '워터마크 제거' })
    ).toHaveAttribute('aria-pressed', 'true');
  });

  it('keeps the watermark by default for plans below plus', () => {
    renderExportModal('starter');

    expect(mocks.useGenogramExport).toHaveBeenCalledWith(
      expect.objectContaining({ defaultShowWatermark: true })
    );
    expect(
      screen.getByRole('button', { name: '워터마크 제거' })
    ).toHaveAttribute('aria-pressed', 'false');
  });

  it('lets plus-or-above users turn the watermark back on', async () => {
    const user = userEvent.setup();
    renderExportModal('pro');

    await user.click(screen.getByRole('button', { name: '워터마크 제거' }));

    expect(mocks.setShowWatermark).toHaveBeenLastCalledWith(true);
  });
});

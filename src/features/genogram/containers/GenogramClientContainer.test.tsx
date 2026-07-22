import type { ReactNode } from 'react';

import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { AIGenogramOutput } from '../utils/aiJsonConverter';

import { GenogramClientContainer } from './GenogramClientContainer';

const mocks = vi.hoisted(() => ({
  clientId: 'client-a',
  fetchGenerationStatus: vi.fn(),
  fetchRawAIOutput: vi.fn(),
  saveFamilySummary: vi.fn(),
  saveGenogram: vi.fn(),
  invalidateQueries: vi.fn(),
  setQueryData: vi.fn(),
  convertAIJsonToCanvas: vi.fn(),
}));

vi.mock('react-router-dom', () => ({
  useBlocker: () => ({ state: 'unblocked' }),
  useSearchParams: () => [new URLSearchParams({ clientId: mocks.clientId })],
}));

vi.mock('@tanstack/react-query', () => ({
  useQueryClient: () => ({
    invalidateQueries: mocks.invalidateQueries,
    setQueryData: mocks.setQueryData,
  }),
}));

vi.mock('@/features/client/hooks/useClientList', () => ({
  useClientList: () => ({
    clients: [
      { id: 'client-a', name: 'Client A', counsel_done: false },
      { id: 'client-b', name: 'Client B', counsel_done: false },
    ],
    isLoading: false,
  }),
}));

vi.mock('@/genogram', () => ({
  GenogramPage: () => null,
}));

vi.mock('@/lib/mixpanel', () => ({
  trackEvent: vi.fn(),
}));

vi.mock('@/shared/api/supabase/genogramAIQueries', () => ({
  fetchGenerationStatus: mocks.fetchGenerationStatus,
  fetchRawAIOutput: mocks.fetchRawAIOutput,
  initFamilySummary: vi.fn(),
  saveFamilySummary: mocks.saveFamilySummary,
}));

vi.mock('@/shared/api/supabase/genogramQueries', () => ({
  genogramService: {
    save: mocks.saveGenogram,
  },
}));

vi.mock('@/shared/hooks/useDevice', () => ({
  useDevice: () => ({ isMobile: false, isTablet: false }),
}));

vi.mock('@/shared/hooks/useNavigateWithUtm', () => ({
  useNavigateWithUtm: () => ({ setSearchParamsWithUtm: vi.fn() }),
}));

vi.mock('@/shared/ui/composites/Modal', () => ({
  Modal: ({ open, children }: { open: boolean; children: ReactNode }) =>
    open ? <>{children}</> : null,
}));

vi.mock('@/shared/ui/composites/Toast', () => ({
  useToast: () => ({ toast: vi.fn() }),
}));

vi.mock('@/stores/authStore', () => ({
  useAuthStore: (selector: (state: { userId: string }) => unknown) =>
    selector({ userId: '42' }),
}));

vi.mock('@/stores/genogramNoticeStore', () => ({
  useGenogramNoticeStore: {
    getState: () => ({ shown: true, markShown: vi.fn() }),
  },
}));

vi.mock('@/widgets/client/AddClientModal', () => ({
  AddClientModal: () => null,
}));

vi.mock('@/widgets/client/ClientSidebar', () => ({
  ClientSidebar: () => null,
}));

vi.mock('@/widgets/genogram/export', () => ({
  GenogramExportModal: () => null,
}));

vi.mock('@/widgets/genogram/GenogramEmptyState', () => ({
  GenogramEmptyState: ({
    onStartFromRecords,
  }: {
    onStartFromRecords: (forceRefresh?: boolean) => void;
  }) => (
    <button type="button" onClick={() => onStartFromRecords(false)}>
      generate from records
    </button>
  ),
}));

vi.mock('@/widgets/genogram/GenogramGenerationSteps', () => ({
  GenogramGenerationSteps: ({
    currentStep,
    isLoading,
    aiOutput,
    onConfirm,
    onNextToRender,
    onComplete,
  }: {
    currentStep: 'confirm' | 'analyze' | 'edit' | 'render';
    isLoading: boolean;
    aiOutput: AIGenogramOutput | null;
    onConfirm: () => void;
    onNextToRender: () => void;
    onComplete: () => void;
  }) => (
    <div>
      {currentStep === 'confirm' && (
        <button type="button" onClick={onConfirm}>
          confirm generation
        </button>
      )}
      {currentStep === 'analyze' && isLoading && <span>generating</span>}
      {currentStep === 'analyze' && !isLoading && aiOutput && (
        <>
          <span>{aiOutput.subjects[0]?.name}</span>
          <button type="button" onClick={onNextToRender}>
            render result
          </button>
        </>
      )}
      {currentStep === 'render' && (
        <button type="button" onClick={onComplete}>
          save result
        </button>
      )}
    </div>
  ),
}));

vi.mock('@/widgets/genogram/GenogramGuideModal', () => ({
  DEFAULT_GUIDE_STEPS: [],
  GenogramGuideModal: () => null,
  GUIDE_DONT_SHOW_AGAIN_KEY: 'genogram-guide-hidden',
}));

vi.mock('@/widgets/genogram/GenogramPageHeader', () => ({
  GenogramPageHeader: () => null,
}));

vi.mock('@/widgets/genogram/ResetConfirmModal', () => ({
  ResetConfirmModal: () => null,
}));

vi.mock('@/widgets/report/GenogramReportModal', () => ({
  GenogramReportModal: () => null,
}));

vi.mock('../hooks/useClientFamilySummary', () => ({
  useClientFamilySummary: () => ({ isLoading: false }),
}));

vi.mock('../hooks/useClientHasRecords', () => ({
  useClientHasRecords: () => ({ hasRecords: true }),
}));

vi.mock('../hooks/useGenogramData', () => ({
  useGenogramData: () => ({
    initialData: null,
    hasData: false,
    isLoading: false,
    isSaving: false,
    lastSavedAt: null,
    onChange: vi.fn(),
    saveNow: vi.fn(),
  }),
}));

vi.mock('../utils/aiJsonConverter', async (importOriginal) => {
  const actual =
    await importOriginal<typeof import('../utils/aiJsonConverter')>();
  return {
    ...actual,
    convertAIJsonToCanvas: mocks.convertAIJsonToCanvas,
  };
});

vi.mock('./GenogramClientView', () => ({
  GenogramClientView: ({ content }: { content: ReactNode }) => (
    <main>{content}</main>
  ),
}));

function createDeferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((resolvePromise) => {
    resolve = resolvePromise;
  });
  return { promise, resolve };
}

function createOutput(name: string): AIGenogramOutput {
  return {
    subjects: [{ id: 1, type: 'PERSON', name }],
    partners: [],
    children: [],
    fetus: [],
    relations: [],
    influences: [],
    siblingGroups: [],
    nuclearFamilies: [],
  };
}

describe('GenogramClientContainer generation ownership', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.clientId = 'client-a';
    mocks.fetchGenerationStatus.mockResolvedValue('none');
    mocks.saveFamilySummary.mockResolvedValue(undefined);
    mocks.saveGenogram.mockResolvedValue(undefined);
    mocks.convertAIJsonToCanvas.mockImplementation(
      (output: AIGenogramOutput) => ({ marker: output.subjects[0]?.name })
    );
  });

  it('ignores client A result after switching to client B', async () => {
    const clientARequest = createDeferred<{
      success: true;
      data: { client_id: string; ai_output: AIGenogramOutput };
    }>();
    const clientBRequest = createDeferred<{
      success: true;
      data: { client_id: string; ai_output: AIGenogramOutput };
    }>();

    mocks.fetchRawAIOutput.mockImplementation((clientId: string) => {
      return clientId === 'client-a'
        ? clientARequest.promise
        : clientBRequest.promise;
    });

    const { rerender } = render(<GenogramClientContainer />);

    fireEvent.click(
      await screen.findByRole('button', { name: 'generate from records' })
    );
    fireEvent.click(screen.getByRole('button', { name: 'confirm generation' }));
    expect(mocks.fetchRawAIOutput).toHaveBeenCalledWith('client-a', false);

    mocks.clientId = 'client-b';
    rerender(<GenogramClientContainer />);

    fireEvent.click(
      await screen.findByRole('button', { name: 'generate from records' })
    );
    fireEvent.click(screen.getByRole('button', { name: 'confirm generation' }));
    expect(mocks.fetchRawAIOutput).toHaveBeenCalledWith('client-b', false);

    await act(async () => {
      clientARequest.resolve({
        success: true,
        data: {
          client_id: 'client-a',
          ai_output: createOutput('Client A result'),
        },
      });
      await clientARequest.promise;
    });

    await waitFor(() => {
      expect(mocks.invalidateQueries).toHaveBeenCalledTimes(1);
    });
    expect(screen.getByText('generating')).toBeInTheDocument();
    expect(screen.queryByText('Client A result')).not.toBeInTheDocument();
    expect(mocks.saveGenogram).not.toHaveBeenCalled();
    expect(mocks.saveFamilySummary).not.toHaveBeenCalled();

    await act(async () => {
      clientBRequest.resolve({
        success: true,
        data: {
          client_id: 'client-b',
          ai_output: createOutput('Client B result'),
        },
      });
      await clientBRequest.promise;
    });

    expect(await screen.findByText('Client B result')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'render result' }));
    fireEvent.click(screen.getByRole('button', { name: 'save result' }));

    await waitFor(() => {
      expect(mocks.saveGenogram).toHaveBeenCalledWith(
        'client-b',
        '42',
        JSON.stringify({ marker: 'Client B result' })
      );
    });
    expect(mocks.saveGenogram).toHaveBeenCalledTimes(1);
    expect(mocks.saveFamilySummary).toHaveBeenCalledTimes(1);
    expect(mocks.saveFamilySummary).toHaveBeenCalledWith(
      'client-b',
      createOutput('Client B result')
    );
  });
});

import { useCallback, useEffect, useRef, useState } from 'react';

import { useQueryClient } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';

import { useClientList } from '@/features/client/hooks/useClientList';
import type { Client } from '@/features/client/types';
import { GenogramPage, type GenogramPageHandle } from '@/genogram';
import type { SerializedGenogram } from '@/genogram/core/models/genogram';
import {
  fetchRawAIOutput,
  initFamilySummary,
  saveFamilySummary,
} from '@/shared/api/supabase/genogramAIQueries';
import { genogramService } from '@/shared/api/supabase/genogramQueries';
import {
  clientQueryKeys,
  genogramQueryKeys,
} from '@/shared/constants/queryKeys';
import { useNavigateWithUtm } from '@/shared/hooks/useNavigateWithUtm';
import { useToast } from '@/shared/ui/composites/Toast';
import { useAuthStore } from '@/stores/authStore';
import { AddClientModal } from '@/widgets/client/AddClientModal';
import { GenogramExportModal } from '@/widgets/genogram/export';
import { GenogramEmptyState } from '@/widgets/genogram/GenogramEmptyState';
import { GenogramGenerationSteps } from '@/widgets/genogram/GenogramGenerationSteps';
import {
  DEFAULT_GUIDE_STEPS,
  GenogramGuideModal,
  GUIDE_DONT_SHOW_AGAIN_KEY,
} from '@/widgets/genogram/GenogramGuideModal';
import { GenogramPageHeader } from '@/widgets/genogram/GenogramPageHeader';
import { ResetConfirmModal } from '@/widgets/genogram/ResetConfirmModal';
import { GenogramReportModal } from '@/widgets/report/GenogramReportModal';

import { useClientFamilySummary } from '../hooks/useClientFamilySummary';
import { useClientHasRecords } from '../hooks/useClientHasRecords';
import { useGenogramData } from '../hooks/useGenogramData';
import { useGenogramSteps } from '../hooks/useGenogramSteps';
import {
  convertAIJsonToCanvas,
  convertCanvasToAIJson,
  extractPositionsFromCanvas,
} from '../utils/aiJsonConverter';

import { GenogramClientView } from './GenogramClientView';

export function GenogramClientContainer() {
  const [searchParams] = useSearchParams();
  const clientId = searchParams.get('clientId');
  const { setSearchParamsWithUtm } = useNavigateWithUtm();
  const { toast } = useToast();

  const userId = useAuthStore((s) => s.userId);
  const queryClient = useQueryClient();
  const { clients, isLoading: isClientsLoading } = useClientList();
  const genogramRef = useRef<GenogramPageHandle>(null);

  const selectedClient = clients.find((c) => c.id === clientId) ?? null;

  const { hasRecords } = useClientHasRecords(clientId ?? '');
  const { isLoading: isFamilySummaryLoading } = useClientFamilySummary(
    clientId ?? ''
  );

  const steps = useGenogramSteps();

  useEffect(() => {
    steps.reset();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clientId]);

  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [temporaryData, setTemporaryData] = useState<string | null>(null);
  const [isAddClientModalOpen, setIsAddClientModalOpen] = useState(false);
  const [exitedTemporaryMode, setExitedTemporaryMode] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [shouldForceRefresh, setShouldForceRefresh] = useState(false);
  const [exportImageData, setExportImageData] = useState<string | null>(null);
  const [isGuideModalOpen, setIsGuideModalOpen] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [isStarting, setIsStarting] = useState(false);

  const preparedCanvasJsonRef = useRef<string | null>(null);
  const originalCanvasRef = useRef<SerializedGenogram | null>(null);
  const isEditModeRef = useRef(false);

  const autoSavePaused =
    steps.isOpen ||
    isExportModalOpen ||
    isReportModalOpen ||
    isResetModalOpen ||
    isGuideModalOpen ||
    isAddClientModalOpen;

  const {
    initialData,
    hasData,
    isLoading: isDataLoading,
    isSaving,
    lastSavedAt,
    onChange,
    saveNow,
  } = useGenogramData(clientId ?? '', { paused: autoSavePaused });

  const activeClients = clients.filter((c) => !c.counsel_done);
  const hasNoClients = !isClientsLoading && activeClients.length === 0;
  const isTemporaryMode = hasNoClients && !exitedTemporaryMode;

  const updateGenogramState = useCallback(() => {
    setCanUndo(genogramRef.current?.canUndo() ?? false);
    setCanRedo(genogramRef.current?.canRedo() ?? false);
    setIsPanelOpen(genogramRef.current?.isPanelOpen() ?? false);
  }, []);

  const handleStartEmpty = useCallback(async () => {
    if (!clientId || !userId) return;
    setIsStarting(true);
    try {
      await genogramService.save(clientId, userId, '{}');
      queryClient.setQueryData(genogramQueryKeys.data(clientId), '{}');
    } catch (e) {
      console.error('Failed to create empty genogram:', e);
    } finally {
      setIsStarting(false);
    }
  }, [clientId, userId, queryClient]);

  const handleStartFromRecords = useCallback(
    (forceRefresh = false) => {
      if (!clientId) return;
      setShouldForceRefresh(forceRefresh);
      steps.open('confirm');
    },
    [clientId, steps]
  );

  const handleConfirm = useCallback(async () => {
    if (!clientId) return;
    steps.setStep('analyze');
    steps.setLoading(true);
    steps.setError(null);

    try {
      const result = await fetchRawAIOutput(clientId, shouldForceRefresh);
      if (!result.success) {
        steps.setError(result.error.message);
        return;
      }
      steps.setAiOutput(result.data.ai_output);
      steps.setEditedJson(JSON.stringify(result.data.ai_output, null, 2));
    } catch (error) {
      steps.setError(
        (error as Error).message || '알 수 없는 오류가 발생했습니다.'
      );
    } finally {
      steps.setLoading(false);
      setShouldForceRefresh(false);
    }
  }, [clientId, steps, shouldForceRefresh]);

  const handleNextToRender = useCallback(() => {
    if (!steps.aiOutput) {
      steps.setError('데이터가 없습니다.');
      return;
    }
    try {
      const existingPositions = originalCanvasRef.current
        ? extractPositionsFromCanvas(originalCanvasRef.current, steps.aiOutput)
        : undefined;
      const canvasData = convertAIJsonToCanvas(steps.aiOutput, {
        existingPositions,
      });
      const canvasJson = JSON.stringify(canvasData);
      preparedCanvasJsonRef.current = canvasJson;
      originalCanvasRef.current = null;
      steps.setStep('render');
    } catch {
      steps.setError('JSON 변환 중 오류가 발생했습니다.');
    }
  }, [steps]);

  const handleEditApply = useCallback(async () => {
    if (!clientId || !userId) return;
    if (!steps.aiOutput) {
      steps.setError('데이터가 없습니다.');
      return;
    }
    try {
      const existingPositions = originalCanvasRef.current
        ? extractPositionsFromCanvas(originalCanvasRef.current, steps.aiOutput)
        : undefined;
      const canvasData = convertAIJsonToCanvas(steps.aiOutput, {
        existingPositions,
      });
      const canvasJson = JSON.stringify(canvasData);
      await genogramService.save(clientId, userId, canvasJson);
      await saveFamilySummary(clientId, steps.aiOutput);
      queryClient.setQueryData(
        genogramQueryKeys.familySummary(clientId),
        steps.aiOutput
      );
      queryClient.setQueryData(genogramQueryKeys.data(clientId), canvasJson);
      originalCanvasRef.current = null;
      steps.reset();
    } catch {
      steps.setError('JSON 변환 중 오류가 발생했습니다.');
    }
  }, [clientId, userId, steps, queryClient]);

  const handleShowBasicInfo = useCallback(async () => {
    const canvasJson = genogramRef.current?.toJSON();
    if (!canvasJson) return;
    steps.open('edit');
    steps.setLoading(true);
    steps.setError(null);
    try {
      const canvasData = JSON.parse(canvasJson) as SerializedGenogram;
      originalCanvasRef.current = canvasData;
      const aiOutput = convertCanvasToAIJson(canvasData);
      steps.updateAiOutput(aiOutput);
    } catch {
      steps.setError('가계도 데이터 변환 중 오류가 발생했습니다.');
    } finally {
      steps.setLoading(false);
    }
  }, [steps]);

  const handleEditCancel = useCallback(() => {
    originalCanvasRef.current = null;
    isEditModeRef.current = false;
    steps.reset();
  }, [steps]);

  const handleStepsComplete = useCallback(async () => {
    if (!clientId || !userId) return;
    const canvasJson = preparedCanvasJsonRef.current;
    if (!canvasJson) {
      steps.reset();
      return;
    }
    try {
      await genogramService.save(clientId, userId, canvasJson);
      if (steps.aiOutput) {
        await saveFamilySummary(clientId, steps.aiOutput);
        queryClient.setQueryData(
          genogramQueryKeys.familySummary(clientId),
          steps.aiOutput
        );
      }
      queryClient.setQueryData(genogramQueryKeys.data(clientId), canvasJson);
      const wasEditMode = isEditModeRef.current;
      preparedCanvasJsonRef.current = null;
      isEditModeRef.current = false;
      steps.reset();
      if (!wasEditMode) {
        const dontShowAgain = localStorage.getItem(GUIDE_DONT_SHOW_AGAIN_KEY);
        if (dontShowAgain !== 'true') {
          setIsGuideModalOpen(true);
        }
      }
    } catch (e) {
      console.error('Failed to save genogram:', e);
      steps.reset();
    }
  }, [clientId, userId, queryClient, steps]);

  const handleClientSelect = useCallback(
    (client: Client | null) => {
      if (client) {
        setSearchParamsWithUtm({ clientId: client.id });
        setExitedTemporaryMode(true);
      } else {
        setSearchParamsWithUtm({});
      }
    },
    [setSearchParamsWithUtm]
  );

  const handleOpenAddClientModal = useCallback(() => {
    if (isTemporaryMode) {
      const json = genogramRef.current?.toJSON();
      if (json) setTemporaryData(json);
    }
    setIsAddClientModalOpen(true);
  }, [isTemporaryMode]);

  const handleAddClientModalClose = useCallback((open: boolean) => {
    setIsAddClientModalOpen(open);
  }, []);

  const handleClientCreated = useCallback(
    async (newClientId: string) => {
      if (!userId) return;
      if (temporaryData) {
        try {
          await genogramService.save(newClientId, userId, temporaryData);
          queryClient.setQueryData(
            genogramQueryKeys.data(newClientId),
            temporaryData
          );
          setTemporaryData(null);
        } catch (e) {
          console.error('Failed to save genogram to new client:', e);
        }
      }
      queryClient.invalidateQueries({ queryKey: clientQueryKeys.all });
      setSearchParamsWithUtm({ clientId: newClientId });
      setExitedTemporaryMode(true);
    },
    [temporaryData, userId, setSearchParamsWithUtm, queryClient]
  );

  const handleExport = useCallback(async () => {
    const imageData = await genogramRef.current?.captureImage();
    if (imageData) {
      setExportImageData(imageData);
      setIsExportModalOpen(true);
    }
  }, []);

  const handleSave = useCallback(() => {
    const json = genogramRef.current?.toJSON();
    if (json) saveNow(json);
  }, [saveNow]);

  const handleReset = useCallback(() => {
    setIsResetModalOpen(true);
  }, []);

  const handleResetConfirm = useCallback(async () => {
    if (!clientId || !userId) return;
    setIsResetting(true);
    try {
      const result = await initFamilySummary(clientId, true);
      if (!result.success) {
        toast({ title: '초기화 실패' });
        return;
      }
      queryClient.setQueryData(genogramQueryKeys.data(clientId), null);
      queryClient.setQueryData(genogramQueryKeys.familySummary(clientId), null);
      queryClient.invalidateQueries({
        queryKey: genogramQueryKeys.data(clientId),
      });
      queryClient.invalidateQueries({
        queryKey: genogramQueryKeys.familySummary(clientId),
      });
      queryClient.invalidateQueries({
        queryKey: clientQueryKeys.list(userId),
      });
    } catch (e) {
      console.error('Failed to reset genogram:', e);
      toast({ title: '초기화 중 오류가 발생했습니다.' });
    } finally {
      setIsResetting(false);
      setIsResetModalOpen(false);
    }
  }, [clientId, userId, queryClient, toast]);

  const handleUndo = useCallback(() => {
    genogramRef.current?.undo();
    updateGenogramState();
  }, [updateGenogramState]);

  const handleRedo = useCallback(() => {
    genogramRef.current?.redo();
    updateGenogramState();
  }, [updateGenogramState]);

  const handleCanvasChange = useCallback(
    (json: string) => {
      onChange(json);
      updateGenogramState();
    },
    [onChange, updateGenogramState]
  );

  const isLoading =
    isClientsLoading ||
    (clientId && isDataLoading) ||
    (clientId && isFamilySummaryLoading);
  const showCanvas = (clientId && hasData) || isTemporaryMode;

  // --- Build widget slots ---

  const header = (
    <GenogramPageHeader
      clients={clients}
      selectedClient={selectedClient}
      onClientSelect={handleClientSelect}
      onUndo={handleUndo}
      onRedo={handleRedo}
      onExport={handleExport}
      onSave={handleSave}
      showActions={
        !!showCanvas && !(steps.isOpen && steps.currentStep === 'edit')
      }
      canUndo={canUndo}
      canRedo={canRedo}
      isPanelOpen={isPanelOpen}
      isSaving={isSaving}
      lastSavedAt={lastSavedAt}
      onAddClient={handleOpenAddClientModal}
      isTemporaryMode={isTemporaryMode}
      onReset={showCanvas && clientId ? handleReset : undefined}
      isResetting={isResetting}
      onShowBasicInfo={showCanvas && clientId ? handleShowBasicInfo : undefined}
      onShowReport={
        showCanvas && clientId ? () => setIsReportModalOpen(true) : undefined
      }
    />
  );

  const content = (() => {
    if (isLoading || isStarting) {
      return (
        <div className="flex h-full items-center justify-center">
          <span className="text-fg-muted">불러오는 중...</span>
        </div>
      );
    }

    if (isTemporaryMode) {
      return (
        <GenogramPage
          key="temporary"
          ref={genogramRef}
          onChange={updateGenogramState}
        />
      );
    }

    if (!clientId) {
      return (
        <>
          <GenogramPage
            key="no-client"
            ref={genogramRef}
            onChange={updateGenogramState}
            hideToolbar
          />
          <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center">
            <div className="flex h-[200px] w-[512px] flex-col justify-center rounded-lg border border-dashed border-border bg-surface p-8 text-center backdrop-blur-sm">
              <p className="typo-l font-medium text-fg-muted">
                클라이언트를 선택해주세요
              </p>
            </div>
          </div>
        </>
      );
    }

    if (steps.isOpen) {
      return (
        <GenogramGenerationSteps
          currentStep={steps.currentStep}
          isLoading={steps.isLoading}
          error={steps.error}
          aiOutput={steps.aiOutput}
          clientName={selectedClient?.name}
          isRenderPending={false}
          isEditMode={isEditModeRef.current}
          onConfirm={handleConfirm}
          onAiOutputChange={steps.updateAiOutput}
          onNextToRender={
            steps.currentStep === 'edit' ? handleEditApply : handleNextToRender
          }
          onComplete={handleStepsComplete}
          onCancel={steps.reset}
          onEditCancel={handleEditCancel}
        />
      );
    }

    if (!hasData) {
      return (
        <GenogramEmptyState
          onStartEmpty={handleStartEmpty}
          onStartFromRecords={handleStartFromRecords}
          isGenerating={false}
          hasRecords={hasRecords}
        />
      );
    }

    return (
      <GenogramPage
        key={clientId}
        ref={genogramRef}
        initialData={initialData ?? undefined}
        onChange={handleCanvasChange}
        emptyStateActions={
          hasRecords && (
            <div className="flex items-center gap-2 typo-sm">
              <span className="text-fg-muted">
                혹시 처음부터 그리는게 어렵나요?
              </span>
              <button
                onClick={() => handleStartFromRecords(true)}
                className="rounded-md border border-border bg-surface px-3 py-1.5 font-medium text-fg transition-colors hover:bg-surface-strong"
              >
                AI로 자동 생성하기
              </button>
            </div>
          )
        }
      />
    );
  })();

  const addClientModal = (
    <AddClientModal
      open={isAddClientModalOpen}
      onOpenChange={handleAddClientModalClose}
      onClientCreated={handleClientCreated}
    />
  );

  const resetModal = (
    <ResetConfirmModal
      open={isResetModalOpen}
      onOpenChange={setIsResetModalOpen}
      clientName={selectedClient?.name ?? ''}
      onConfirm={handleResetConfirm}
      isLoading={isResetting}
    />
  );

  const exportModal = isExportModalOpen ? (
    <GenogramExportModal
      key={exportImageData?.slice(0, 50)}
      open={isExportModalOpen}
      onOpenChange={setIsExportModalOpen}
      imageData={exportImageData}
      defaultFileName={`${selectedClient?.name ?? '가계도'}_${new Date().toISOString().slice(2, 10).replace(/-/g, '')}`}
      watermarkSrc="/genogram/genogram-export-watermark.png"
    />
  ) : null;

  const guideModal = (
    <GenogramGuideModal
      open={isGuideModalOpen}
      onOpenChange={setIsGuideModalOpen}
      steps={DEFAULT_GUIDE_STEPS}
      onDontShowAgain={() => {
        localStorage.setItem(GUIDE_DONT_SHOW_AGAIN_KEY, 'true');
      }}
    />
  );

  const reportModal = (
    <GenogramReportModal
      open={isReportModalOpen}
      onOpenChange={setIsReportModalOpen}
      genogramRef={genogramRef}
      clientId={clientId ?? undefined}
      clientName={selectedClient?.name}
    />
  );

  return (
    <GenogramClientView
      header={header}
      content={content}
      addClientModal={addClientModal}
      resetModal={resetModal}
      exportModal={exportModal}
      guideModal={guideModal}
      reportModal={reportModal}
    />
  );
}

export default GenogramClientContainer;

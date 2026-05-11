import { useCallback, useEffect, useRef, useState } from 'react';

import { useQueryClient } from '@tanstack/react-query';
import { Download } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';

import { useClientList } from '@/features/client/hooks/useClientList';
import type { Client } from '@/features/client/types';
import { GenogramPage, type GenogramPageHandle } from '@/genogram';
import type { SerializedGenogram } from '@/genogram/core/models/genogram';
import { trackEvent } from '@/lib/mixpanel';
import {
  fetchRawAIOutput,
  initFamilySummary,
  saveFamilySummary,
} from '@/shared/api/supabase/genogramAIQueries';
import { genogramService } from '@/shared/api/supabase/genogramQueries';
import { MixpanelEvent } from '@/shared/constants/mixpanelEvents';
import {
  clientQueryKeys,
  creditQueryKeys,
  genogramQueryKeys,
} from '@/shared/constants/queryKeys';
import { useDevice } from '@/shared/hooks/useDevice';
import { useNavigateWithUtm } from '@/shared/hooks/useNavigateWithUtm';
import { Button } from '@/shared/ui/atoms/Button';
import { Modal } from '@/shared/ui/composites/Modal';
import { useToast } from '@/shared/ui/composites/Toast';
import { useAuthStore } from '@/stores/authStore';
import { useGenogramNoticeStore } from '@/stores/genogramNoticeStore';
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
  const { isMobile, isTablet } = useDevice();
  const isMobileView = isMobile || isTablet;

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
  const [isMobileNoticeOpen, setIsMobileNoticeOpen] = useState(() => {
    if (!isMobileView) return false;
    const { shown, markShown } = useGenogramNoticeStore.getState();
    if (shown) return false;
    markShown();
    return true;
  });

  const preparedCanvasJsonRef = useRef<string | null>(null);
  const originalCanvasRef = useRef<SerializedGenogram | null>(null);
  const isEditModeRef = useRef(false);

  const activeClients = clients.filter((c) => !c.counsel_done);
  const hasNoClients = !isClientsLoading && activeClients.length === 0;
  const isTemporaryMode = hasNoClients && !exitedTemporaryMode;

  // 임시 모드(내담자 미지정)에서는 저장 대상이 없으므로 자동저장 차단.
  const autoSavePaused =
    isTemporaryMode ||
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
    trackEvent(MixpanelEvent.GenogramStepChange, {
      from: steps.currentStep,
      to: 'analyze',
    });
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
      steps.setError((error as Error).message || '알 수 없는 오류가 생겼어요.');
    } finally {
      steps.setLoading(false);
      setShouldForceRefresh(false);
      // generate-family-summary edge function이 reserve→commit/release를 내부에서 끝낸 상태이므로
      // 응답이 돌아온 시점에 잔액 동기화 (성공/실패 모두 적용 — failure는 release로 환불됨)
      const userIdNum = Number(userId);
      if (!Number.isNaN(userIdNum)) {
        queryClient.invalidateQueries({
          queryKey: creditQueryKeys.summary(userIdNum),
        });
      }
    }
  }, [clientId, steps, shouldForceRefresh, userId, queryClient]);

  const handleNextToRender = useCallback(() => {
    if (!steps.aiOutput) {
      steps.setError('데이터가 없어요.');
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
      trackEvent(MixpanelEvent.GenogramStepChange, {
        from: steps.currentStep,
        to: 'render',
      });
      steps.setStep('render');
    } catch {
      steps.setError('가계도 데이터를 처리하지 못했어요.');
    }
  }, [steps]);

  const handleEditApply = useCallback(async () => {
    if (!clientId || !userId) return;
    if (!steps.aiOutput) {
      steps.setError('데이터가 없어요.');
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
      steps.setError('가계도 데이터를 처리하지 못했어요.');
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
      steps.setError('가계도 데이터 변환 중 오류가 생겼어요.');
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
      toast({ title: '초기화 중 오류가 생겼어요.' });
    } finally {
      setIsResetting(false);
      setIsResetModalOpen(false);
    }
  }, [clientId, userId, queryClient, toast]);

  const handleUndo = useCallback(() => {
    trackEvent(MixpanelEvent.GenogramUndo);
    genogramRef.current?.undo();
    updateGenogramState();
  }, [updateGenogramState]);

  const handleRedo = useCallback(() => {
    trackEvent(MixpanelEvent.GenogramRedo);
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

  const header = isMobileView ? (
    showCanvas && clientId && !steps.isOpen ? (
      <div className="absolute left-0 right-0 top-0 z-10 flex items-center justify-between px-4 py-3">
        <button
          onClick={handleShowBasicInfo}
          className="flex h-10 items-center rounded-md border border-grey-30 bg-white px-4 text-sm text-grey-60 shadow-sm transition-colors lg:hover:bg-grey-10"
        >
          가계도 기본 정보
        </button>
        <button
          onClick={handleExport}
          className="flex h-10 w-10 items-center justify-center rounded-md border border-grey-30 bg-white shadow-sm transition-colors lg:hover:bg-grey-10"
          aria-label="가계도 내보내기"
        >
          <Download className="h-5 w-5 text-grey-80" />
        </button>
      </div>
    ) : null
  ) : (
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
          <span className="text-grey-70">불러오는 중...</span>
        </div>
      );
    }

    if (isTemporaryMode) {
      return (
        <GenogramPage
          key="temporary"
          ref={genogramRef}
          onChange={updateGenogramState}
          readOnly={isMobile}
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
            readOnly={isMobile}
          />
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center px-4">
            <div className="flex h-[200px] w-full max-w-[512px] flex-col justify-center rounded-lg border border-dashed border-grey-30 bg-white p-8 text-center backdrop-blur-sm">
              <p className="text-l font-medium text-grey-60">
                내담자를 선택해 주세요
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
          isMobileView={isMobileView}
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
          isMobileView={isMobileView}
          isMobile={isMobile}
        />
      );
    }

    return (
      <GenogramPage
        key={clientId}
        ref={genogramRef}
        initialData={initialData ?? undefined}
        onChange={handleCanvasChange}
        readOnly={isMobile}
        emptyStateActions={
          hasRecords && (
            <div className="typo-sm flex items-center gap-2">
              <span className="text-grey-70">
                혹시 처음부터 그리는게 어렵나요?
              </span>
              <button
                onClick={() => handleStartFromRecords(true)}
                className="rounded-md border border-grey-40 bg-white px-3 py-1.5 font-medium text-grey-100 transition-colors lg:hover:bg-grey-30"
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
    <>
      <GenogramClientView
        header={header}
        content={content}
        addClientModal={addClientModal}
        resetModal={resetModal}
        exportModal={exportModal}
        guideModal={guideModal}
        reportModal={reportModal}
        isMobileView={false}
      />

      {/* 모바일/태블릿 이용 안내 모달 */}
      <Modal
        open={isMobileNoticeOpen}
        onOpenChange={setIsMobileNoticeOpen}
        className="mx-4 max-w-sm px-6 py-8"
      >
        <div className="flex flex-col items-center gap-6 text-center">
          <h2 className="text-xl font-emphasize text-grey-100">
            {isMobile ? '모바일' : '태블릿'} 이용 안내
          </h2>
          <div className="flex flex-col gap-2">
            <p className="text-m font-emphasize text-grey-100">
              가계도 편집 기능은 PC에서 이용 가능해요.
            </p>
            <p className="text-sm text-grey-60">
              세부적인 편집이 필요한 경우에는
              <br />
              PC 사용을 권장드려요.
            </p>
          </div>
          <Button
            variant="solid"
            tone="primary"
            size="lg"
            onClick={() => setIsMobileNoticeOpen(false)}
            className="w-full"
          >
            확인
          </Button>
        </div>
      </Modal>
    </>
  );
}

export default GenogramClientContainer;

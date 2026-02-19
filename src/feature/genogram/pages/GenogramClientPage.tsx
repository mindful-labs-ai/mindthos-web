import { useCallback, useEffect, useRef, useState } from 'react';

import { useQueryClient } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';

import { useToast } from '@/components/ui/composites/Toast';
import { AddClientModal } from '@/feature/client/components/AddClientModal';
import { clientQueryKeys } from '@/feature/client/constants/queryKeys';
import { useClientList } from '@/feature/client/hooks/useClientList';
import type { Client } from '@/feature/client/types';
import { GenogramPage, type GenogramPageHandle } from '@/genogram';
import type { SerializedGenogram } from '@/genogram/core/models/genogram';
import { useNavigateWithUtm } from '@/shared/hooks/useNavigateWithUtm';
import { useAuthStore } from '@/stores/authStore';

import { GenogramExportModal } from '../components/export';
import { GenogramEmptyState } from '../components/GenogramEmptyState';
import { GenogramGenerationSteps } from '../components/GenogramGenerationSteps';
import {
  DEFAULT_GUIDE_STEPS,
  GenogramGuideModal,
  GUIDE_DONT_SHOW_AGAIN_KEY,
} from '../components/GenogramGuideModal';
import { GenogramPageHeader } from '../components/GenogramPageHeader';
import { ResetConfirmModal } from '../components/ResetConfirmModal';
import { useClientFamilySummary } from '../hooks/useClientFamilySummary';
import { useClientHasRecords } from '../hooks/useClientHasRecords';
import { useGenogramData } from '../hooks/useGenogramData';
import { useGenogramSteps } from '../hooks/useGenogramSteps';
import {
  fetchRawAIOutput,
  initFamilySummary,
  saveFamilySummary,
} from '../services/genogramAIService';
import { genogramService } from '../services/genogramService';
import {
  convertAIJsonToCanvas,
  convertCanvasToAIJson,
  extractPositionsFromCanvas,
} from '../utils/aiJsonConverter';

export function GenogramClientPage() {
  const [searchParams] = useSearchParams();
  const clientId = searchParams.get('clientId');
  const { setSearchParamsWithUtm } = useNavigateWithUtm();
  const { toast } = useToast();

  const userId = useAuthStore((s) => s.userId);
  const queryClient = useQueryClient();
  const { clients, isLoading: isClientsLoading } = useClientList();
  const genogramRef = useRef<GenogramPageHandle>(null);

  const selectedClient = clients.find((c) => c.id === clientId) ?? null;

  // 클라이언트의 상담 기록 유무 확인
  const { hasRecords } = useClientHasRecords(clientId ?? '');

  // 클라이언트의 family_summary 조회 (AI 분석 결과)
  const { familySummary: _familySummary, isLoading: isFamilySummaryLoading } =
    useClientFamilySummary(clientId ?? '');

  // 스텝 상태
  const steps = useGenogramSteps();

  // 클라이언트 변경 시 스텝 초기화
  useEffect(() => {
    steps.reset();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clientId]);

  const {
    initialData,
    hasData,
    isLoading: isDataLoading,
    isSaving,
    lastSavedAt,
    onChange,
    saveNow,
  } = useGenogramData(clientId ?? '');

  // Undo/Redo 및 패널 상태 추적
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);
  const [isPanelOpen, setIsPanelOpen] = useState(false);

  // 임시 캔버스 모드 (클라이언트 없이 사용)
  const [temporaryData, setTemporaryData] = useState<string | null>(null);
  const [isAddClientModalOpen, setIsAddClientModalOpen] = useState(false);
  // 사용자가 명시적으로 임시 모드를 종료했는지 추적
  const [exitedTemporaryMode, setExitedTemporaryMode] = useState(false);

  // 가계도 초기화 상태
  const [isResetting, setIsResetting] = useState(false);
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);

  // 이미지 내보내기 상태
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);

  // 빈 캔버스에서 AI 생성 시작 여부 (forceRefresh용)
  const [shouldForceRefresh, setShouldForceRefresh] = useState(false);
  const [exportImageData, setExportImageData] = useState<string | null>(null);

  // 가계도 안내 모달 상태
  const [isGuideModalOpen, setIsGuideModalOpen] = useState(false);

  // 활성 클라이언트 (counsel_done 제외)
  const activeClients = clients.filter((c) => !c.counsel_done);
  const hasNoClients = !isClientsLoading && activeClients.length === 0;

  // 임시 모드: 클라이언트가 없고, 아직 종료하지 않았을 때
  const isTemporaryMode = hasNoClients && !exitedTemporaryMode;

  // 상태 업데이트 (onChange 시)
  const updateGenogramState = useCallback(() => {
    setCanUndo(genogramRef.current?.canUndo() ?? false);
    setCanRedo(genogramRef.current?.canRedo() ?? false);
    setIsPanelOpen(genogramRef.current?.isPanelOpen() ?? false);
  }, []);

  // 직접 가계도 그리기
  const [isStarting, setIsStarting] = useState(false);
  // render 단계에서 로드할 캔버스 JSON (확인하기 버튼 클릭 시 로드)
  const preparedCanvasJsonRef = useRef<string | null>(null);
  // 가족 구성원 정보 수정 시 원본 캔버스 데이터 (좌표 유지용)
  const originalCanvasRef = useRef<SerializedGenogram | null>(null);
  // edit 모드에서 render 단계로 전환했는지 추적 (애니메이션 스킵용)
  const isEditModeRef = useRef(false);
  const handleStartEmpty = useCallback(async () => {
    if (!clientId || !userId) return;
    setIsStarting(true);
    try {
      // 빈 genogram 데이터 저장
      await genogramService.save(clientId, userId, '{}');
      // 쿼리 캐시 업데이트 → hasData가 true가 됨
      queryClient.setQueryData(['genogram', clientId], '{}');
    } catch (e) {
      console.error('Failed to create empty genogram:', e);
    } finally {
      setIsStarting(false);
    }
  }, [clientId, userId, queryClient]);

  // AI로 가계도 생성하기 - confirm 단계로 시작
  const handleStartFromRecords = useCallback(
    (forceRefresh = false) => {
      if (!clientId) return;
      setShouldForceRefresh(forceRefresh);
      steps.open('confirm');
    },
    [clientId, steps]
  );

  // confirm 단계에서 확인 버튼 클릭 시 - analyze 단계로 이동 + API 호출
  const handleConfirm = useCallback(async () => {
    if (!clientId) return;

    // analyze 단계로 이동
    steps.setStep('analyze');

    // API 호출 (빈 캔버스에서 시작 시 forceRefresh)
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

  // 가족 구성원 분석 -> 가계도 그리기 (analyze 단계용)
  const handleNextToRender = useCallback(() => {
    if (!steps.aiOutput) {
      steps.setError('데이터가 없습니다.');
      return;
    }

    try {
      // 원본 캔버스에서 기존 좌표 추출 (있는 경우)
      const existingPositions = originalCanvasRef.current
        ? extractPositionsFromCanvas(originalCanvasRef.current, steps.aiOutput)
        : undefined;

      // aiJsonConverter로 변환 (기존 좌표 유지)
      const canvasData = convertAIJsonToCanvas(steps.aiOutput, {
        existingPositions,
      });
      const canvasJson = JSON.stringify(canvasData);

      // 캔버스 JSON을 ref에 저장 (확인하기 버튼 클릭 시 로드)
      preparedCanvasJsonRef.current = canvasJson;

      // 원본 캔버스 ref 초기화
      originalCanvasRef.current = null;

      // 가계도 그리기 단계로 이동
      steps.setStep('render');
    } catch {
      steps.setError('JSON 변환 중 오류가 발생했습니다.');
    }
  }, [steps]);

  // 가족 구성원 정보 편집 -> 가계도에 적용 (edit 단계용, render 단계 스킵)
  const handleEditApply = useCallback(async () => {
    if (!clientId || !userId) return;
    if (!steps.aiOutput) {
      steps.setError('데이터가 없습니다.');
      return;
    }

    try {
      // 원본 캔버스에서 기존 좌표 추출 (좌표 보존)
      const existingPositions = originalCanvasRef.current
        ? extractPositionsFromCanvas(originalCanvasRef.current, steps.aiOutput)
        : undefined;

      // aiJsonConverter로 변환 (기존 좌표 유지)
      const canvasData = convertAIJsonToCanvas(steps.aiOutput, {
        existingPositions,
      });
      const canvasJson = JSON.stringify(canvasData);

      // 1. 캔버스 데이터를 genograms 테이블에 저장
      await genogramService.save(clientId, userId, canvasJson);

      // 2. AI output을 clients.family_summary에 저장
      await saveFamilySummary(clientId, steps.aiOutput);
      queryClient.setQueryData(
        ['clientFamilySummary', clientId],
        steps.aiOutput
      );

      // 쿼리 캐시 업데이트 → hasData가 true가 됨
      queryClient.setQueryData(['genogram', clientId], canvasJson);

      // ref 초기화
      originalCanvasRef.current = null;

      // 상태 리셋 → 캔버스로 바로 전환
      steps.reset();
    } catch {
      steps.setError('JSON 변환 중 오류가 발생했습니다.');
    }
  }, [clientId, userId, steps, queryClient]);

  // 가족 구성원 정보 버튼 클릭 (캔버스 → AI JSON 역변환)
  const handleShowBasicInfo = useCallback(async () => {
    const canvasJson = genogramRef.current?.toJSON();
    if (!canvasJson) {
      return;
    }

    // edit 모드 열고 로딩 시작
    steps.open('edit');
    steps.setLoading(true);
    steps.setError(null);

    try {
      // 실제 변환 로직 (처리 시간 반영)
      const canvasData = JSON.parse(canvasJson) as SerializedGenogram;
      originalCanvasRef.current = canvasData; // 좌표 보존용 저장
      const aiOutput = convertCanvasToAIJson(canvasData);
      steps.updateAiOutput(aiOutput);
    } catch {
      steps.setError('가계도 데이터 변환 중 오류가 발생했습니다.');
    } finally {
      steps.setLoading(false);
    }
  }, [steps]);

  // edit 모드 취소
  const handleEditCancel = useCallback(() => {
    originalCanvasRef.current = null;
    isEditModeRef.current = false;
    steps.reset();
  }, [steps]);

  // 가계도 그리기 완료 및 DB 저장
  const handleStepsComplete = useCallback(async () => {
    if (!clientId || !userId) return;

    const canvasJson = preparedCanvasJsonRef.current;
    if (!canvasJson) {
      steps.reset();
      return;
    }

    try {
      // 1. 캔버스 데이터를 genograms 테이블에 저장
      await genogramService.save(clientId, userId, canvasJson);

      // 2. AI output을 clients.family_summary에 저장
      if (steps.aiOutput) {
        await saveFamilySummary(clientId, steps.aiOutput);
        // family_summary 캐시 업데이트
        queryClient.setQueryData(
          ['clientFamilySummary', clientId],
          steps.aiOutput
        );
      }

      // 쿼리 캐시 업데이트 → hasData가 true가 됨
      queryClient.setQueryData(['genogram', clientId], canvasJson);

      // edit 모드 여부 저장 후 ref 초기화
      const wasEditMode = isEditModeRef.current;
      preparedCanvasJsonRef.current = null;
      isEditModeRef.current = false;

      // 상태 리셋 → 캔버스 유지
      steps.reset();

      // edit 모드가 아닐 때만 안내 모달 표시 ("다시 보지 않기" 미선택 시)
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

  // 클라이언트 변경
  const handleClientSelect = useCallback(
    (client: Client | null) => {
      if (client) {
        setSearchParamsWithUtm({ clientId: client.id });
        // 클라이언트 선택 시 임시 모드 종료
        setExitedTemporaryMode(true);
      } else {
        setSearchParamsWithUtm({});
      }
    },
    [setSearchParamsWithUtm]
  );

  // 클라이언트 추가 모달 열기
  const handleOpenAddClientModal = useCallback(() => {
    // 임시 모드에서 클라이언트 추가 시 현재 캔버스 데이터 저장
    if (isTemporaryMode) {
      const json = genogramRef.current?.toJSON();
      if (json) {
        setTemporaryData(json);
      }
    }
    setIsAddClientModalOpen(true);
  }, [isTemporaryMode]);

  // 클라이언트 추가 모달 닫기 핸들러
  const handleAddClientModalClose = useCallback((open: boolean) => {
    setIsAddClientModalOpen(open);
  }, []);

  // 클라이언트 생성 완료 콜백 (생성된 클라이언트 ID 직접 수신)
  const handleClientCreated = useCallback(
    async (newClientId: string) => {
      if (!userId) return;

      // 임시 데이터가 있으면 새 클라이언트에 저장
      if (temporaryData) {
        try {
          await genogramService.save(newClientId, userId, temporaryData);
          // 쿼리 캐시 업데이트
          queryClient.setQueryData(['genogram', newClientId], temporaryData);
          setTemporaryData(null);
        } catch (e) {
          console.error('Failed to save genogram to new client:', e);
        }
      }

      // 클라이언트 목록 갱신
      queryClient.invalidateQueries({ queryKey: ['clients'] });

      // 새 클라이언트로 이동
      setSearchParamsWithUtm({ clientId: newClientId });
      setExitedTemporaryMode(true);
    },
    [temporaryData, userId, setSearchParamsWithUtm, queryClient]
  );

  // Export (이미지 내보내기)
  const handleExport = useCallback(async () => {
    const imageData = await genogramRef.current?.captureImage();
    if (imageData) {
      setExportImageData(imageData);
      setIsExportModalOpen(true);
    }
  }, []);

  // 수동 저장
  const handleSave = useCallback(() => {
    const json = genogramRef.current?.toJSON();
    if (json) {
      saveNow(json);
    }
  }, [saveNow]);

  // 가계도 초기화 모달 열기
  const handleReset = useCallback(() => {
    setIsResetModalOpen(true);
  }, []);

  // 가계도 초기화 실행
  const handleResetConfirm = useCallback(async () => {
    if (!clientId || !userId) return;

    setIsResetting(true);
    try {
      const result = await initFamilySummary(clientId, true);

      if (!result.success) {
        toast({ title: '초기화 실패' });
        return;
      }

      // 쿼리 캐시 즉시 초기화 → hasData가 false가 됨
      queryClient.setQueryData(['genogram', clientId], null);
      queryClient.setQueryData(['clientFamilySummary', clientId], null);

      // 쿼리 캐시 무효화 (백그라운드 refetch)
      queryClient.invalidateQueries({ queryKey: ['genogram', clientId] });
      queryClient.invalidateQueries({
        queryKey: ['clientFamilySummary', clientId],
      });
      // 클라이언트 목록 갱신 (family_summary 필드 반영)
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

  // 로딩 상태 (family_summary 로딩 포함)
  const isLoading =
    isClientsLoading ||
    (clientId && isDataLoading) ||
    (clientId && isFamilySummaryLoading);
  const showCanvas = (clientId && hasData) || isTemporaryMode;

  return (
    <div className="relative h-full">
      {/* 캔버스 위 오버레이: 드롭다운 + 액션 버튼 */}
      <GenogramPageHeader
        clients={clients}
        selectedClient={selectedClient}
        onClientSelect={handleClientSelect}
        onUndo={() => {
          genogramRef.current?.undo();
          updateGenogramState();
        }}
        onRedo={() => {
          genogramRef.current?.redo();
          updateGenogramState();
        }}
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
        onShowBasicInfo={
          showCanvas && clientId ? handleShowBasicInfo : undefined
        }
      />

      {/* 콘텐츠 영역 */}
      {isLoading || isStarting ? (
        <div className="flex h-full items-center justify-center">
          <span className="text-fg-muted">불러오는 중...</span>
        </div>
      ) : isTemporaryMode ? (
        // 클라이언트 없이 임시 캔버스 모드
        <GenogramPage
          key="temporary"
          ref={genogramRef}
          onChange={updateGenogramState}
        />
      ) : !clientId ? (
        // 클라이언트 미선택: 캔버스 + 중앙 안내 카드
        <>
          <GenogramPage
            key="no-client"
            ref={genogramRef}
            onChange={updateGenogramState}
            hideToolbar
          />
          <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center">
            <div className="flex h-[200px] w-[512px] flex-col justify-center rounded-lg border border-dashed border-border bg-white p-8 text-center backdrop-blur-sm">
              <p className="text-lg font-medium text-fg-muted">
                클라이언트를 선택해주세요
              </p>
            </div>
          </div>
        </>
      ) : steps.isOpen ? (
        // confirm, analyze, edit, render 단계: 스텝 UI (hasData 여부와 무관하게 우선)
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
            steps.currentStep === 'edit'
              ? handleEditApply
              : handleNextToRender
          }
          onComplete={handleStepsComplete}
          onCancel={steps.reset}
          onEditCancel={handleEditCancel}
        />
      ) : !hasData ? (
        <GenogramEmptyState
          onStartEmpty={handleStartEmpty}
          onStartFromRecords={handleStartFromRecords}
          isGenerating={false}
          hasRecords={hasRecords}
        />
      ) : (
        <GenogramPage
          key={clientId}
          ref={genogramRef}
          initialData={initialData ?? undefined}
          onChange={(json) => {
            onChange(json);
            updateGenogramState();
          }}
          emptyStateActions={
            hasRecords && (
              <div className="flex items-center gap-2 text-sm">
                <span className="text-fg-muted">
                  혹시 처음부터 그리는게 어렵나요?
                </span>
                <button
                  onClick={() => handleStartFromRecords(true)}
                  className="rounded-md border border-border bg-white px-3 py-1.5 font-medium text-fg transition-colors hover:bg-surface-strong"
                >
                  AI로 자동 생성하기
                </button>
              </div>
            )
          }
        />
      )}

      {/* 클라이언트 추가 모달 */}
      <AddClientModal
        open={isAddClientModalOpen}
        onOpenChange={handleAddClientModalClose}
        onClientCreated={handleClientCreated}
      />

      {/* 가계도 초기화 확인 모달 */}
      <ResetConfirmModal
        open={isResetModalOpen}
        onOpenChange={setIsResetModalOpen}
        clientName={selectedClient?.name ?? ''}
        onConfirm={handleResetConfirm}
        isLoading={isResetting}
      />

      {/* 이미지 내보내기 모달 */}
      {isExportModalOpen && (
        <GenogramExportModal
          key={exportImageData?.slice(0, 50)}
          open={isExportModalOpen}
          onOpenChange={setIsExportModalOpen}
          imageData={exportImageData}
          defaultFileName={`${selectedClient?.name ?? '가계도'}_${new Date().toISOString().slice(2, 10).replace(/-/g, '')}`}
          watermarkSrc="/genogram/genogram-export-watermark.png"
        />
      )}

      {/* 가계도 안내 모달 */}
      <GenogramGuideModal
        open={isGuideModalOpen}
        onOpenChange={setIsGuideModalOpen}
        steps={DEFAULT_GUIDE_STEPS}
        onDontShowAgain={() => {
          localStorage.setItem(GUIDE_DONT_SHOW_AGAIN_KEY, 'true');
        }}
      />
    </div>
  );
}

import { useCallback, useEffect, useRef, useState } from 'react';

import { useQueryClient } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';

import { AddClientModal } from '@/feature/client/components/AddClientModal';
import { clientQueryKeys } from '@/feature/client/constants/queryKeys';
import { useClientList } from '@/feature/client/hooks/useClientList';
import type { Client } from '@/feature/client/types';
import { GenogramPage, type GenogramPageHandle } from '@/genogram';
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
} from '../services/genogramAIService';
import { genogramService } from '../services/genogramService';
import { convertAIJsonToCanvas } from '../utils/aiJsonConverter';

export function GenogramClientPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const clientId = searchParams.get('clientId');

  const userId = useAuthStore((s) => s.userId);
  const queryClient = useQueryClient();
  const { clients, isLoading: isClientsLoading } = useClientList();
  const genogramRef = useRef<GenogramPageHandle>(null);

  const selectedClient = clients.find((c) => c.id === clientId) ?? null;

  // 클라이언트의 상담 기록 유무 확인
  const { hasRecords } = useClientHasRecords(clientId ?? '');

  // 클라이언트의 family_summary 조회 (AI 분석 결과)
  const { familySummary, isLoading: isFamilySummaryLoading } =
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
  const handleStartFromRecords = useCallback(() => {
    if (!clientId) return;
    steps.open('confirm');
  }, [clientId, steps]);

  // confirm 단계에서 확인 버튼 클릭 시 - analyze 단계로 이동 + API 호출
  const handleConfirm = useCallback(async () => {
    if (!clientId) return;

    // analyze 단계로 이동
    steps.setStep('analyze');

    // family_summary가 있으면 바로 사용
    if (familySummary) {
      steps.setAiOutput(familySummary);
      steps.setEditedJson(JSON.stringify(familySummary, null, 2));
      return;
    }

    // family_summary가 없으면 API 호출
    steps.setLoading(true);
    steps.setError(null);

    try {
      const result = await fetchRawAIOutput(clientId);

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
    }
  }, [clientId, familySummary, steps]);

  // 가족 구성원 분석 -> 가계도 그리기
  const handleNextToRender = useCallback(() => {
    if (!steps.aiOutput) {
      steps.setError('데이터가 없습니다.');
      return;
    }

    try {
      // aiJsonConverter로 변환
      const canvasData = convertAIJsonToCanvas(steps.aiOutput);
      const canvasJson = JSON.stringify(canvasData);

      // 캔버스 JSON을 ref에 저장 (확인하기 버튼 클릭 시 로드)
      preparedCanvasJsonRef.current = canvasJson;

      // 가계도 그리기 단계로 이동
      steps.setStep('render');
    } catch {
      steps.setError('JSON 변환 중 오류가 발생했습니다.');
    }
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
      // DB 저장
      await genogramService.save(clientId, userId, canvasJson);
      // 쿼리 캐시 업데이트 → hasData가 true가 됨
      queryClient.setQueryData(['genogram', clientId], canvasJson);
      // ref 초기화
      preparedCanvasJsonRef.current = null;
      // 상태 리셋 → 캔버스 유지
      steps.reset();

      // "다시 보지 않기"를 선택하지 않았으면 안내 모달 표시
      const dontShowAgain = localStorage.getItem(GUIDE_DONT_SHOW_AGAIN_KEY);
      if (dontShowAgain !== 'true') {
        setIsGuideModalOpen(true);
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
        setSearchParams({ clientId: client.id });
        // 클라이언트 선택 시 임시 모드 종료
        setExitedTemporaryMode(true);
      } else {
        setSearchParams({});
      }
    },
    [setSearchParams]
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
      setSearchParams({ clientId: newClientId });
      setExitedTemporaryMode(true);
    },
    [temporaryData, userId, setSearchParams, queryClient]
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
        alert(`초기화 실패: ${result.error.message}`);
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
      alert('초기화 중 오류가 발생했습니다.');
    } finally {
      setIsResetting(false);
      setIsResetModalOpen(false);
    }
  }, [clientId, userId, queryClient]);

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
        showActions={!!showCanvas}
        canUndo={canUndo}
        canRedo={canRedo}
        isPanelOpen={isPanelOpen}
        isSaving={isSaving}
        lastSavedAt={lastSavedAt}
        onAddClient={handleOpenAddClientModal}
        isTemporaryMode={isTemporaryMode}
        onReset={showCanvas && clientId ? handleReset : undefined}
        isResetting={isResetting}
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
            <div className="flex h-[200px] w-[280px] flex-col justify-center rounded-lg border border-dashed border-border bg-white p-8 text-center backdrop-blur-sm">
              <p className="text-lg font-medium text-fg-muted">
                클라이언트를 선택해주세요
              </p>
            </div>
          </div>
        </>
      ) : !hasData ? (
        steps.isOpen ? (
          // confirm, analyze, render 단계: 스텝 UI
          <GenogramGenerationSteps
            currentStep={steps.currentStep}
            isLoading={steps.isLoading}
            error={steps.error}
            aiOutput={steps.aiOutput}
            clientName={selectedClient?.name}
            isRenderPending={false}
            onConfirm={handleConfirm}
            onAiOutputChange={steps.updateAiOutput}
            onNextToRender={handleNextToRender}
            onComplete={handleStepsComplete}
            onCancel={steps.reset}
          />
        ) : (
          <GenogramEmptyState
            onStartEmpty={handleStartEmpty}
            onStartFromRecords={handleStartFromRecords}
            isGenerating={false}
            hasRecords={hasRecords}
          />
        )
      ) : (
        <GenogramPage
          key={clientId}
          ref={genogramRef}
          initialData={initialData ?? undefined}
          onChange={(json) => {
            onChange(json);
            updateGenogramState();
          }}
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

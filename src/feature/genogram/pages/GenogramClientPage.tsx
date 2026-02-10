import { useCallback, useEffect, useRef, useState } from 'react';

import { useQueryClient } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';

import { AddClientModal } from '@/feature/client/components/AddClientModal';
import { useClientList } from '@/feature/client/hooks/useClientList';
import type { Client } from '@/feature/client/types';
import { GenogramPage, type GenogramPageHandle } from '@/genogram';
import { useAuthStore } from '@/stores/authStore';

import { GenogramEmptyState } from '../components/GenogramEmptyState';
import { GenogramGenerationSteps } from '../components/GenogramGenerationSteps';
import { GenogramPageHeader } from '../components/GenogramPageHeader';
import { useClientFamilySummary } from '../hooks/useClientFamilySummary';
import { useClientHasRecords } from '../hooks/useClientHasRecords';
import { useGenogramData } from '../hooks/useGenogramData';
import { useGenogramSteps } from '../hooks/useGenogramSteps';
import { fetchRawAIOutput } from '../services/genogramAIService';
import { genogramService } from '../services/genogramService';
import { convertAIJsonToCanvas, isValidAIJson } from '../utils/aiJsonConverter';

export function GenogramClientPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const clientId = searchParams.get('clientId');

  const userId = useAuthStore((s) => s.userId);
  const queryClient = useQueryClient();
  const { clients, isLoading: isClientsLoading } = useClientList();
  const genogramRef = useRef<GenogramPageHandle>(null);

  // 첫 번째 클라이언트 자동 선택
  useEffect(() => {
    if (!clientId && clients.length > 0 && !isClientsLoading) {
      // counsel_done이 아닌 첫 번째 클라이언트 선택
      const firstClient = clients.find((c) => !c.counsel_done);
      if (firstClient) {
        setSearchParams({ clientId: firstClient.id }, { replace: true });
      }
    }
  }, [clientId, clients, isClientsLoading, setSearchParams]);

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
  // render 단계에서 로드할 캔버스 JSON (타이밍 이슈 해결용)
  const [pendingCanvasJson, setPendingCanvasJson] = useState<string | null>(
    null
  );
  const handleStartEmpty = useCallback(async () => {
    if (!clientId || !userId) return;
    setIsStarting(true);
    try {
      // 빈 genogram 데이터 저장
      await genogramService.save(clientId, userId, '{}');
      // 리로드하여 hasData가 true가 되도록 함
      window.location.reload();
    } catch (e) {
      console.error('Failed to create empty genogram:', e);
      setIsStarting(false);
    }
  }, [clientId, userId]);

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

      // 캔버스 JSON을 pending 상태에 저장 (useEffect에서 로드)
      setPendingCanvasJson(canvasJson);

      // 가계도 그리기 단계로 이동
      steps.setStep('render');
    } catch {
      steps.setError('JSON 변환 중 오류가 발생했습니다.');
    }
  }, [steps]);

  // render 단계에서 캔버스에 JSON 로드 (타이밍 이슈 해결)
  useEffect(() => {
    if (steps.currentStep === 'render' && pendingCanvasJson) {
      let cancelled = false;
      let rafId: number;

      // GenogramPage 마운트 후 ref가 할당될 때까지 대기
      const loadCanvas = () => {
        if (cancelled) return;
        if (genogramRef.current) {
          genogramRef.current.loadJSON(pendingCanvasJson);
          updateGenogramState();
          setPendingCanvasJson(null);
        } else {
          // ref가 아직 없으면 다음 프레임에 재시도
          rafId = requestAnimationFrame(loadCanvas);
        }
      };
      rafId = requestAnimationFrame(loadCanvas);

      return () => {
        cancelled = true;
        cancelAnimationFrame(rafId);
      };
    }
  }, [steps.currentStep, pendingCanvasJson, updateGenogramState]);

  // 가계도 그리기 완료 및 DB 저장
  const handleStepsComplete = useCallback(async () => {
    if (!clientId || !userId) return;

    // DB 저장
    const json = genogramRef.current?.toJSON();
    if (json) {
      try {
        await genogramService.save(clientId, userId, json);
        // 쿼리 캐시 업데이트 → hasData가 true가 됨
        queryClient.setQueryData(['genogram', clientId], json);
        // 상태 리셋 → 캔버스 유지
        steps.reset();
      } catch (e) {
        console.error('Failed to save genogram:', e);
        steps.reset();
      }
    } else {
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
          setTemporaryData(null);
        } catch (e) {
          console.error('Failed to save genogram to new client:', e);
        }
      }

      // 새 클라이언트로 이동
      setSearchParams({ clientId: newClientId });
      setExitedTemporaryMode(true);

      // 데이터 갱신을 위해 리로드
      window.location.reload();
    },
    [temporaryData, userId, setSearchParams]
  );

  // Export (클립보드 복사)
  const handleExport = useCallback(() => {
    const json = genogramRef.current?.toJSON();
    if (json) {
      navigator.clipboard.writeText(json);
    }
  }, []);

  // Canvas JSON Import (이미 렌더링 가능한 형식)
  const handleImportCanvasJson = useCallback(
    (jsonStr: string) => {
      try {
        JSON.parse(jsonStr); // 유효한 JSON인지 확인
        genogramRef.current?.loadJSON(jsonStr);
        updateGenogramState();
      } catch (e) {
        console.error('Invalid Canvas JSON:', e);
        alert('유효하지 않은 JSON 형식입니다.');
      }
    },
    [updateGenogramState]
  );

  // AI Raw JSON Import (후처리 후 렌더링)
  const handleImportAIJson = useCallback(
    (jsonStr: string) => {
      try {
        const aiOutput = JSON.parse(jsonStr);

        if (!isValidAIJson(aiOutput)) {
          alert('유효하지 않은 AI JSON 형식입니다.\npeople 배열이 필요합니다.');
          return;
        }

        // AI JSON → Canvas 형식으로 변환
        const canvasData = convertAIJsonToCanvas(aiOutput);
        const canvasJson = JSON.stringify(canvasData);

        // 캔버스에 로드
        genogramRef.current?.loadJSON(canvasJson);
        updateGenogramState();
      } catch (e) {
        console.error('AI JSON Import Error:', e);
        alert('AI JSON 변환 중 오류가 발생했습니다.');
      }
    },
    [updateGenogramState]
  );

  // 수동 저장
  const handleSave = useCallback(() => {
    const json = genogramRef.current?.toJSON();
    if (json) {
      saveNow(json);
    }
  }, [saveNow]);

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
        onImportCanvasJson={showCanvas ? handleImportCanvasJson : undefined}
        onImportAIJson={showCanvas ? handleImportAIJson : undefined}
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
        <div className="flex h-full items-center justify-center">
          <span className="text-fg-muted">클라이언트를 선택해주세요</span>
        </div>
      ) : !hasData ? (
        steps.isOpen ? (
          steps.currentStep === 'render' ? (
            // render 단계: 캔버스 + 완료 오버레이
            <>
              <GenogramPage
                key={`${clientId}-render`}
                ref={genogramRef}
                onChange={updateGenogramState}
              />
              <GenogramGenerationSteps
                currentStep={steps.currentStep}
                isLoading={steps.isLoading}
                error={steps.error}
                aiOutput={steps.aiOutput}
                clientName={selectedClient?.name}
                onConfirm={handleConfirm}
                onAiOutputChange={steps.updateAiOutput}
                onNextToRender={handleNextToRender}
                onComplete={handleStepsComplete}
              />
            </>
          ) : (
            // confirm 또는 analyze 단계: 스텝 UI만
            <GenogramGenerationSteps
              currentStep={steps.currentStep}
              isLoading={steps.isLoading}
              error={steps.error}
              aiOutput={steps.aiOutput}
              clientName={selectedClient?.name}
              onConfirm={handleConfirm}
              onAiOutputChange={steps.updateAiOutput}
              onNextToRender={handleNextToRender}
              onComplete={handleStepsComplete}
            />
          )
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
    </div>
  );
}

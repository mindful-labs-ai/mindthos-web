import { useCallback, useEffect, useRef, useState } from 'react';

import { useSearchParams } from 'react-router-dom';

import { AddClientModal } from '@/feature/client/components/AddClientModal';
import { useClientList } from '@/feature/client/hooks/useClientList';
import type { Client } from '@/feature/client/types';
import { GenogramPage, type GenogramPageHandle } from '@/genogram';
import { useAuthStore } from '@/stores/authStore';

import { GenogramEmptyState } from '../components/GenogramEmptyState';
import { GenogramPageHeader } from '../components/GenogramPageHeader';
import { useClientHasRecords } from '../hooks/useClientHasRecords';
import { useGenogramData } from '../hooks/useGenogramData';
import { useGenogramGeneration } from '../hooks/useGenogramGeneration';
import { genogramService } from '../services/genogramService';
import { convertAIJsonToCanvas, isValidAIJson } from '../utils/aiJsonConverter';

export function GenogramClientPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const clientId = searchParams.get('clientId');

  const userId = useAuthStore((s) => s.userId);
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

  // AI로 가계도 생성하기
  // API가 이미 genograms 테이블에 저장하므로 리로드만 수행
  const { generate: generateGenogram, isGenerating } = useGenogramGeneration({
    onSuccess: () => {
      // API에서 이미 저장 완료됨, 리로드하여 캔버스 표시
      window.location.reload();
    },
    onError: (error) => {
      console.error('Failed to generate genogram:', error);
      alert(error.message || '가계도 생성에 실패했습니다.');
    },
  });

  const handleStartFromRecords = useCallback(() => {
    if (!clientId || !userId) return;
    generateGenogram({ clientId, userId });
  }, [clientId, userId, generateGenogram]);

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
  const handleImportCanvasJson = useCallback((jsonStr: string) => {
    try {
      JSON.parse(jsonStr); // 유효한 JSON인지 확인
      genogramRef.current?.loadJSON(jsonStr);
      updateGenogramState();
    } catch (e) {
      console.error('Invalid Canvas JSON:', e);
      alert('유효하지 않은 JSON 형식입니다.');
    }
  }, [updateGenogramState]);

  // AI Raw JSON Import (후처리 후 렌더링)
  const handleImportAIJson = useCallback((jsonStr: string) => {
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
  }, [updateGenogramState]);

  // 수동 저장
  const handleSave = useCallback(() => {
    const json = genogramRef.current?.toJSON();
    if (json) {
      saveNow(json);
    }
  }, [saveNow]);

  // 로딩 상태
  const isLoading = isClientsLoading || (clientId && isDataLoading);
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
        <GenogramEmptyState
          onStartEmpty={handleStartEmpty}
          onStartFromRecords={handleStartFromRecords}
          isGenerating={isGenerating}
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

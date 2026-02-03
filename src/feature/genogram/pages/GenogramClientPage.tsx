import { useCallback, useEffect, useRef, useState } from 'react';

import { useSearchParams } from 'react-router-dom';

import { useClientList } from '@/feature/client/hooks/useClientList';
import type { Client } from '@/feature/client/types';
import { GenogramPage, type GenogramPageHandle } from '@/genogram';
import { useAuthStore } from '@/stores/authStore';

import { GenogramEmptyState } from '../components/GenogramEmptyState';
import { GenogramPageHeader } from '../components/GenogramPageHeader';
import { useGenogramData } from '../hooks/useGenogramData';
import { genogramService } from '../services/genogramService';

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

  // 상태 업데이트 (onChange 시)
  const updateGenogramState = useCallback(() => {
    setCanUndo(genogramRef.current?.canUndo() ?? false);
    setCanRedo(genogramRef.current?.canRedo() ?? false);
    setIsPanelOpen(genogramRef.current?.isPanelOpen() ?? false);
  }, []);

  // 빈 화면으로 시작하기
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

  // 클라이언트 변경
  const handleClientSelect = useCallback(
    (client: Client | null) => {
      if (client) {
        setSearchParams({ clientId: client.id });
      } else {
        setSearchParams({});
      }
    },
    [setSearchParams]
  );

  // Export (클립보드 복사)
  const handleExport = useCallback(() => {
    const json = genogramRef.current?.toJSON();
    if (json) {
      navigator.clipboard.writeText(json);
    }
  }, []);

  // 수동 저장
  const handleSave = useCallback(() => {
    const json = genogramRef.current?.toJSON();
    if (json) {
      saveNow(json);
    }
  }, [saveNow]);

  // 로딩 상태
  const isLoading = isClientsLoading || (clientId && isDataLoading);
  const showCanvas = clientId && hasData;

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
      />

      {/* 콘텐츠 영역 */}
      {isLoading || isStarting ? (
        <div className="flex h-full items-center justify-center">
          <span className="text-fg-muted">불러오는 중...</span>
        </div>
      ) : !clientId ? (
        <div className="flex h-full items-center justify-center">
          <span className="text-fg-muted">클라이언트를 선택해주세요</span>
        </div>
      ) : !hasData ? (
        <GenogramEmptyState onStartEmpty={handleStartEmpty} />
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
    </div>
  );
}

import { useEffect, useRef, useState } from 'react';

import { Check, Download, Loader2, MoreVertical, Save } from 'lucide-react';

import type { Client } from '@/feature/client/types';
import { useSavedIndicator } from '@/feature/genogram/hooks/useSavedIndicator';
import { RedoIcon, UndoIcon } from '@/shared/icons';

import { ClientDropdown } from './ClientDropdown';

/** 우측 속성 패널 너비 (GenogramPropertyPanel과 동일) */
const PANEL_WIDTH = 320;

interface GenogramPageHeaderProps {
  clients: Client[];
  selectedClient: Client | null;
  onClientSelect: (client: Client | null) => void;
  onUndo: () => void;
  onRedo: () => void;
  onExport: () => void;
  onSave: () => void;
  showActions: boolean;
  canUndo?: boolean;
  canRedo?: boolean;
  isPanelOpen?: boolean;
  isSaving?: boolean;
  lastSavedAt?: Date | null;
  /** 클라이언트 추가 핸들러 */
  onAddClient?: () => void;
  /** 클라이언트 없이 임시 캔버스 모드 */
  isTemporaryMode?: boolean;
  /** 가계도 초기화 핸들러 */
  onReset?: () => void;
  /** 초기화 진행 중 */
  isResetting?: boolean;
  /** 가계도 기본 정보 보기 핸들러 (역변환) */
  onShowBasicInfo?: () => void;
}

export function GenogramPageHeader({
  clients,
  selectedClient,
  onClientSelect,
  onUndo,
  onRedo,
  onExport,
  onSave,
  showActions,
  canUndo = false,
  canRedo = false,
  isPanelOpen = false,
  isSaving = false,
  lastSavedAt = null,
  onAddClient,
  isTemporaryMode = false,
  onReset,
  isResetting = false,
  onShowBasicInfo,
}: GenogramPageHeaderProps) {
  const [isExported, setIsExported] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const showSaved = useSavedIndicator(lastSavedAt);
  const menuRef = useRef<HTMLDivElement>(null);

  // 메뉴 외부 클릭 시 닫기
  useEffect(() => {
    if (!isMenuOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isMenuOpen]);

  const handleExport = () => {
    onExport();
    setIsExported(true);
    setTimeout(() => setIsExported(false), 2000);
  };

  return (
    <>
      {/* 좌측 상단: 클라이언트 드롭다운 + 기본 정보 버튼 */}
      <div className="absolute left-4 top-4 z-10 flex items-center gap-2">
        <ClientDropdown
          clients={clients}
          selectedClient={selectedClient}
          onSelect={onClientSelect}
          onAddClient={onAddClient}
          isTemporaryMode={isTemporaryMode}
        />
        {onShowBasicInfo && selectedClient && (
          <button
            onClick={onShowBasicInfo}
            className="flex h-10 items-center rounded-md border-2 border-border bg-white px-4 text-sm text-fg-muted transition-colors hover:bg-surface-contrast hover:text-fg"
          >
            가족 구성원 정보
          </button>
        )}
      </div>

      {/* 우측 상단: 저장 상태 + 액션 버튼들 */}
      {showActions && (
        <div
          className="absolute top-4 z-10 flex items-center gap-3 transition-[right] duration-200"
          style={{ right: isPanelOpen ? PANEL_WIDTH + 16 : 16 }}
        >
          {/* 저장 상태 표시 */}
          <div className="flex select-none items-center gap-2 text-sm text-fg-muted">
            {isSaving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>저장 중...</span>
              </>
            ) : showSaved ? (
              <>
                <Check className="h-4 w-4 text-primary" />
                <span className="text-primary">저장 완료</span>
              </>
            ) : null}
          </div>

          {/* 액션 버튼들 */}
          <div className="flex items-center gap-2 rounded-lg border border-border bg-white p-3 shadow-sm">
            <button
              onClick={onUndo}
              title="실행 취소"
              disabled={!canUndo}
              className="rounded-md p-2 text-fg transition-colors hover:bg-surface-strong disabled:cursor-not-allowed disabled:opacity-30"
            >
              <UndoIcon size={18} />
            </button>
            <button
              onClick={onRedo}
              title="다시 실행"
              disabled={!canRedo}
              className="rounded-md p-2 text-fg transition-colors hover:bg-surface-strong disabled:cursor-not-allowed disabled:opacity-30"
            >
              <RedoIcon size={18} />
            </button>
            <button
              onClick={handleExport}
              title="내보내기"
              disabled={isExported}
              className="rounded-md p-2 text-fg transition-colors hover:bg-surface-strong disabled:opacity-50"
            >
              {isExported ? (
                <Check className="h-[18px] w-[18px] text-primary" />
              ) : (
                <Download className="h-[18px] w-[18px]" />
              )}
            </button>
            <button
              onClick={onSave}
              title="저장"
              disabled={isSaving}
              className="rounded-md p-2 text-fg transition-colors hover:bg-surface-strong disabled:opacity-50"
            >
              <Save className="h-[18px] w-[18px]" />
            </button>

            {/* 더보기 메뉴 */}
            {onReset && (
              <>
                <div className="mx-1 h-5 w-px bg-border" />
                <div ref={menuRef} className="relative">
                  <button
                    onClick={() => setIsMenuOpen(!isMenuOpen)}
                    title="더보기"
                    className="rounded-md p-2 text-fg transition-colors hover:bg-surface-strong"
                  >
                    <MoreVertical className="h-[18px] w-[18px]" />
                  </button>

                  {isMenuOpen && (
                    <div className="absolute right-0 top-full z-20 mt-1 min-w-[128px] rounded-lg border border-border bg-white py-1 shadow-lg">
                      <button
                        onClick={() => {
                          setIsMenuOpen(false);
                          onReset();
                        }}
                        disabled={isResetting}
                        className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-red-600 transition-colors hover:bg-red-50 disabled:opacity-50"
                      >
                        <span>가계도 초기화</span>
                      </button>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}

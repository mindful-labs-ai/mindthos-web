import { useState } from 'react';

// ICON 변경: Download, Check, Save, Loader2는 Lucide 직접 사용 중
import { Check, Download, Loader2, Save } from 'lucide-react';

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
}: GenogramPageHeaderProps) {
  const [isExported, setIsExported] = useState(false);
  const showSaved = useSavedIndicator(lastSavedAt);

  const handleExport = () => {
    onExport();
    setIsExported(true);
    setTimeout(() => setIsExported(false), 2000);
  };

  return (
    <>
      {/* 좌측 상단: 클라이언트 드롭다운 */}
      <div className="absolute left-4 top-4 z-10">
        <ClientDropdown
          clients={clients}
          selectedClient={selectedClient}
          onSelect={onClientSelect}
        />
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
          </div>
        </div>
      )}
    </>
  );
}

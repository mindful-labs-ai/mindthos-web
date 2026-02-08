import { useState } from 'react';

// ICON 변경: Download, Check, Save, Loader2는 Lucide 직접 사용 중
import { Check, Download, Loader2, Save, Sparkles, Upload } from 'lucide-react';

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
  /** Canvas JSON 직접 Import */
  onImportCanvasJson?: (json: string) => void;
  /** AI Raw JSON Import (후처리 후 렌더링) */
  onImportAIJson?: (json: string) => void;
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
  onImportCanvasJson,
  onImportAIJson,
}: GenogramPageHeaderProps) {
  const [isExported, setIsExported] = useState(false);
  const showSaved = useSavedIndicator(lastSavedAt);

  const handleExport = () => {
    onExport();
    setIsExported(true);
    setTimeout(() => setIsExported(false), 2000);
  };

  const handleCanvasImport = () => {
    if (!onImportCanvasJson) return;
    const input = window.prompt('Canvas JSON을 붙여넣으세요:');
    if (input) {
      onImportCanvasJson(input);
    }
  };

  const handleAIImport = () => {
    if (!onImportAIJson) return;
    const input = window.prompt('AI Raw JSON을 붙여넣으세요:');
    if (input) {
      onImportAIJson(input);
    }
  };

  return (
    <>
      {/* 좌측 상단: 클라이언트 드롭다운 */}
      <div className="absolute left-4 top-4 z-10">
        <ClientDropdown
          clients={clients}
          selectedClient={selectedClient}
          onSelect={onClientSelect}
          onAddClient={onAddClient}
          isTemporaryMode={isTemporaryMode}
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
            {/* Import 버튼들 */}
            {onImportCanvasJson && (
              <button
                onClick={handleCanvasImport}
                title="Canvas JSON Import"
                className="rounded-md p-2 text-fg transition-colors hover:bg-surface-strong"
              >
                <Upload className="h-[18px] w-[18px]" />
              </button>
            )}
            {onImportAIJson && (
              <button
                onClick={handleAIImport}
                title="AI JSON Import (후처리)"
                className="rounded-md p-2 text-primary transition-colors hover:bg-primary/10"
              >
                <Sparkles className="h-[18px] w-[18px]" />
              </button>
            )}

            {/* 구분선 */}
            {(onImportCanvasJson || onImportAIJson) && (
              <div className="mx-1 h-5 w-px bg-border" />
            )}

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

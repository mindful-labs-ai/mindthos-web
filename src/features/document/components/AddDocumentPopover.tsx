import { CheckSquare, PenLine } from 'lucide-react';

import type { MyDocumentKind } from '@/stores/documentStore';

import { MY_DOCUMENT_KIND_LABEL } from '../constants/myDocument';

interface AddDocumentPopoverProps {
  /** 팝오버를 띄울 화면 좌표 (클릭한 커서 위치) — null이면 닫힘 */
  position: { x: number; y: number } | null;
  onClose: () => void;
  onSelect: (kind: MyDocumentKind) => void;
}

const POPOVER_WIDTH = 234;

/**
 * 내 문서 추가 팝오버 — 클릭한 커서 위치에 떠서 양식 종류를 고른다.
 * 현재는 선택 즉시 문서 생성 (생성 전 상태 전이 플로우는 후속 작업).
 */
export function AddDocumentPopover({
  position,
  onClose,
  onSelect,
}: AddDocumentPopoverProps) {
  if (!position) return null;

  // 화면 우측/하단 밖으로 나가지 않게 보정
  const left = Math.min(position.x, window.innerWidth - POPOVER_WIDTH - 12);
  const top = Math.min(position.y, window.innerHeight - 116);

  const items: { kind: MyDocumentKind; icon: React.ReactNode }[] = [
    { kind: 'consent', icon: <CheckSquare size={20} /> },
    { kind: 'qna', icon: <PenLine size={20} /> },
  ];

  return (
    <>
      {/* 바깥 클릭 닫기용 투명 오버레이 */}
      <div
        className="fixed inset-0 z-modal"
        onClick={onClose}
        aria-hidden="true"
      />

      <div
        role="menu"
        className="fixed z-modal w-[234px] rounded-lg border border-[#EDEFF6] bg-white p-2.5 shadow-[0px_4px_24px_rgba(0,0,0,0.1)]"
        style={{ left, top }}
      >
        {items.map(({ kind, icon }) => (
          <button
            key={kind}
            type="button"
            role="menuitem"
            onClick={() => {
              onSelect(kind);
              onClose();
            }}
            className="flex w-full items-center gap-3 rounded-lg px-2.5 py-2 text-left transition-colors lg:hover:bg-[#F4F5FA]"
          >
            <span className="text-[#747479]">{icon}</span>
            <span className="text-m font-medium text-grey-100">
              {MY_DOCUMENT_KIND_LABEL[kind]}
            </span>
          </button>
        ))}
      </div>
    </>
  );
}

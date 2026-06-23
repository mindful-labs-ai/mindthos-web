import { ChevronLeft } from 'lucide-react';

interface SharedHeaderProps {
  title: string;
  /** 뒤로가기 — 없으면 버튼 숨김(진입 화면 등) */
  onBack?: () => void;
}

/** 공유 문서 화면 상단 바 — 뒤로가기 박스 + 제목. (h-[67px], 하단 보더) */
export function SharedHeader({ title, onBack }: SharedHeaderProps) {
  return (
    <header className="flex h-[67px] flex-shrink-0 items-center gap-3 border-b border-grey-30 bg-white px-4">
      {onBack && (
        <button
          type="button"
          aria-label="뒤로"
          onClick={onBack}
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-grey-40 bg-grey-10 text-grey-70 transition-colors active:bg-grey-20"
        >
          <ChevronLeft size={24} strokeWidth={1.5} />
        </button>
      )}
      <h1 className="truncate text-l font-medium text-grey-80">{title}</h1>
    </header>
  );
}

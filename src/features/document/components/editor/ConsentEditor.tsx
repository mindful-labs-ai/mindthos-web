import { useEffect, useRef, useState } from 'react';

import { Bold, Heading1, Heading2, Italic, Underline } from 'lucide-react';

import { useDevice } from '@/shared/hooks/useDevice';

interface ConsentEditorProps {
  /** 편집 진입 시 초기 본문 HTML — 마운트 시 1회만 주입 */
  initialHtml?: string;
  /** 본문 HTML 변경 콜백 (저장 시 content로 사용) */
  onContentChange: (html: string) => void;
}

type FormatCommand = 'h1' | 'h2' | 'bold' | 'italic' | 'underline';

const TOOLBAR_ITEMS: { command: FormatCommand; icon: React.ReactNode }[] = [
  { command: 'h1', icon: <Heading1 size={24} /> },
  { command: 'h2', icon: <Heading2 size={24} /> },
  { command: 'bold', icon: <Bold size={24} /> },
  { command: 'italic', icon: <Italic size={24} /> },
  { command: 'underline', icon: <Underline size={24} /> },
];

/**
 * 동의서 양식 본문 에디터 — 항목·조항 텍스트 작성 + 글자 스타일(H1/H2/B/I/U).
 * contentEditable + execCommand 기반 경량 서식, 저장 content는 HTML 문자열.
 */
export function ConsentEditor({
  initialHtml,
  onContentChange,
}: ConsentEditorProps) {
  const [activeFormats, setActiveFormats] = useState<Set<FormatCommand>>(
    new Set()
  );
  const { isMobile, isTablet } = useDevice();
  const isMobileView = isMobile || isTablet;
  const editorRef = useRef<HTMLDivElement>(null);
  // 초기 HTML은 마운트 시 1회만 주입 — 편집 중 재렌더로 덮어쓰지 않는다
  const initialHtmlRef = useRef(initialHtml);

  useEffect(() => {
    if (initialHtmlRef.current && editorRef.current) {
      editorRef.current.innerHTML = initialHtmlRef.current;
    }
  }, []);

  // 커서/선택 위치의 서식 상태를 툴바 active 표시에 반영
  useEffect(() => {
    const updateActiveFormats = () => {
      const next = new Set<FormatCommand>();
      if (document.queryCommandState('bold')) next.add('bold');
      if (document.queryCommandState('italic')) next.add('italic');
      if (document.queryCommandState('underline')) next.add('underline');
      const block = document.queryCommandValue('formatBlock').toLowerCase();
      if (block === 'h1') next.add('h1');
      if (block === 'h2') next.add('h2');
      setActiveFormats(next);
    };
    document.addEventListener('selectionchange', updateActiveFormats);
    return () =>
      document.removeEventListener('selectionchange', updateActiveFormats);
  }, []);

  const applyFormat = (command: FormatCommand) => {
    if (command === 'h1' || command === 'h2') {
      // 같은 헤딩을 다시 누르면 본문(p)으로 토글
      const isActive = activeFormats.has(command);
      document.execCommand('formatBlock', false, isActive ? 'p' : command);
    } else {
      document.execCommand(command);
    }
  };

  return (
    <>
      {/* 본문 */}
      <div
        ref={editorRef}
        contentEditable
        role="textbox"
        aria-multiline="true"
        aria-label="문서 내용"
        data-placeholder="내용을 입력해주세요."
        onInput={(e) => onContentChange(e.currentTarget.innerHTML)}
        className={`mx-auto w-full max-w-[851px] font-medium leading-[150%] text-grey-100 empty:before:text-grey-60 empty:before:content-[attr(data-placeholder)] focus:outline-none [&_h1]:font-headline [&_h2]:font-headline ${
          isMobileView
            ? 'mt-6 min-h-[320px] pb-24 text-m [&_h1]:text-xl [&_h2]:text-l'
            : 'mt-10 min-h-[480px] text-xl [&_h1]:text-[28px] [&_h2]:text-2xl'
        }`}
      />

      {/* 서식 툴바 — 데스크탑은 캔버스 하단 플로팅, 모바일은 화면 하단 고정 바 */}
      <div
        className={
          isMobileView
            ? 'fixed bottom-0 left-0 right-0 z-modal flex items-center justify-around border-t border-grey-40 bg-white px-4 pb-[max(env(safe-area-inset-bottom),8px)] pt-2'
            : 'sticky bottom-6 z-10 mx-auto mt-8 flex w-fit items-center gap-4 rounded-2xl border-2 border-grey-40 bg-white px-4 py-4'
        }
      >
        {TOOLBAR_ITEMS.map(({ command, icon }) => (
          <button
            key={command}
            type="button"
            aria-label={`${command} 서식`}
            aria-pressed={activeFormats.has(command)}
            // mousedown에서 preventDefault — 에디터 선택 영역(포커스) 유지
            onMouseDown={(e) => {
              e.preventDefault();
              applyFormat(command);
            }}
            className={`flex items-center justify-center rounded-lg text-grey-100 transition-colors lg:hover:bg-grey-20 ${
              isMobileView ? 'h-10 w-10' : 'h-12 w-12'
            } ${activeFormats.has(command) ? 'bg-grey-20' : ''}`}
          >
            {icon}
          </button>
        ))}
      </div>
    </>
  );
}

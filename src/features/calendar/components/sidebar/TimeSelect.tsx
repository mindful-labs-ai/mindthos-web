import React from 'react';

import { ChevronDown } from 'lucide-react';

import { cn } from '@/lib/cn';
import { useDevice } from '@/shared/hooks/useDevice';
import { Modal } from '@/shared/ui/composites/Modal';

interface TimeSelectProps {
  value: string;
  options: string[];
  onChange: (value: string) => void;
  ariaLabel: string;
}

/**
 * 시간 선택 select.
 * - 데스크탑: 필드 아래 절대 배치 드롭다운
 * - 모바일/태블릿(<1024px): 하단 bottomSheet
 */
export function TimeSelect({
  value,
  options,
  onChange,
  ariaLabel,
}: TimeSelectProps) {
  const [open, setOpen] = React.useState(false);
  const ref = React.useRef<HTMLDivElement>(null);
  const { isMobile, isTablet } = useDevice();
  const isMobileView = isMobile || isTablet;

  // 데스크탑 드롭다운만 바깥 클릭으로 닫기 (모바일은 Modal이 닫기 처리)
  React.useEffect(() => {
    if (!open || isMobileView) return;
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [open, isMobileView]);

  const handleSelect = (opt: string) => {
    onChange(opt);
    setOpen(false);
  };

  return (
    <div ref={ref} className="relative w-full min-w-0 flex-1">
      <button
        type="button"
        aria-label={ariaLabel}
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className="flex h-[38px] w-full items-center justify-between rounded-md border border-grey-40 bg-grey-10 px-3 text-sm text-grey-100"
      >
        <span>{value}</span>
        <ChevronDown size={16} className="shrink-0 text-[#a1a2a8]" />
      </button>

      {/* 데스크탑: 절대 배치 드롭다운 */}
      {open && !isMobileView && (
        <ul className="absolute left-0 top-full z-30 mt-1 max-h-[200px] w-full overflow-auto rounded-md border border-[#ecedf3] bg-white py-1 shadow-[0px_4px_24px_rgba(0,0,0,0.1)]">
          {options.map((opt) => (
            <li key={opt}>
              <button
                type="button"
                onClick={() => handleSelect(opt)}
                className={cn(
                  'w-full px-3 py-1.5 text-left text-sm lg:hover:bg-grey-20',
                  opt === value
                    ? 'font-medium text-green-80'
                    : 'text-grey-100'
                )}
              >
                {opt}
              </button>
            </li>
          ))}
        </ul>
      )}

      {/* 모바일/태블릿: 바텀시트 */}
      {isMobileView && (
        <Modal
          open={open}
          onOpenChange={(o) => !o && setOpen(false)}
          mobileVariant="bottomSheet"
        >
          <ul className="flex flex-col">
            {options.map((opt) => (
              <li key={opt}>
                <button
                  type="button"
                  onClick={() => handleSelect(opt)}
                  className={cn(
                    'w-full rounded-md px-3 py-3 text-left text-sm',
                    opt === value
                      ? 'font-medium text-green-80'
                      : 'text-grey-100'
                  )}
                >
                  {opt}
                </button>
              </li>
            ))}
          </ul>
        </Modal>
      )}
    </div>
  );
}

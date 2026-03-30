import { useState, useCallback, useRef, useEffect } from 'react';

import { ChevronDown } from 'lucide-react';
import { createPortal } from 'react-dom';

import { cn } from '@/lib/cn';
import { useDevice } from '@/shared/hooks/useDevice';
import { Modal } from '@/shared/ui/composites/Modal';

// ─────────────────────────────────────────────────────────────────────────────
// 커스텀 드롭다운 컴포넌트
// ─────────────────────────────────────────────────────────────────────────────

export interface SelectOption {
  value: string;
  label: string;
}

export interface OptionGroup {
  group: string;
  options: SelectOption[];
}

// ─────────────────────────────────────────────────────────────────────────────
// Flat (비그룹) 커스텀 드롭다운
// ─────────────────────────────────────────────────────────────────────────────

export interface FlatCustomSelectProps {
  value: string;
  options: SelectOption[];
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export function FlatCustomSelect({
  value,
  options,
  onChange,
  placeholder = '선택',
  className,
}: FlatCustomSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0, width: 0 });
  const triggerRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { isMobile, isTablet } = useDevice();
  const isMobileView = isMobile || isTablet;

  const selectedLabel =
    options.find((opt) => opt.value === value)?.label || placeholder;

  // 드롭다운 위치 계산
  const updatePosition = useCallback(() => {
    if (triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      setPosition({
        top: rect.bottom + 4,
        left: rect.left,
        width: Math.max(rect.width, 100),
      });
    }
  }, []);

  // 외부 클릭 감지 (데스크탑만)
  useEffect(() => {
    if (isMobileView) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node) &&
        triggerRef.current &&
        !triggerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, isMobileView]);

  const handleOpen = () => {
    if (!isMobileView) updatePosition();
    setIsOpen(true);
  };

  const handleSelect = (optValue: string) => {
    onChange(optValue);
    setIsOpen(false);
  };

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={handleOpen}
        className={cn(
          'flex w-full items-center justify-between rounded-md border border-grey-40 bg-grey-10 px-1.5 py-0.5 text-sm text-grey-100',
          className
        )}
      >
        <span className="truncate">{selectedLabel}</span>
        <ChevronDown className="h-3 w-3 shrink-0 text-fg-muted" />
      </button>

      {isMobileView ? (
        <Modal
          open={isOpen}
          onOpenChange={setIsOpen}
          mobileVariant="bottomSheet"
          hideCloseButton
        >
          <div className="space-y-1 pb-4">
            {options.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => handleSelect(opt.value)}
                className={cn(
                  'flex w-full items-center px-4 py-3 text-sm transition-colors',
                  opt.value === value
                    ? 'font-medium text-green-80'
                    : 'text-grey-80 lg:hover:bg-grey-10'
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </Modal>
      ) : (
        isOpen &&
        createPortal(
          <div
            ref={dropdownRef}
            style={{
              position: 'fixed',
              top: position.top,
              left: position.left,
              minWidth: position.width,
              zIndex: 1100,
            }}
            className="rounded-xl bg-surface py-2 shadow-elevated"
          >
            {options.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => handleSelect(opt.value)}
                className={cn(
                  'typo-sm flex w-full items-center px-4 py-2 lg:hover:bg-surface-contrast',
                  opt.value === value ? 'font-medium text-fg' : 'text-fg-muted'
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>,
          document.body
        )
      )}
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Grouped 커스텀 드롭다운 (현재 사용되지 않지만 호환성 유지)
// ─────────────────────────────────────────────────────────────────────────────

export interface GroupedCustomSelectProps {
  value: string;
  options: OptionGroup[];
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export function GroupedCustomSelect({
  value,
  options,
  onChange,
  placeholder = '선택',
  className,
}: GroupedCustomSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0, width: 0 });
  const triggerRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // 선택된 라벨 찾기
  const selectedLabel =
    options.flatMap((g) => g.options).find((opt) => opt.value === value)
      ?.label || placeholder;

  // 드롭다운 위치 계산
  const updatePosition = useCallback(() => {
    if (triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      setPosition({
        top: rect.bottom + 4,
        left: rect.left,
        width: Math.max(rect.width, 120),
      });
    }
  }, []);

  // 외부 클릭 감지
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node) &&
        triggerRef.current &&
        !triggerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleOpen = () => {
    updatePosition();
    setIsOpen(true);
  };

  const handleSelect = (optValue: string) => {
    onChange(optValue);
    setIsOpen(false);
  };

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={handleOpen}
        className={cn(
          'typo-sm flex h-8 w-full items-center justify-between rounded-md bg-primary-subtle px-2 text-fg',
          className
        )}
      >
        <span className="truncate">{selectedLabel}</span>
        <ChevronDown className="h-4 w-4 shrink-0 text-fg-muted" />
      </button>

      {isOpen &&
        createPortal(
          <div
            ref={dropdownRef}
            style={{
              position: 'fixed',
              top: position.top,
              left: position.left,
              minWidth: position.width,
              zIndex: 1100,
            }}
            className="max-h-[300px] overflow-y-auto rounded-xl bg-surface py-2 shadow-elevated"
          >
            {options.map((group) => (
              <div key={group.group}>
                <div className="typo-xs px-4 py-1 font-medium text-fg-muted">
                  {group.group}
                </div>
                {group.options.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => handleSelect(opt.value)}
                    className={cn(
                      'typo-sm flex w-full items-center px-4 py-2 lg:hover:bg-surface-contrast',
                      opt.value === value
                        ? 'font-medium text-fg'
                        : 'text-fg-muted'
                    )}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            ))}
          </div>,
          document.body
        )}
    </>
  );
}

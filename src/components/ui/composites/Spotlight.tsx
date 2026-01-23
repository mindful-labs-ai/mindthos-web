import React, {
  useState,
  useEffect,
  useLayoutEffect,
  useRef,
  useMemo,
} from 'react';

import { createPortal } from 'react-dom';

import { cn } from '@/lib/cn';
import { XIcon } from '@/shared/icons';
import { useFeatureGuideStore } from '@/stores/featureGuideStore';
import { useQuestStore } from '@/stores/questStore';

export interface SpotlightProps {
  /** 강조할 대상 컴포넌트 */
  children?: React.ReactElement;
  /** 강조할 대상 요소 (직접 지정 시) */
  targetElement?: HTMLElement | null;
  /** 선택자를 통해 요소 찾기 (컴포넌트 내부에서) */
  selector?: string;
  /** 활성화 여부 */
  isActive?: boolean;
  /** 툴팁 내용 */
  tooltip?: React.ReactNode;
  /** 툴팁 위치 */
  tooltipPosition?: 'top' | 'bottom' | 'left' | 'right';
  /** 강조 영역 주변 패딩 */
  padding?: number;
  /** 딤드 해제 */
  onClose?: () => void;
  /** 추가 클래스 */
  className?: string;
  /** 강조 영역 둥글기 */
  rounded?: 'sm' | 'md' | 'lg' | 'full' | number;
  /** 사용할 store (기본: quest) */
  store?: 'quest' | 'featureGuide';
}

/**
 * 전역에서 사용되는 실제 Spotlight 렌더링 컴포넌트
 * questStore와 featureGuideStore 모두 지원
 */
export const GlobalSpotlight: React.FC = () => {
  // questStore (온보딩 튜토리얼용)
  const questConfig = useQuestStore((state) => state.spotlightConfig);
  const clearQuestSpotlight = useQuestStore((state) => state.clearSpotlight);

  // featureGuideStore (기능 가이드용)
  const featureConfig = useFeatureGuideStore((state) => state.spotlightConfig);
  const clearFeatureSpotlight = useFeatureGuideStore(
    (state) => state.clearSpotlight
  );

  // featureGuideStore 우선, 없으면 questStore 사용
  const config = featureConfig || questConfig;
  const clearSpotlight = featureConfig ? clearFeatureSpotlight : clearQuestSpotlight;

  if (!config || !config.isActive) return null;

  return (
    <SpotlightPortal
      targetElement={config.targetElement}
      isActive={config.isActive}
      tooltip={config.tooltip}
      tooltipPosition={config.tooltipPosition}
      padding={config.padding}
      onClose={config.onClose || clearSpotlight}
      rounded={config.rounded}
    />
  );
};

/**
 * 내부 렌더링 로직 (Hole + Tooltip)
 */
const SpotlightPortal: React.FC<Omit<SpotlightProps, 'children'>> = ({
  targetElement,
  isActive = false,
  tooltip,
  tooltipPosition = 'bottom',
  padding = 8,
  onClose,
  className,
  rounded = 'md',
}) => {
  const [rect, setRect] = useState<DOMRect | null>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const [positionAdjust, setPositionAdjust] = useState({ x: 0, y: 0 });

  const borderRadius = useMemo(() => {
    if (typeof rounded === 'number') return `${rounded}px`;
    switch (rounded) {
      case 'sm':
        return '4px';
      case 'md':
        return '8px';
      case 'lg':
        return '12px';
      case 'full':
        return '9999px';
      default:
        return '8px';
    }
  }, [rounded]);

  const updateRect = React.useCallback(() => {
    if (targetElement) {
      const newRect = targetElement.getBoundingClientRect();
      setRect((prev) => {
        if (!prev) return newRect;
        if (
          Math.abs(prev.top - newRect.top) < 0.1 &&
          Math.abs(prev.left - newRect.left) < 0.1 &&
          Math.abs(prev.width - newRect.width) < 0.1 &&
          Math.abs(prev.height - newRect.height) < 0.1
        ) {
          return prev;
        }
        return newRect;
      });
    }
  }, [targetElement]);

  useLayoutEffect(() => {
    if (isActive) {
      const timeout = setTimeout(updateRect, 0);
      return () => clearTimeout(timeout);
    }
  }, [isActive, updateRect]);

  useEffect(() => {
    if (isActive) {
      window.addEventListener('scroll', updateRect, true);
      window.addEventListener('resize', updateRect);
      return () => {
        window.removeEventListener('scroll', updateRect, true);
        window.removeEventListener('resize', updateRect);
      };
    }
  }, [isActive, updateRect]);

  useEffect(() => {
    if (!isActive) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose?.();
      if (e.key === 'Tab' || e.key.startsWith('Arrow')) {
        e.preventDefault();
        e.stopPropagation();
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose, isActive]);

  const tooltipStyles = useMemo(() => {
    if (!rect) return {};
    const offset = 12 + padding;
    const styles: React.CSSProperties = {
      position: 'fixed',
      zIndex: 10002,
      pointerEvents: 'auto',
    };
    switch (tooltipPosition) {
      case 'top':
        styles.left = rect.left + rect.width / 2;
        styles.top = rect.top - offset;
        styles.transform = 'translate(-50%, -100%)';
        break;
      case 'bottom':
        styles.left = rect.left + rect.width / 2;
        styles.top = rect.bottom + offset;
        styles.transform = 'translate(-50%, 0)';
        break;
      case 'left':
        styles.left = rect.left - offset;
        styles.top = rect.top + rect.height / 2;
        styles.transform = 'translate(-100%, -50%)';
        break;
      case 'right':
        styles.left = rect.right + offset;
        styles.top = rect.top + rect.height / 2;
        styles.transform = 'translate(0, -50%)';
        break;
    }
    return styles;
  }, [rect, tooltipPosition, padding]);

  // 화면 경계 보정 로직
  useLayoutEffect(() => {
    if (rect && tooltipRef.current) {
      // 툴팁 위치를 다시 계산하기 위해 다음 프레임에서 확인
      const timeoutId = setTimeout(() => {
        if (!tooltipRef.current) return;
        const tRect = tooltipRef.current.getBoundingClientRect();
        const vWidth = window.innerWidth;
        const vHeight = window.innerHeight;
        const margin = 16;

        let dx = 0;
        let dy = 0;

        if (tRect.left < margin) {
          dx = margin - tRect.left;
        } else if (tRect.right > vWidth - margin) {
          dx = vWidth - margin - tRect.right;
        }

        if (tRect.top < margin) {
          dy = margin - tRect.top;
        } else if (tRect.bottom > vHeight - margin) {
          dy = vHeight - margin - tRect.bottom;
        }

        if (dx !== 0 || dy !== 0) {
          setPositionAdjust({ x: dx, y: dy });
        } else {
          setPositionAdjust({ x: 0, y: 0 });
        }
      }, 0);
      return () => clearTimeout(timeoutId);
    }
  }, [rect, tooltipStyles]);

  if (!rect) return null;

  const finalTooltipStyles: React.CSSProperties = {
    ...tooltipStyles,
    transform: tooltipStyles.transform
      ? `${tooltipStyles.transform} translate(${positionAdjust.x}px, ${positionAdjust.y}px)`
      : `translate(${positionAdjust.x}px, ${positionAdjust.y}px)`,
  };

  return createPortal(
    <div className="animate-in fade-in pointer-events-none fixed inset-0 z-[10000] overflow-hidden duration-300">
      {onClose && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onClose();
          }}
          className="pointer-events-auto absolute right-6 top-6 z-[10001] rounded-full bg-surface p-2 text-fg-muted transition-colors hover:bg-surface-contrast hover:text-fg"
          aria-label="튜토리얼 닫기"
        >
          <XIcon size={20} />
        </button>
      )}

      {/* Interaction Blockers */}
      <div
        className="pointer-events-auto absolute left-0 right-0 top-0 cursor-default bg-transparent"
        style={{ height: Math.max(0, rect.top - padding) }}
        role="button"
        tabIndex={-1}
        aria-label="가이드 닫기"
      />
      <div
        className="pointer-events-auto absolute bottom-0 left-0 right-0 cursor-default bg-transparent"
        style={{ top: rect.bottom + padding }}
        role="button"
        tabIndex={-1}
        aria-label="가이드 닫기"
      />
      <div
        className="pointer-events-auto absolute left-0 cursor-default bg-transparent"
        style={{
          top: Math.max(0, rect.top - padding),
          height: rect.height + padding * 2,
          width: Math.max(0, rect.left - padding),
        }}
        role="button"
        tabIndex={-1}
        aria-label="가이드 닫기"
      />
      <div
        className="pointer-events-auto absolute right-0 cursor-default bg-transparent"
        style={{
          top: Math.max(0, rect.top - padding),
          height: rect.height + padding * 2,
          left: rect.right + padding,
        }}
        role="button"
        tabIndex={-1}
        aria-label="가이드 닫기"
      />

      {/* Visual Hole */}
      <div
        className="pointer-events-none absolute shadow-[0_0_0_9999px_rgba(0,0,0,0.6)] transition-all duration-300 ease-out"
        style={{
          left: rect.left - padding,
          top: rect.top - padding,
          width: rect.width + padding * 2,
          height: rect.height + padding * 2,
          borderRadius,
        }}
      />

      {/* Tooltip */}
      {tooltip && (
        <div
          ref={tooltipRef}
          style={finalTooltipStyles}
          className={cn(
            'animate-in fade-in zoom-in relative min-w-48 max-w-xs rounded-xl border border-border bg-surface p-4 shadow-2xl duration-300',
            className
          )}
        >
          <div className="text-sm leading-relaxed text-fg">{tooltip}</div>
          <div
            className={cn(
              'absolute h-3 w-3 rotate-45 border-border bg-surface',
              tooltipPosition === 'top' &&
                'bottom-[-6px] left-1/2 -translate-x-1/2 border-b border-r',
              tooltipPosition === 'bottom' &&
                'left-1/2 top-[-6px] -translate-x-1/2 border-l border-t',
              tooltipPosition === 'left' &&
                'right-[-6px] top-1/2 -translate-y-1/2 border-r border-t',
              tooltipPosition === 'right' &&
                'left-[-6px] top-1/2 -translate-y-1/2 border-b border-l'
            )}
            style={{
              left:
                tooltipPosition === 'top' || tooltipPosition === 'bottom'
                  ? `calc(50% - ${positionAdjust.x}px)`
                  : undefined,
              top:
                tooltipPosition === 'left' || tooltipPosition === 'right'
                  ? `calc(50% - ${positionAdjust.y}px)`
                  : undefined,
            }}
          />
        </div>
      )}
    </div>,
    document.body
  );
};

/**
 * 각 페이지에서 사용하는 Spotlight 컨트롤러
 */
export const Spotlight: React.FC<SpotlightProps> = ({
  children,
  targetElement: propTarget,
  selector,
  isActive = false,
  tooltip,
  tooltipPosition = 'bottom',
  padding = 8,
  onClose,
  rounded = 'md',
  store = 'quest',
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  // store prop에 따라 적절한 store 사용
  const setQuestSpotlightConfig = useQuestStore(
    (state) => state.setSpotlightConfig
  );
  const setFeatureSpotlightConfig = useFeatureGuideStore(
    (state) => state.setSpotlightConfig
  );

  const setSpotlightConfig =
    store === 'featureGuide'
      ? setFeatureSpotlightConfig
      : setQuestSpotlightConfig;

  useLayoutEffect(() => {
    if (isActive) {
      let target: HTMLElement | null = propTarget || null;

      // selector가 있으면 해당 요소를 찾음
      if (selector && containerRef.current) {
        target = containerRef.current.querySelector(selector) as HTMLElement;
      }

      // selector가 없고 propTarget도 없으면 첫 번째 자식을 찾음
      if (!target && containerRef.current && !selector) {
        target = containerRef.current.firstElementChild as HTMLElement;
      }

      if (target) {
        // 무한 루프 방지: 현재 스토어의 설정과 동일한지 심층 비교
        const current =
          store === 'featureGuide'
            ? useFeatureGuideStore.getState().spotlightConfig
            : useQuestStore.getState().spotlightConfig;
        const isSame =
          current?.isActive === true &&
          current?.targetElement === target &&
          current?.tooltip === tooltip &&
          current?.tooltipPosition === tooltipPosition &&
          current?.padding === padding &&
          current?.rounded === rounded;

        // 실제로 변경되었을 때만 업데이트
        if (!isSame) {
          setSpotlightConfig({
            isActive: true,
            targetElement: target,
            tooltip,
            tooltipPosition,
            padding,
            onClose,
            rounded,
          });
        }
      }
    }
  }, [
    isActive,
    propTarget,
    tooltip,
    tooltipPosition,
    padding,
    onClose,
    rounded,
    selector,
    setSpotlightConfig,
    store,
  ]);

  return (
    <div ref={containerRef} className="contents">
      {children}
    </div>
  );
};

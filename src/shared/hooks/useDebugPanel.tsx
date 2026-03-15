/**
 * useDebugPanel — 범용 디버그 패널 훅
 *
 * 개발 모드에서만 동작하며, 프로덕션 빌드 시 null을 반환합니다.
 * 상태 객체를 넘기면 자동으로 디버그 UI를 생성합니다.
 *
 * ─── 기본 사용법 ───
 *
 * const debugPanel = useDebugPanel('모달 이름', {
 *   // 옵션 셀렉터: options 배열의 각 값이 클릭 가능한 Chip으로 렌더링됩니다
 *   step: {
 *     value: step,                              // 현재 값
 *     set: setStep,                              // setter 함수
 *     options: ['list', 'verify', 'input'],      // 선택 가능한 옵션들
 *   },
 *
 *   // 불리언 토글: options 없이 boolean 값만 넘기면 ON/OFF 토글로 렌더링됩니다
 *   isLoading: {
 *     value: isLoading,
 *     set: setIsLoading,
 *   },
 * });
 *
 * // JSX에 배치
 * return <>{children}{debugPanel}</>;
 *
 * ─── 커스텀 섹션 ───
 *
 * 배열 아이템 등 복잡한 컨트롤은 세 번째 인자로 ReactNode를 전달합니다.
 * DebugSection, DebugChip 컴포넌트를 import하여 조합할 수 있습니다.
 *
 * import { useDebugPanel, DebugSection, DebugChip } from '@/shared/hooks/useDebugPanel';
 *
 * const debugPanel = useDebugPanel('모달 이름', config, (
 *   <DebugSection label="리스트">
 *     {items.map(item => (
 *       <DebugChip
 *         key={item.id}
 *         label={item.name}
 *         active={item.selected}
 *         onClick={() => toggle(item.id)}
 *       />
 *     ))}
 *   </DebugSection>
 * ));
 */
import type { ReactNode } from 'react';
import { useState } from 'react';

// ── Types ──

// eslint-disable-next-line @typescript-eslint/no-explicit-any
interface DebugField<T = any> {
  value: T;
  set: (v: T) => void;
  options?: readonly T[];
}

type DebugConfig = Record<string, DebugField>;

// ── Hook ──

export function useDebugPanel(
  title: string,
  config: DebugConfig,
  extra?: ReactNode
): ReactNode {
  if (import.meta.env.PROD) return null;
  return <DebugPanelUI title={title} config={config} extra={extra} />;
}

// ── Internal UI ──

function formatValue(v: unknown): string {
  if (v === null) return 'null';
  if (v === undefined) return 'undefined';
  return String(v);
}

function DebugPanelUI({
  title,
  config,
  extra,
}: {
  title: string;
  config: DebugConfig;
  extra?: ReactNode;
}) {
  const [open, setOpen] = useState(false);

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed bottom-4 right-4 z-debug rounded bg-gray-800 px-3 py-1.5 text-xs text-white opacity-60 hover:opacity-100"
      >
        DEBUG
      </button>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 z-debug w-72 rounded-lg border border-gray-300 bg-white p-3 text-xs shadow-xl">
      <div className="mb-2 flex items-center justify-between">
        <span className="font-bold text-gray-700">{title}</span>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="text-gray-400 hover:text-gray-700"
        >
          X
        </button>
      </div>

      {Object.entries(config).map(([key, field]) => (
        <FieldRenderer key={key} name={key} field={field} />
      ))}

      {extra}
    </div>
  );
}

function FieldRenderer({ name, field }: { name: string; field: DebugField }) {
  const label = `${name}: ${formatValue(field.value)}`;

  // options가 있으면 → Chip 셀렉터
  if (field.options) {
    return (
      <DebugSection label={label}>
        {field.options.map((opt) => (
          <DebugChip
            key={formatValue(opt)}
            label={formatValue(opt)}
            active={field.value === opt}
            onClick={() => field.set(opt)}
          />
        ))}
      </DebugSection>
    );
  }

  // boolean이면 → 토글
  if (typeof field.value === 'boolean') {
    return (
      <DebugSection label={label}>
        <DebugChip
          label={field.value ? 'ON' : 'OFF'}
          active={field.value}
          onClick={() => field.set(!field.value)}
        />
      </DebugSection>
    );
  }

  // 그 외 → 읽기 전용
  return <DebugSection label={label} />;
}

// ── Exported Components ──

export function DebugSection({
  label,
  children,
}: {
  label: string;
  children?: ReactNode;
}) {
  return (
    <div className="mb-2">
      <p className="mb-1 font-medium text-gray-500">{label}</p>
      {children && <div className="flex flex-wrap gap-1">{children}</div>}
    </div>
  );
}

export function DebugChip({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded px-2 py-0.5 ${
        active
          ? 'bg-blue-600 text-white'
          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
      }`}
    >
      {label}
    </button>
  );
}

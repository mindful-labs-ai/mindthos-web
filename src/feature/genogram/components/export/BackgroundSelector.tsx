import { BACKGROUND_OPTIONS, type BackgroundOptionId } from './constants';

interface BackgroundSelectorProps {
  value: BackgroundOptionId;
  onChange: (id: BackgroundOptionId) => void;
}

export function BackgroundSelector({
  value,
  onChange,
}: BackgroundSelectorProps) {
  return (
    <div>
      <span className="mb-2 block select-none text-base font-semibold text-fg">
        이미지 배경
      </span>
      <div className="flex gap-3">
        {BACKGROUND_OPTIONS.map((option) => (
          <button
            key={option.id}
            type="button"
            onClick={() => onChange(option.id)}
            className={`h-10 w-10 rounded-md border transition-all ${
              value === option.id
                ? 'border-2 border-primary'
                : 'border-border hover:border-fg-muted'
            }`}
            style={{
              background:
                option.color === 'transparent'
                  ? 'linear-gradient(to top right, transparent calc(50% - 1px), #EF4444, transparent calc(50% + 1px))'
                  : option.color,
            }}
            title={option.label}
          />
        ))}
      </div>
    </div>
  );
}

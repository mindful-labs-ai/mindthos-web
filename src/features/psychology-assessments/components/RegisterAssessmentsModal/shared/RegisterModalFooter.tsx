import { cn } from '@/lib/cn';
import { useDevice } from '@/shared/hooks/useDevice';
import { CreditIcon } from '@/shared/icons';

export type FooterButtonTone = 'primary' | 'outline' | 'disabled';

export interface FooterButtonConfig {
  label: string;
  onClick?: () => void;
  tone: FooterButtonTone;
  /** 우측 크레딧 표시 */
  creditCost?: number;
}

interface RegisterModalFooterProps {
  leftButton?: FooterButtonConfig;
  rightButton: FooterButtonConfig;
  className?: string;
}

const buttonClassByTone: Record<FooterButtonTone, string> = {
  primary: 'bg-green-80 text-white lg:hover:opacity-90',
  outline: 'border border-grey-40 text-grey-100 lg:hover:opacity-90',
  disabled: 'bg-grey-20 text-grey-60 cursor-not-allowed',
};

interface FooterButtonProps {
  config: FooterButtonConfig;
  className?: string;
}

const FooterButton = ({ config, className }: FooterButtonProps) => {
  const isDisabled = config.tone === 'disabled';
  return (
    <button
      type="button"
      onClick={isDisabled ? undefined : config.onClick}
      disabled={isDisabled}
      className={cn(
        'flex items-center justify-center gap-2 rounded-md text-m font-emphasize transition-colors',
        buttonClassByTone[config.tone],
        className
      )}
      style={{ height: 41 }}
    >
      <span>{config.label}</span>
      {config.creditCost !== undefined && (
        <span className="inline-flex items-center gap-1">
          <span>{config.creditCost}</span>
          <CreditIcon size={14} color="currentColor" />
        </span>
      )}
    </button>
  );
};

export const RegisterModalFooter = ({
  leftButton,
  rightButton,
  className,
}: RegisterModalFooterProps) => {
  const { isMobile, isTablet } = useDevice();
  const isMobileView = isMobile || isTablet;
  const padX = isMobileView ? 16 : 89;

  return (
    <div
      className={cn('flex items-center gap-3 pb-6 pt-2', className)}
      style={{ paddingLeft: padX, paddingRight: padX }}
    >
      {leftButton && (
        <FooterButton config={leftButton} className="flex-1" />
      )}
      <FooterButton
        config={rightButton}
        className={leftButton ? 'flex-[2]' : 'flex-1'}
      />
    </div>
  );
};

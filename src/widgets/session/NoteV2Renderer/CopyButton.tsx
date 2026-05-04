import { CheckIcon, CopyIcon } from '@/shared/icons';

interface CopyButtonProps {
  isCopied: boolean;
  onClick: () => void;
  label?: string;
  size?: 'sm' | 'md';
}

export function CopyButton({
  isCopied,
  onClick,
  label,
  size = 'sm',
}: CopyButtonProps) {
  return (
    <button
      onClick={onClick}
      className={`items-center gap-1 rounded-md border border-grey-30 bg-white px-3.5 py-1 text-m font-medium transition-colors ${
        size === 'md' ? 'inline-flex px-2 py-1 text-sm' : 'hidden lg:inline-flex'
      } ${
        isCopied
          ? 'text-green-80'
          : 'text-grey-70 lg:hover:bg-grey-10 lg:hover:text-grey-100'
      }`}
      title={label ?? '복사'}
    >
      {isCopied ? (
        <>
          <CheckIcon size={18} />
          복사됨
        </>
      ) : (
        <>
          <CopyIcon size={18} />
          {label ?? '복사'}
        </>
      )}
    </button>
  );
}

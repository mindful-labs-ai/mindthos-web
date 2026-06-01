import { cn } from '@/lib/cn';
import { XIcon } from '@/shared/icons';

interface RegisterModalHeaderProps {
  onClose: () => void;
  title?: string;
  className?: string;
}

export const RegisterModalHeader = ({
  onClose,
  title = '심리검사 결과지 등록하기',
  className,
}: RegisterModalHeaderProps) => {
  return (
    <div
      className={cn(
        'relative flex items-center justify-center px-6 pt-6',
        className
      )}
    >
      <h2 className="text-l font-emphasize text-grey-100">{title}</h2>
      <button
        type="button"
        onClick={onClose}
        className="absolute right-5 top-5 flex h-8 w-8 items-center justify-center rounded-md text-grey-60 transition-colors lg:hover:bg-grey-10"
        aria-label="닫기"
      >
        <XIcon size={20} />
      </button>
    </div>
  );
};

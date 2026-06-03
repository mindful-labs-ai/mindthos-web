import { cn } from '@/lib/cn';
import { XIcon } from '@/shared/icons';
import { BackButton } from '@/shared/ui/atoms/BackButton';

interface RegisterModalHeaderProps {
  onClose: () => void;
  /** 모바일 헤더 뒤로가기. 단계 뒤로 또는 루트에서 닫기. 미지정 시 onClose. */
  onBack?: () => void;
  /** 모바일 레이아웃(좌측 뒤로가기 + 제목) 사용 여부. */
  isMobileView?: boolean;
  title?: string;
  className?: string;
}

export const RegisterModalHeader = ({
  onClose,
  onBack,
  isMobileView = false,
  title = '심리검사 결과지 등록하기',
  className,
}: RegisterModalHeaderProps) => {
  // 모바일: 녹음 파일 업로드 모달과 동일하게 뒤로가기 헤더(좌측 back + 제목).
  // 뒤로가기는 단계 depth를 따라 한 단계씩 이동하고, 루트에서는 모달을 닫는다.
  if (isMobileView) {
    return (
      <div
        className={cn(
          'flex h-[67px] items-center gap-3 border-b border-border px-4 py-3',
          className
        )}
      >
        <BackButton onClick={onBack ?? onClose} />
        <p className="text-m font-medium text-grey-100">{title}</p>
      </div>
    );
  }

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

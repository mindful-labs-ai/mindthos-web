import { cn } from '@/lib/cn';
import { CloudUploadIcon, PlusIcon } from '@/shared/icons';

interface UploadDropzoneProps {
  onSelectFiles?: () => void;
  dragActive?: boolean;
  className?: string;
}

export const UploadDropzone = ({
  onSelectFiles,
  dragActive = false,
  className,
}: UploadDropzoneProps) => {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed px-6 py-14 transition-colors',
        dragActive
          ? 'border-green-80 bg-green-10'
          : 'border-transparent bg-grey-20',
        className
      )}
    >
      <CloudUploadIcon size={24} className="text-grey-60" />

      <div className="flex flex-col items-center gap-1 font-medium">
        <p className="text-m text-grey-80">
          심리검사 결과지를 여기에 끌어다 놓아 주세요
        </p>
        <p className="text-sm text-grey-60">
          PDF 파일만 등록할 수 있어요. 최대 200MB
        </p>
      </div>

      <button
        type="button"
        onClick={onSelectFiles}
        className="mt-3 inline-flex items-center gap-1.5 rounded-md border border-grey-80 px-5 py-2 text-sm font-medium text-grey-80 transition-colors lg:hover:bg-grey-10"
      >
        <PlusIcon size={16} />
        파일 선택하기
      </button>

      <p className="mt-3 text-sm font-medium text-grey-60">
        다면적 인성검사와 기질 검사 결과지를 각 1개씩 등록할 수 있어요.
      </p>
    </div>
  );
};

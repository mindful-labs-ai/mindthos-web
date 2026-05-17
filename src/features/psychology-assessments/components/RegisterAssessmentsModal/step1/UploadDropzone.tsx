import { cn } from '@/lib/cn';
import { CloudUploadIcon, PlusIcon } from '@/shared/icons';

interface UploadDropzoneProps {
  onSelectFiles?: () => void;
  className?: string;
}

export const UploadDropzone = ({
  onSelectFiles,
  className,
}: UploadDropzoneProps) => {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center gap-3 rounded-xl bg-grey-20 px-6 py-14',
        className
      )}
    >
      <CloudUploadIcon size={24} className="text-grey-60" />

      <div className="flex flex-col items-center gap-1 font-medium">
        <p className="text-m text-grey-80">
          심리검사 결과지*를 여기에 끌어다 놓으세요
        </p>
        <p className="text-sm text-grey-60">PDF, PNG, JPG 포맷 (최대 200 MB)</p>
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
        *다면적 인성 검사, 기질 검사, 문장 완성 검사
      </p>
    </div>
  );
};

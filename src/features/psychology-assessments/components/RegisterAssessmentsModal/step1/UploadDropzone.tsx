import { cn } from '@/lib/cn';
import { CloudUploadIcon } from '@/shared/icons';
import { Button } from '@/shared/ui/atoms/Button';

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
        'flex min-h-[300px] flex-1 flex-col items-center justify-center gap-4 break-keep rounded-lg bg-surface-contrast p-4 transition-colors',
        dragActive ? 'bg-primary-subtle' : 'bg-surface-contrast',
        className
      )}
    >
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-surface-contrast">
        <CloudUploadIcon className="h-6 w-6 text-fg-muted" />
      </div>

      <div className="space-y-2 text-center">
        <p className="text-fg">심리검사 결과지를 여기에 끌어다 놓아 주세요</p>
        <p className="text-fg-muted">PDF 파일만 등록할 수 있어요. 최대 200MB</p>
      </div>

      <Button variant="outline" size="sm" onClick={onSelectFiles}>
        + 파일 선택하기
      </Button>

      <p className="text-center text-fg-muted">
        다면적 인성검사와 기질 검사 결과지를 각 1개씩 등록할 수 있어요.
      </p>
    </div>
  );
};

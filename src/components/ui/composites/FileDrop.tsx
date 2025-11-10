import React from 'react';

import { cn } from '@/lib/cn';

export interface FileDropProps {
  /**
   * Accepted file types (e.g., 'image/*', '.pdf', 'image/png,image/jpeg')
   */
  accept?: string;
  /**
   * Allow multiple files
   * @default false
   */
  multiple?: boolean;
  /**
   * Max file size in bytes
   */
  maxSize?: number;
  /**
   * Disabled state
   */
  disabled?: boolean;
  /**
   * File selection handler
   */
  onFilesSelected?: (files: File[]) => void;
  /**
   * Error handler
   */
  onError?: (error: string) => void;
  /**
   * Custom content
   */
  children?: React.ReactNode;
  /**
   * Additional className
   */
  className?: string;
}

const UploadIcon = () => (
  <svg
    className="h-12 w-12 text-fg-muted"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={1.5}
      d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
    />
  </svg>
);

/**
 * FileDrop component
 *
 * Drag-and-drop file upload area with file type and size validation.
 *
 * **A11y**: Button with proper role, keyboard accessible, aria-label for screen readers.
 * **Keyboard**: Click to open file picker, Enter/Space to activate.
 *
 * @example
 * ```tsx
 * <FileDrop
 *   accept="image/*"
 *   multiple
 *   maxSize={5 * 1024 * 1024}
 *   onFilesSelected={(files) => console.log(files)}
 *   onError={(error) => console.error(error)}
 * />
 * ```
 */
export const FileDrop: React.FC<FileDropProps> = ({
  accept,
  multiple = false,
  maxSize,
  disabled = false,
  onFilesSelected,
  onError,
  children,
  className,
}) => {
  const [isDragOver, setIsDragOver] = React.useState(false);
  const inputRef = React.useRef<HTMLInputElement>(null);
  const dragCounterRef = React.useRef(0);

  const validateFiles = (files: File[]): File[] => {
    const validFiles: File[] = [];

    for (const file of files) {
      // Check file size
      if (maxSize && file.size > maxSize) {
        onError?.(
          `File "${file.name}" exceeds maximum size of ${Math.round(maxSize / 1024 / 1024)}MB`
        );
        continue;
      }

      // Check file type if accept is specified
      if (accept) {
        const acceptedTypes = accept.split(',').map((t) => t.trim());
        const fileType = file.type;
        const fileExt = `.${file.name.split('.').pop()?.toLowerCase()}`;

        const isAccepted = acceptedTypes.some((acceptType) => {
          if (acceptType.startsWith('.')) {
            return fileExt === acceptType.toLowerCase();
          }
          if (acceptType.endsWith('/*')) {
            const category = acceptType.split('/')[0];
            return fileType.startsWith(category + '/');
          }
          return fileType === acceptType;
        });

        if (!isAccepted) {
          onError?.(`File "${file.name}" type is not accepted`);
          continue;
        }
      }

      validFiles.push(file);
    }

    return validFiles;
  };

  const handleFiles = (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const fileArray = Array.from(files);
    const filesToProcess = multiple ? fileArray : [fileArray[0]];
    const validFiles = validateFiles(filesToProcess);

    if (validFiles.length > 0) {
      onFilesSelected?.(validFiles);
    }
  };

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current += 1;
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      setIsDragOver(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current -= 1;
    if (dragCounterRef.current === 0) {
      setIsDragOver(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    dragCounterRef.current = 0;

    if (disabled) return;

    const { files } = e.dataTransfer;
    handleFiles(files);
  };

  const handleClick = () => {
    if (disabled) return;
    inputRef.current?.click();
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleFiles(e.target.files);
    // Reset input value so the same file can be selected again
    e.target.value = '';
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleClick();
    }
  };

  return (
    <div
      role="button"
      tabIndex={disabled ? -1 : 0}
      aria-label={`File drop area. ${multiple ? 'Multiple files' : 'Single file'} allowed. ${accept ? `Accepted types: ${accept}` : ''}`}
      aria-disabled={disabled}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      className={cn(
        'relative flex flex-col items-center justify-center gap-4',
        'min-h-[200px] rounded-[var(--radius-lg)] border-2 border-dashed',
        'px-6 py-8 text-center',
        'transition-all duration-200',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
        disabled
          ? 'cursor-not-allowed border-border/50 bg-surface-contrast/50 opacity-50'
          : isDragOver
            ? 'border-primary bg-primary/5 cursor-copy'
            : 'border-border bg-surface hover:border-primary/50 hover:bg-surface-contrast cursor-pointer',
        className
      )}
    >
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        multiple={multiple}
        disabled={disabled}
        onChange={handleInputChange}
        className="sr-only"
        aria-hidden="true"
      />

      {children || (
        <>
          <UploadIcon />
          <div className="space-y-1">
            <p className="text-sm font-medium text-fg">
              {isDragOver ? 'Drop files here' : 'Click to upload or drag and drop'}
            </p>
            <p className="text-xs text-fg-muted">
              {accept && `Accepted: ${accept}`}
              {maxSize && ` • Max size: ${Math.round(maxSize / 1024 / 1024)}MB`}
              {multiple && ' • Multiple files allowed'}
            </p>
          </div>
        </>
      )}
    </div>
  );
};

FileDrop.displayName = 'FileDrop';

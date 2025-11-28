import React from 'react';

import { Button } from '@/components/ui/atoms/Button';
import { Text } from '@/components/ui/atoms/Text';
import { CloudUploadIcon, XIcon } from '@/shared/icons';
import { formatDurationInTime, formatFileSize } from '@/shared/utils/format';

import { getFileUploadText } from '../constants/fileUpload';
import { useDragAndDrop } from '../hooks/useDragAndDrop';
import { useFileUpload } from '../hooks/useFileUpload';
import type { FileInfo, UploadType } from '../types';

interface FileUploadAreaProps {
  type: UploadType;
  onFileSelect: (fileInfo: FileInfo | null) => void;
  selectedFile: FileInfo | null;
}

export const FileUploadArea: React.FC<FileUploadAreaProps> = ({
  type,
  onFileSelect,
  selectedFile,
}) => {
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const { processFile } = useFileUpload(type, onFileSelect);
  const { isDragging, handleDragOver, handleDragLeave, handleDrop } =
    useDragAndDrop();

  const onFileDrop = async (files: File[]) => {
    if (type === 'audio') {
      const audioFile = files.find((file) => file.type.startsWith('audio/'));
      if (audioFile) {
        await processFile(audioFile);
      }
    } else if (type === 'pdf') {
      const pdfFile = files.find((file) => file.type === 'application/pdf');
      if (pdfFile) {
        await processFile(pdfFile);
      }
    }
  };

  const onDrop = (e: React.DragEvent) => {
    handleDrop(e, onFileDrop);
  };

  const handleFileInputChange = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (file) {
      await processFile(file);
    }
  };

  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  const handleRemoveFile = () => {
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    onFileSelect(null);
  };

  const getAcceptTypes = () => {
    if (type === 'audio') return 'audio/*';
    if (type === 'pdf') return 'application/pdf';
    return '';
  };

  const getUploadText = () => {
    if (type === 'audio') {
      const { formats, maxSize } = getFileUploadText('audio');
      return {
        main: '오디오 파일을 여기에 끌어다 놓으세요',
        sub: `${formats} 모두 (최대 ${maxSize})`,
      };
    }
    if (type === 'pdf') {
      const { formats, maxSize } = getFileUploadText('pdf');
      return {
        main: 'PDF 파일을 여기에 끌어다 놓으세요',
        sub: `${formats} 포맷 (최대 ${maxSize})`,
      };
    }
    return { main: '', sub: '' };
  };

  const uploadText = getUploadText();

  return (
    <div className="space-y-4">
      <input
        ref={fileInputRef}
        type="file"
        accept={getAcceptTypes()}
        onChange={handleFileInputChange}
        className="hidden"
      />

      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={onDrop}
        className={`rounded-lg border-2 border-dashed p-8 text-center transition-colors duration-200 ${
          isDragging
            ? 'border-primary bg-primary-100'
            : 'border-surface-strong bg-surface-contrast'
        } ${selectedFile ? 'bg-surface' : ''} `}
      >
        {!selectedFile ? (
          <div className="flex flex-col items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-surface-contrast">
              <CloudUploadIcon className="h-6 w-6 text-fg-muted" />
            </div>
            <div className="space-y-2">
              <Text className="text-fg">{uploadText.main}</Text>
              <Text className="text-fg-muted">{uploadText.sub}</Text>
            </div>
            <Button variant="outline" size="sm" onClick={handleButtonClick}>
              + 파일 선택하기
            </Button>
          </div>
        ) : (
          <div className="relative space-y-3">
            <button
              onClick={handleRemoveFile}
              className="absolute -right-2 -top-2 rounded-full bg-surface p-1.5 shadow-md transition-colors hover:bg-surface-strong"
              aria-label="파일 제거"
            >
              <XIcon size={16} className="text-fg-muted" />
            </button>

            <Text className="font-medium text-fg">{selectedFile.name}</Text>
            <Text className="text-fg-muted">
              {formatFileSize(selectedFile.size)}
            </Text>
            {type === 'audio' && 'duration' in selectedFile && (
              <Text className="font-medium text-fg">
                {formatDurationInTime(selectedFile.duration)}
              </Text>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

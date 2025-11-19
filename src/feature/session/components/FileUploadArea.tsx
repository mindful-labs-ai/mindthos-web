import React from 'react';

import { Upload, X } from 'lucide-react';

import { Button } from '@/components/ui/atoms/Button';
import { Text } from '@/components/ui/atoms/Text';

interface AudioFileInfo {
  name: string;
  size: number; // bytes
  duration: number; // seconds
  file: File;
}

interface FileUploadAreaProps {
  onFileSelect: (fileInfo: AudioFileInfo | null) => void;
  selectedFile: AudioFileInfo | null;
}

export const FileUploadArea: React.FC<FileUploadAreaProps> = ({
  onFileSelect,
  selectedFile,
}) => {
  const [isDragging, setIsDragging] = React.useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files);
    const audioFile = files.find((file) => file.type.startsWith('audio/'));

    if (audioFile) {
      await processAudioFile(audioFile);
    }
  };

  const handleFileInputChange = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (file) {
      await processAudioFile(file);
    }
  };

  const processAudioFile = async (file: File) => {
    // 오디오 파일의 duration을 가져오기 위해 Audio 객체 사용
    const audio = new Audio();
    const objectUrl = URL.createObjectURL(file);

    audio.src = objectUrl;

    audio.addEventListener('loadedmetadata', () => {
      const fileInfo: AudioFileInfo = {
        name: file.name,
        size: file.size,
        duration: Math.floor(audio.duration),
        file,
      };

      onFileSelect(fileInfo);
      URL.revokeObjectURL(objectUrl);
    });
  };

  const formatFileSize = (bytes: number): string => {
    return (bytes / (1024 * 1024)).toFixed(1) + 'MB';
  };

  const formatDuration = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  const handleRemoveFile = () => {
    // Reset input element to allow re-selecting the same file
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    onFileSelect(null); // 파일 제거
  };

  return (
    <div className="space-y-4">
      <input
        ref={fileInputRef}
        type="file"
        accept="audio/*"
        onChange={handleFileInputChange}
        className="hidden"
      />

      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`rounded-lg border-2 border-dashed p-8 text-center transition-colors duration-200 ${
          isDragging
            ? 'border-primary bg-primary-100'
            : 'border-surface-strong bg-surface-contrast'
        } ${selectedFile ? 'bg-surface' : ''} `}
      >
        {!selectedFile ? (
          <div className="flex flex-col items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-surface-contrast">
              <Upload className="h-6 w-6 text-fg-muted" />
            </div>
            <div className="space-y-2">
              <Text className="text-fg">
                오디오 파일을 여기에 끌어다 놓으세요
              </Text>
              <Text className="text-fg-muted">MP3, WAV 모두 (최대 500 MB)</Text>
            </div>
            <Button variant="outline" size="sm" onClick={handleButtonClick}>
              + 파일 선택하기
            </Button>
          </div>
        ) : (
          <div className="relative space-y-3">
            {/* X 버튼 (우측 상단) */}
            <button
              onClick={handleRemoveFile}
              className="absolute -right-2 -top-2 rounded-full bg-surface p-1.5 shadow-md transition-colors hover:bg-surface-strong"
              aria-label="파일 제거"
            >
              <X size={16} className="text-fg-muted" />
            </button>

            {/* 파일 정보 */}
            <Text className="font-medium">{selectedFile.name}</Text>
            <Text className="text-fg-muted">
              {formatFileSize(selectedFile.size)}
            </Text>
            <Text className="font-medium text-fg">
              {formatDuration(selectedFile.duration)}
            </Text>
          </div>
        )}
      </div>
    </div>
  );
};

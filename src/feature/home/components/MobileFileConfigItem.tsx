import React from 'react';

import { Button } from '@/components/ui/atoms/Button';
import { Text } from '@/components/ui/atoms/Text';
import { ClientSelector } from '@/feature/client/components/ClientSelector';
import type { Client } from '@/feature/client/types';
import type {
  FileSessionConfig,
  MultiFileInfo,
  SessionCreateResult,
  SttModel,
} from '@/feature/session/types';
import { cn } from '@/lib/cn';
import { CheckIcon, UserIcon, XIcon } from '@/shared/icons';
import { formatDurationInTime, formatFileSize } from '@/shared/utils/format';

// 원형 프로그레스 바 컴포넌트
const CircularProgress: React.FC<{
  progress: number;
  size?: number;
  strokeWidth?: number;
}> = ({ progress, size = 32, strokeWidth = 3 }) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (progress / 100) * circumference;

  return (
    <svg width={size} height={size} className="rotate-[-90deg]">
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        className="text-surface-strong"
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        strokeLinecap="round"
        className="text-primary transition-all duration-300"
      />
    </svg>
  );
};

interface MobileFileConfigItemProps {
  index: number;
  file: MultiFileInfo;
  config: FileSessionConfig;
  clients: Client[];
  result?: SessionCreateResult;
  onConfigChange: (config: FileSessionConfig) => void;
  onRemove: (fileId: string) => void;
}

const MobileSttModelToggle: React.FC<{
  value: SttModel;
  onChange: (value: SttModel) => void;
}> = ({ value, onChange }) => {
  const isAdvanced = value === 'gemini-3';

  const handleToggle = () => {
    onChange(isAdvanced ? 'whisper' : 'gemini-3');
  };

  return (
    <button
      type="button"
      onClick={handleToggle}
      className={cn(
        'relative flex h-8 w-16 items-center rounded-full px-1 transition-colors',
        isAdvanced ? 'bg-primary' : 'bg-surface-strong'
      )}
    >
      {/* 체크 아이콘 (움직이는 원) */}
      <div
        className={cn(
          'absolute flex h-6 w-6 items-center justify-center rounded-full bg-white shadow transition-all duration-200',
          isAdvanced ? 'left-[calc(100%-28px)]' : 'left-1'
        )}
      >
        <svg
          width="12"
          height="12"
          viewBox="0 0 14 14"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        ></svg>
      </div>
      {/* 텍스트 */}
      <span
        className={cn(
          'absolute text-xs font-medium text-white transition-all duration-200',
          isAdvanced ? 'left-2' : 'right-2'
        )}
      >
        {isAdvanced ? '고급' : '일반'}
      </span>
    </button>
  );
};

export const MobileFileConfigItem: React.FC<MobileFileConfigItemProps> = ({
  index,
  file,
  config,
  clients,
  result,
  onConfigChange,
  onRemove,
}) => {
  const [isClientSelectorOpen, setIsClientSelectorOpen] = React.useState(false);

  const selectedClient = clients.find((c) => c.id === config.clientId) || null;

  const handleSttModelChange = (sttModel: SttModel) => {
    onConfigChange({ ...config, sttModel });
  };

  const handleClientSelect = (client: Client | null) => {
    onConfigChange({ ...config, clientId: client?.id });
    setIsClientSelectorOpen(false);
  };

  // 업로드 상태
  const isProcessing = result && result.status !== 'pending';
  const isCompleted = result?.status === 'success';
  const isFailed = result?.status === 'failed';

  // 진행률 계산
  const getProgress = (): number => {
    if (!result) return 0;
    switch (result.status) {
      case 'pending':
        return 0;
      case 'uploading':
        return (result.uploadProgress ?? 0) * 0.5;
      case 'creating':
        return 50 + 50 * 0.5;
      case 'success':
        return 100;
      case 'failed':
        return result.uploadProgress ? result.uploadProgress * 0.5 : 0;
      default:
        return 0;
    }
  };

  return (
    <div
      className={cn(
        'flex w-full items-center gap-2 overflow-hidden rounded-xl border-2 bg-surface p-4',
        isFailed ? 'border-red-300 bg-red-50' : 'border-border'
      )}
    >
      <div className="flex items-center justify-center">
        {/* 순서 번호 또는 진행 상태 */}
        <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center">
          {isCompleted ? (
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-500">
              <CheckIcon size={16} className="text-white" />
            </div>
          ) : isFailed ? (
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-red-500">
              <XIcon size={16} className="text-white" />
            </div>
          ) : isProcessing ? (
            <CircularProgress
              progress={getProgress()}
              size={32}
              strokeWidth={3}
            />
          ) : (
            <Text className="text-xl font-semibold text-fg-muted">
              {index + 1}
            </Text>
          )}
        </div>
      </div>

      {/* 우측: 상담기록 업로드 정보 */}
      <div className="min-w-0 flex-1 flex-col">
        <div className="flex items-start gap-3">
          {/* 파일 정보 */}
          <div className="min-w-0 flex-1">
            <p className="truncate font-medium text-fg">{file.name}</p>
            <Text className="text-sm text-fg-muted">
              {formatFileSize(file.size)}
              {file.duration !== undefined && (
                <> | {formatDurationInTime(file.duration)}</>
              )}
            </Text>
            {isFailed && result?.errorMessage && (
              <Text className="text-sm text-red-500">
                {result.errorMessage}
              </Text>
            )}
          </div>

          {/* 삭제 버튼 */}
          <button
            type="button"
            onClick={() => onRemove(file.id)}
            className="flex-shrink-0 p-1 text-fg-muted transition-colors hover:text-fg"
            aria-label="파일 제거"
          >
            <XIcon size={18} />
          </button>
        </div>

        <div className="mt-3 flex items-center justify-between">
          {/* 내담자 선택 */}
          <ClientSelector
            clients={clients}
            selectedClient={selectedClient}
            onSelect={handleClientSelect}
            variant="dropdown"
            open={isClientSelectorOpen}
            onOpenChange={setIsClientSelectorOpen}
            placement="bottom-left"
            trigger={
              <Button
                variant="outline"
                size="sm"
                className="flex items-center gap-2"
              >
                <UserIcon size={14} />
                <Text className="truncate text-sm">
                  {selectedClient?.name || '클라이언트 선택 안됨'}
                </Text>
              </Button>
            }
          />

          {/* STT 모델 선택 */}
          <MobileSttModelToggle
            value={config.sttModel}
            onChange={handleSttModelChange}
          />
        </div>
      </div>
    </div>
  );
};

import React from 'react';

import { Button } from '@/components/ui/atoms/Button';
import { Text } from '@/components/ui/atoms/Text';
import { ClientSelector } from '@/feature/client/components/ClientSelector';
import type { Client } from '@/feature/client/types';
import { cn } from '@/lib/cn';
import { CheckIcon, UserIcon, XIcon } from '@/shared/icons';
import { formatDurationInTime, formatFileSize } from '@/shared/utils/format';

import type {
  FileSessionConfig,
  MultiFileInfo,
  SessionCreateResult,
  SttModel,
} from '../../types';

// 원형 프로그레스 바 컴포넌트
const CircularProgress: React.FC<{
  progress: number; // 0-100
  size?: number;
  strokeWidth?: number;
}> = ({ progress, size = 24, strokeWidth = 3 }) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (progress / 100) * circumference;

  return (
    <svg width={size} height={size} className="rotate-[-90deg]">
      {/* 배경 원 */}
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        className="text-border"
      />
      {/* 진행 원 */}
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

interface MultiFileConfigItemProps {
  index: number;
  file: MultiFileInfo;
  config: FileSessionConfig;
  clients: Client[];
  result?: SessionCreateResult;
  onConfigChange: (config: FileSessionConfig) => void;
  onRemove: (fileId: string) => void;
}

const SttModelToggle: React.FC<{
  value: SttModel;
  onChange: (value: SttModel) => void;
}> = ({ value, onChange }) => {
  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={() => onChange('whisper')}
        className={cn(
          'flex items-center gap-1 rounded-md px-2 py-1 text-sm transition-colors',
          value === 'whisper'
            ? 'bg-primary-100 text-primary'
            : 'text-fg-muted hover:bg-surface-contrast'
        )}
      >
        일반
        <div
          className={cn(
            'flex h-4 w-4 items-center justify-center rounded-full',
            value === 'whisper' ? 'bg-primary' : 'bg-surface-strong'
          )}
        >
          <svg
            width="10"
            height="10"
            viewBox="0 0 14 14"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M11.6666 3.5L5.24998 9.91667L2.33331 7"
              stroke="white"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
      </button>
      <button
        type="button"
        onClick={() => onChange('gemini-3')}
        className={cn(
          'flex items-center gap-1 rounded-md px-2 py-1 text-sm transition-colors',
          value === 'gemini-3'
            ? 'bg-primary-100 text-primary'
            : 'text-fg-muted hover:bg-surface-contrast'
        )}
      >
        고급
        <div
          className={cn(
            'flex h-4 w-4 items-center justify-center rounded-full',
            value === 'gemini-3' ? 'bg-primary' : 'bg-surface-strong'
          )}
        >
          <svg
            width="10"
            height="10"
            viewBox="0 0 14 14"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M11.6666 3.5L5.24998 9.91667L2.33331 7"
              stroke="white"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
      </button>
    </div>
  );
};

export const MultiFileConfigItem: React.FC<MultiFileConfigItemProps> = ({
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

  // 업로드 진행 중이거나 완료된 경우 컨트롤 비활성화
  const isProcessing = result && result.status !== 'pending';
  const isCompleted = result?.status === 'success';
  const isFailed = result?.status === 'failed';

  // 진행률 계산 (uploading: 0-50%, creating: 50-100%)
  const getProgress = (): number => {
    if (!result) return 0;
    switch (result.status) {
      case 'pending':
        return 0;
      case 'uploading':
        return (result.uploadProgress ?? 0) * 0.5; // 0-50%
      case 'creating':
        return 50 + 50 * 0.5; // 75% (중간값)
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
        'flex h-[106px] w-full max-w-[843px] items-center gap-4 rounded-lg border-2 bg-surface px-4 py-3',
        isFailed ? 'border-red-300 bg-red-50' : 'border-border'
      )}
    >
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
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-surface-contrast text-sm font-medium text-fg">
            {index + 1}
          </div>
        )}
      </div>

      {/* 파일 정보 */}
      <div className="min-w-0 flex-1">
        <Text className="truncate font-medium text-fg">{file.name}</Text>
        <Text className="text-sm text-fg-muted">
          {formatFileSize(file.size)}
          {file.duration !== undefined && (
            <> | {formatDurationInTime(file.duration)}</>
          )}
          {isFailed && result?.errorMessage && (
            <span className="ml-2 text-red-500">({result.errorMessage})</span>
          )}
        </Text>
      </div>

      {/* STT 모델 선택 */}
      <SttModelToggle value={config.sttModel} onChange={handleSttModelChange} />

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
            className="flex min-w-[120px] items-center gap-2"
          >
            <UserIcon size={14} />
            <Text className="truncate text-sm">
              {selectedClient?.name || '고객 선택 안됨'}
            </Text>
          </Button>
        }
      />

      {/* 삭제 버튼 */}
      <button
        type="button"
        onClick={() => onRemove(file.id)}
        className="flex-shrink-0 p-1 text-fg-muted transition-colors hover:text-fg"
        aria-label="파일 제거"
      >
        <XIcon size={16} />
      </button>
    </div>
  );
};

import React from 'react';

import { Title } from '@/components/ui';
import { Button } from '@/components/ui/atoms/Button';
import { Text } from '@/components/ui/atoms/Text';
import { Modal } from '@/components/ui/composites/Modal';
import type { Client } from '@/feature/client/types';

import { ClientSelector } from './ClientSelector';
import { FileUploadArea } from './FileUploadArea';

interface AudioFileInfo {
  name: string;
  size: number;
  duration: number;
  file: File;
}

interface CreateSessionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clients: Client[];
  onCreateSession: (data: {
    client: Client | null;
    file: AudioFileInfo;
  }) => Promise<void>;
}

export const CreateSessionModal: React.FC<CreateSessionModalProps> = ({
  open,
  onOpenChange,
  clients,
  onCreateSession,
}) => {
  const [selectedClient, setSelectedClient] = React.useState<Client | null>(
    null
  );
  const [selectedFile, setSelectedFile] = React.useState<AudioFileInfo | null>(
    null
  );
  const [isCreating, setIsCreating] = React.useState(false);

  const handleClose = () => {
    if (!isCreating) {
      onOpenChange(false);
      // Reset state
      setTimeout(() => {
        setSelectedClient(null);
        setSelectedFile(null);
      }, 300);
    }
  };

  const handleCreateSession = async () => {
    if (!selectedFile) return;

    setIsCreating(true);
    try {
      await onCreateSession({
        client: selectedClient,
        file: selectedFile,
      });
      handleClose();
    } catch (error) {
      console.error('Failed to create session:', error);
    } finally {
      setIsCreating(false);
    }
  };

  const formatDuration = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    return `${minutes}분`;
  };

  const canSubmit = selectedFile !== null && !isCreating;

  return (
    <Modal open={open} onOpenChange={handleClose}>
      <div className="space-y-6 p-6">
        {/* 제목 */}
        <div className="text-center">
          <Title as="h3" className="font-bold">
            녹음 파일로 상담 기록 추가하기
          </Title>
        </div>

        {/* 고객 선택 */}
        <div className="relative">
          <ClientSelector
            clients={clients}
            selectedClient={selectedClient}
            onSelect={setSelectedClient}
          />
        </div>

        {/* 파일 업로드 */}
        <FileUploadArea
          selectedFile={selectedFile}
          onFileSelect={setSelectedFile}
        />

        {/* 크레딧 안내 */}
        {selectedFile && (
          <Text className="text-center text-muted">
            축어록 풀기 {formatDuration(selectedFile.duration)} / AI 분석 1회가
            차감됩니다.
          </Text>
        )}

        {/* 버튼 */}
        <Button
          variant="solid"
          tone="primary"
          size="lg"
          onClick={handleCreateSession}
          disabled={!canSubmit}
          className="w-full"
        >
          {isCreating ? '상담 기록 만드는 중...' : '상담 기록 만들기'}
        </Button>
      </div>
    </Modal>
  );
};

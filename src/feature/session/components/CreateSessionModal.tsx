import React from 'react';

import { Title } from '@/components/ui';
import { Button } from '@/components/ui/atoms/Button';
import { Text } from '@/components/ui/atoms/Text';
import { Modal } from '@/components/ui/composites/Modal';
import type { Client } from '@/feature/client/types';

import type { FileInfo, UploadType } from '../types';
import {
  getSessionCreditInfo,
  getSessionModalTitle,
} from '../utils/sessionModal';

import { ClientSelector } from './ClientSelector';
import { FileUploadArea } from './FileUploadArea';

interface CreateSessionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  type: UploadType;
  clients: Client[];
  onCreateSession: (data: {
    client: Client | null;
    file?: FileInfo;
    directInput?: string;
  }) => Promise<void>;
}

export const CreateSessionModal: React.FC<CreateSessionModalProps> = ({
  open,
  onOpenChange,
  type,
  clients,
  onCreateSession,
}) => {
  const [selectedClient, setSelectedClient] = React.useState<Client | null>(
    null
  );
  const [selectedFile, setSelectedFile] = React.useState<FileInfo | null>(null);
  const [directInput, setDirectInput] = React.useState('');
  const [isCreating, setIsCreating] = React.useState(false);

  const handleClose = () => {
    if (!isCreating) {
      onOpenChange(false);
      setTimeout(() => {
        setSelectedClient(null);
        setSelectedFile(null);
        setDirectInput('');
      }, 300);
    }
  };

  const handleCreateSession = async () => {
    if (type !== 'direct' && !selectedFile) return;
    if (type === 'direct' && !directInput.trim()) return;

    setIsCreating(true);
    try {
      await onCreateSession({
        client: selectedClient,
        file: selectedFile || undefined,
        directInput: type === 'direct' ? directInput : undefined,
      });
      handleClose();
    } catch (error) {
      console.error('Failed to create session:', error);
    } finally {
      setIsCreating(false);
    }
  };

  const canSubmit =
    (type !== 'direct' ? selectedFile !== null : directInput.trim() !== '') &&
    !isCreating;

  return (
    <Modal open={open} onOpenChange={handleClose}>
      <div className="space-y-6 p-6">
        <div className="text-center">
          <Title as="h3" className="font-bold">
            {getSessionModalTitle(type)}
          </Title>
        </div>

        <div className="relative">
          <ClientSelector
            clients={clients}
            selectedClient={selectedClient}
            onSelect={setSelectedClient}
          />
        </div>

        {type !== 'direct' ? (
          <FileUploadArea
            type={type}
            selectedFile={selectedFile}
            onFileSelect={setSelectedFile}
          />
        ) : (
          <div className="space-y-2">
            <textarea
              className="focus:ring-primary/20 min-h-[200px] w-full resize-none rounded-lg border border-border bg-bg px-4 py-3 text-fg focus:border-primary focus:outline-none focus:ring-2"
              placeholder="상담 내용을 직접 입력하세요..."
              value={directInput}
              onChange={(e) => setDirectInput(e.target.value)}
            />
          </div>
        )}

        {getSessionCreditInfo(type, selectedFile) && (
          <Text className="text-center text-muted">
            {getSessionCreditInfo(type, selectedFile)}
          </Text>
        )}

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

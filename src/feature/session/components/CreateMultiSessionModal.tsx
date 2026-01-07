import React, { useCallback, useMemo, useState } from 'react';

import { Title } from '@/components/ui';
import { Button } from '@/components/ui/atoms/Button';
import { Text } from '@/components/ui/atoms/Text';
import { Modal } from '@/components/ui/composites/Modal';
import { useToast } from '@/components/ui/composites/Toast';
import { ClientSelector } from '@/feature/client/components/ClientSelector';
import { useClientList } from '@/feature/client/hooks/useClientList';
import type { Client } from '@/feature/client/types';
import { CloudUploadIcon } from '@/shared/icons';
import { useAuthStore } from '@/stores/authStore';

import { MULTI_UPLOAD_LIMITS } from '../constants/fileUpload';
import { useDragAndDrop } from '../hooks/useDragAndDrop';
import { useMultiFileUpload } from '../hooks/useMultiFileUpload';
import { useMultiSessionCreate } from '../hooks/useMultiSessionCreate';
import type { BatchSessionConfig, FileSessionConfig, SttModel } from '../types';
import { calculateTotalCredit } from '../utils/creditCalculator';

import { MultiFileConfigItem } from './multi-upload/MultiFileConfigItem';
import { MultiFileItem } from './multi-upload/MultiFileItem';
import SttModelSelector from './SttModelSelector';

interface CreateMultiSessionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type ModalStep = 'upload' | 'config';

export const CreateMultiSessionModal: React.FC<
  CreateMultiSessionModalProps
> = ({ open, onOpenChange }) => {
  const { toast } = useToast();
  const userId = useAuthStore((state) => state.userId);
  const defaultTemplateId = useAuthStore((state) => state.defaultTemplateId);
  const { clients } = useClientList();

  // Step 상태
  const [step, setStep] = useState<ModalStep>('upload');

  // 파일 관리
  const {
    files,
    validFiles,
    addFiles,
    removeFile,
    clearFiles,
    isProcessing,
    canAddMore,
  } = useMultiFileUpload();

  // 일괄 설정 (Step 1)
  const [batchConfig, setBatchConfig] = useState<BatchSessionConfig>({
    sttModel: 'gemini-3',
    clientId: undefined,
  });

  // 개별 설정 (Step 2)
  const [fileConfigs, setFileConfigs] = useState<FileSessionConfig[]>([]);

  // 세션 생성
  const { createSessions, results, isCreating } = useMultiSessionCreate({
    userId: userId ? parseInt(userId) : 0,
    templateId: defaultTemplateId || 1,
  });

  // Drag and Drop
  const { isDragging, handleDragOver, handleDragLeave, handleDrop } =
    useDragAndDrop();
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // 모달 닫기 핸들러
  const handleClose = useCallback(
    (isOpen: boolean) => {
      if (!isOpen) {
        setStep('upload');
        clearFiles();
        setBatchConfig({ sttModel: 'gemini-3', clientId: undefined });
        setFileConfigs([]);
      }
      onOpenChange(isOpen);
    },
    [clearFiles, onOpenChange]
  );

  // 크레딧 계산 (Step 1)
  const step1TotalCredit = useMemo(() => {
    return validFiles.reduce((sum, file) => {
      if (file.duration === undefined) return sum;
      const { totalCredit } = calculateTotalCredit({
        uploadType: 'audio',
        transcribeType:
          batchConfig.sttModel === 'gemini-3' ? 'advanced' : 'basic',
        durationSeconds: file.duration,
      });
      return sum + totalCredit;
    }, 0);
  }, [validFiles, batchConfig.sttModel]);

  // 크레딧 계산 (Step 2)
  const step2TotalCredit = useMemo(() => {
    return fileConfigs.reduce((sum, config) => {
      const file = validFiles.find((f) => f.id === config.fileId);
      if (!file || file.duration === undefined) return sum;
      const { totalCredit } = calculateTotalCredit({
        uploadType: 'audio',
        transcribeType: config.sttModel === 'gemini-3' ? 'advanced' : 'basic',
        durationSeconds: file.duration,
      });
      return sum + totalCredit;
    }, 0);
  }, [fileConfigs, validFiles]);

  // 파일 드롭 핸들러
  const onFileDrop = useCallback(
    (droppedFiles: File[]) => {
      addFiles(droppedFiles);
    },
    [addFiles]
  );

  const onDrop = (e: React.DragEvent) => {
    handleDrop(e, onFileDrop);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputFiles = e.target.files;
    if (inputFiles) {
      addFiles(Array.from(inputFiles));
    }
    // 같은 파일 재선택 가능하도록 초기화
    e.target.value = '';
  };

  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  // 일괄 설정 변경
  const handleBatchSttModelChange: React.Dispatch<
    React.SetStateAction<SttModel>
  > = (value) => {
    const sttModel =
      typeof value === 'function' ? value(batchConfig.sttModel) : value;
    setBatchConfig((prev) => ({ ...prev, sttModel }));
  };

  const handleBatchClientSelect = (client: Client | null) => {
    setBatchConfig((prev) => ({ ...prev, clientId: client?.id }));
  };

  // 개별 설정 변경
  const handleConfigChange = (updatedConfig: FileSessionConfig) => {
    setFileConfigs((prev) =>
      prev.map((c) => (c.fileId === updatedConfig.fileId ? updatedConfig : c))
    );
  };

  // Step 2에서 파일 제거
  const handleRemoveFromConfig = (fileId: string) => {
    removeFile(fileId);
    setFileConfigs((prev) => prev.filter((c) => c.fileId !== fileId));
  };

  // 다음 단계로
  const handleNextStep = () => {
    if (validFiles.length === 0) {
      toast({
        title: '유효한 파일이 없습니다',
        description: '업로드 가능한 파일을 추가해주세요.',
        duration: 3000,
      });
      return;
    }
    // Step 2로 이동 시 개별 설정 초기화
    setFileConfigs(
      validFiles.map((file, index) => ({
        fileId: file.id,
        order: index + 1,
        sttModel: batchConfig.sttModel,
        clientId: batchConfig.clientId,
      }))
    );
    setStep('config');
  };

  // 이전 단계로
  const handlePrevStep = () => {
    setStep('upload');
  };

  // 세션 생성
  const handleCreateSessions = async () => {
    if (!userId) {
      toast({
        title: '오류',
        description: '로그인 정보를 불러오는 중입니다.',
        duration: 3000,
      });
      return;
    }

    const finalResults = await createSessions(fileConfigs, validFiles);

    const successCount = finalResults.filter(
      (r) => r.status === 'success'
    ).length;
    const failedCount = finalResults.filter(
      (r) => r.status === 'failed'
    ).length;

    if (successCount > 0) {
      toast({
        title: '상담 기록 생성 요청 완료',
        description:
          failedCount > 0
            ? `${successCount}개 성공, ${failedCount}개 실패`
            : `${successCount}개의 상담 기록이 생성 중입니다.`,
        duration: 5000,
      });
    }

    if (failedCount > 0 && successCount === 0) {
      toast({
        title: '상담 기록 생성 실패',
        description: '모든 파일 업로드에 실패했습니다.',
        duration: 5000,
      });
    }

    handleClose(false);
  };

  // Step 2에서 사용할 validFiles (config에 있는 것만)
  const configValidFiles = useMemo(() => {
    return validFiles.filter((f) => fileConfigs.some((c) => c.fileId === f.id));
  }, [validFiles, fileConfigs]);

  return (
    <Modal
      className="flex h-full max-h-[738px] max-w-[1056px] flex-col gap-12"
      open={open}
      onOpenChange={handleClose}
      closeOnOverlay={!isCreating}
    >
      {/* 헤더 */}
      <div className="pt-4 text-center">
        <Title as="h3" className="font-bold">
          녹음 파일로 상담 기록 추가하기
        </Title>
      </div>

      {step === 'upload' ? (
        /* Step 1: 파일 업로드 + 일괄 설정 */
        <div className="mb-8 flex flex-1 flex-col items-center justify-center gap-6 space-y-4 px-12 sm:flex-col md:flex-row">
          {/* 왼쪽: 파일 목록 */}
          <div className="h-full max-h-[431px] w-full max-w-[488px] flex-1">
            <input
              ref={fileInputRef}
              type="file"
              accept="audio/*"
              multiple
              onChange={handleFileInputChange}
              className="hidden"
            />

            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={onDrop}
              className={`h-full min-h-[300px] rounded-lg bg-surface-contrast p-4 transition-colors ${
                isDragging
                  ? 'border-primary bg-primary-100'
                  : 'border-surface-strong'
              }`}
            >
              {files.length === 0 ? (
                <div className="flex h-full min-h-[280px] flex-col items-center justify-center gap-4 break-keep">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-surface-contrast">
                    <CloudUploadIcon className="h-6 w-6 text-fg-muted" />
                  </div>
                  <div className="space-y-2 text-center">
                    <Text className="text-fg">
                      오디오 파일을 여기에 끌어다 놓으세요
                    </Text>
                    <Text className="text-fg-muted">
                      최대 {MULTI_UPLOAD_LIMITS.MAX_FILES}개 파일
                    </Text>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleButtonClick}
                  >
                    + 파일 선택하기
                  </Button>
                </div>
              ) : (
                <div className="h-full max-h-[431px] w-full max-w-[488px] space-y-2 overflow-y-auto">
                  {files.map((file) => (
                    <MultiFileItem
                      key={file.id}
                      file={file}
                      onRemove={removeFile}
                    />
                  ))}

                  {canAddMore && (
                    <button
                      onClick={handleButtonClick}
                      className="h-[82px] w-full max-w-[440px] rounded-lg border-2 border-surface-strong text-center text-5xl font-thin text-fg-muted"
                    >
                      +
                    </button>
                  )}
                </div>
              )}
            </div>

            <Text className="mt-2 text-center text-sm text-fg-muted">
              파일 개수{' '}
              <span className="font-medium text-primary">{files.length}</span> /{' '}
              {MULTI_UPLOAD_LIMITS.MAX_FILES}
            </Text>
          </div>

          {/* 오른쪽: 일괄 설정 */}
          <div className="min-w-fit space-y-6">
            <div>
              <Text className="mb-2 font-semibold text-fg">일괄 설정</Text>
            </div>

            <div className="flex flex-col items-center justify-start lg:flex-row lg:justify-between">
              <Text className="mb-2 text-sm text-fg-muted">내담자 선택</Text>
              <ClientSelector
                clients={clients}
                selectedClient={
                  clients.find((c) => c.id === batchConfig.clientId) || null
                }
                onSelect={handleBatchClientSelect}
                variant="default"
              />
            </div>

            <div>
              <Text className="mb-2 text-sm text-fg-muted">축어록 종류</Text>
              <SttModelSelector
                sttModel={batchConfig.sttModel}
                setSttModel={handleBatchSttModelChange}
              />
            </div>

            {validFiles.length > 0 && (
              <div className="text-center">
                <Text className="text-primary">
                  <span className="font-bold">{validFiles.length}개</span>의
                  상담기록 생성으로
                </Text>
                <Text className="text-primary">
                  총{' '}
                  <span className="font-bold">{step1TotalCredit} 크레딧</span>을
                  사용합니다.
                </Text>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Step 2: 개별 설정 + 순서 지정 */
        <div className="mx-auto h-full max-h-[490px] w-full max-w-[883px] space-y-4">
          <Text className="text-sm text-fg-muted">음성파일 세부 설정</Text>

          <div className="max-h-[400px] space-y-2 overflow-y-auto">
            {fileConfigs.map((config, index) => {
              const file = configValidFiles.find((f) => f.id === config.fileId);
              if (!file) return null;
              return (
                <MultiFileConfigItem
                  key={config.fileId}
                  index={index}
                  file={file}
                  config={config}
                  clients={clients}
                  result={results.find((r) => r.fileId === config.fileId)}
                  onConfigChange={handleConfigChange}
                  onRemove={handleRemoveFromConfig}
                />
              );
            })}
          </div>

          {/* 크레딧 표시 */}
        </div>
      )}

      {/* 하단 버튼 */}
      <div className="flex justify-center gap-3">
        {step === 'upload' ? (
          <Button
            variant="solid"
            tone="primary"
            size="lg"
            onClick={handleNextStep}
            disabled={validFiles.length === 0 || isProcessing}
            className="max-h-[41px] w-full max-w-[375px]"
          >
            {isProcessing ? '파일 처리 중...' : '다음'}
          </Button>
        ) : (
          <div className="flex flex-col gap-2">
            <div className="flex justify-center">
              <div className="flex items-center gap-1 rounded-lg bg-primary-100 px-3 py-1">
                <Text className="font-bold text-primary-600">
                  {step2TotalCredit}
                </Text>
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 14 14"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  className="text-primary-600"
                >
                  <g clipPath="url(#clip0_credit_modal)">
                    <path
                      d="M7 14C10.866 14 14 10.866 14 7C14 3.134 10.866 0 7 0C3.134 0 0 3.134 0 7C0.00418359 10.8643 3.13573 13.9958 7 14ZM4.1125 4.1125C5.70836 2.52055 8.29164 2.52055 9.8875 4.1125C10.1113 4.34424 10.1049 4.71352 9.87317 4.93732C9.64712 5.15566 9.28873 5.15566 9.06268 4.93732C7.92351 3.79846 6.07677 3.79868 4.9379 4.93787C3.79903 6.07707 3.79925 7.92378 4.93845 9.06265C6.07742 10.2013 7.92373 10.2013 9.0627 9.06265C9.29444 8.83884 9.66372 8.84527 9.88753 9.07701C10.1058 9.30306 10.1058 9.66142 9.88753 9.8875C8.29281 11.4822 5.70724 11.4822 4.11253 9.8875C2.51779 8.29279 2.51779 5.70721 4.1125 4.1125Z"
                      fill="currentColor"
                    />
                  </g>
                  <defs>
                    <clipPath id="clip0_credit_modal">
                      <rect width="14" height="14" fill="white" />
                    </clipPath>
                  </defs>
                </svg>
                <Text className="text-primary-600">사용</Text>
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                tone="neutral"
                size="lg"
                onClick={handlePrevStep}
                disabled={isCreating}
              >
                이전
              </Button>
              <Button
                variant="solid"
                tone="primary"
                size="lg"
                onClick={handleCreateSessions}
                disabled={fileConfigs.length === 0 || isCreating}
                className="w-[335px] flex-1"
              >
                {isCreating ? '업로드 중...' : '상담 기록 만들기'}
              </Button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};

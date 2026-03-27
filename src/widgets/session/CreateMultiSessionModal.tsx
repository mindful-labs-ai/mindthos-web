import React, { useCallback, useMemo, useState } from 'react';

import { useClientList } from '@/features/client/hooks/useClientList';
import type { Client } from '@/features/client/types';
import { useDragAndDrop } from '@/features/session/hooks/useDragAndDrop';
import { useMultiFileUpload } from '@/features/session/hooks/useMultiFileUpload';
import { useMultiSessionCreate } from '@/features/session/hooks/useMultiSessionCreate';
import type {
  BatchSessionConfig,
  FileSessionConfig,
  SttModel,
} from '@/features/session/types';
import { calculateTotalCredit } from '@/features/session/utils/creditCalculator';
import { useCreditInfo } from '@/features/settings/hooks/useCreditInfo';
import { cn } from '@/lib/cn';
import { trackError, trackEvent } from '@/lib/mixpanel';
import { MULTI_UPLOAD_LIMITS } from '@/shared/constants/fileUpload';
import {
  MixpanelError,
  MixpanelEvent,
} from '@/shared/constants/mixpanelEvents';
import { useDevice } from '@/shared/hooks/useDevice';
import { CloudUploadIcon, CreditIcon, UserIcon } from '@/shared/icons';
import { Title } from '@/shared/ui';
import { BackButton } from '@/shared/ui/atoms/BackButton';
import { Button } from '@/shared/ui/atoms/Button';
import { Text } from '@/shared/ui/atoms/Text';
import { Modal } from '@/shared/ui/composites/Modal';
import { SnackBar } from '@/shared/ui/composites/SnackBar';
import { useToast } from '@/shared/ui/composites/Toast';
import { useAuthStore } from '@/stores/authStore';
import { useModalStore } from '@/stores/modalStore';
import { useQuestStore } from '@/stores/questStore';
import { ClientSelector } from '@/widgets/client/ClientSelector';
import { MobileSttModelSelector } from '@/widgets/home/MobileSttModelSelector';

import { MultiFileConfigItem } from './multi-upload/MultiFileConfigItem';
import { MultiFileItem } from './multi-upload/MultiFileItem';
import SttModelSelector from './SttModelSelector';

/** 스크롤 가능한 방향에만 그라데이션을 보여주는 래퍼 */
const ScrollFadeWrapper: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const scrollRef = React.useRef<HTMLDivElement>(null);
  const [canScrollUp, setCanScrollUp] = React.useState(false);
  const [canScrollDown, setCanScrollDown] = React.useState(false);

  const checkScroll = React.useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollUp(el.scrollTop > 4);
    setCanScrollDown(el.scrollHeight - el.scrollTop - el.clientHeight > 4);
  }, []);

  React.useEffect(() => {
    checkScroll();
    const el = scrollRef.current;
    if (!el) return;
    const observer = new ResizeObserver(checkScroll);
    observer.observe(el);
    return () => observer.disconnect();
  }, [checkScroll]);

  return (
    <div className="relative min-h-0 flex-1">
      <div
        className={cn(
          'pointer-events-none absolute inset-x-0 top-0 z-10 h-16 bg-gradient-to-b from-surface to-transparent transition-opacity',
          canScrollUp ? 'opacity-100' : 'opacity-0'
        )}
      />
      <div
        ref={scrollRef}
        onScroll={checkScroll}
        className="h-full overflow-y-auto overscroll-contain"
      >
        {children}
      </div>
      <div
        className={cn(
          'pointer-events-none absolute inset-x-0 bottom-0 z-10 h-16 bg-gradient-to-t from-surface to-transparent transition-opacity',
          canScrollDown ? 'opacity-100' : 'opacity-0'
        )}
      />
    </div>
  );
};

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
  const { creditInfo } = useCreditInfo();

  // Quest 관련 hooks
  const { currentLevel, setShowConfetti, completeNextStep } = useQuestStore();

  // Step 상태
  const [step, setStep] = useState<ModalStep>('upload');

  // 모바일 클라이언트 선택 모달
  const [isClientModalOpen, setIsClientModalOpen] = useState(false);

  // 크레딧 부족 에러 상태
  const [creditErrorSnackBar, setCreditErrorSnackBar] = useState({
    open: false,
    message: '',
  });
  const openModal = useModalStore((state) => state.openModal);
  const { isMobile, isTablet } = useDevice();
  const isMobileView = isMobile || isTablet;

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

    // 프론트 크레딧 검증
    const remainingCredit = creditInfo?.plan.remaining ?? 0;
    if (step2TotalCredit > remainingCredit) {
      setCreditErrorSnackBar({
        open: true,
        message: `크레딧이 부족합니다. 필요: ${step2TotalCredit}, 보유: ${remainingCredit}`,
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
      trackEvent(MixpanelEvent.MultiSessionCreateSuccess, {
        success_count: successCount,
        failed_count: failedCount,
        total_count: fileConfigs.length,
      });

      toast({
        title: '상담 기록 생성 요청 완료',
        description:
          failedCount > 0
            ? `${successCount}개 성공, ${failedCount}개 실패`
            : `${successCount}개의 상담 기록이 생성 중입니다.`,
        duration: 5000,
      });

      // 퀘스트(레벨 4) 진행 중이라면 완료 처리 (L4→L5)
      if (currentLevel === 4) {
        await completeNextStep(useAuthStore.getState().user?.email || '');
        setShowConfetti(true);
      }
    }

    if (failedCount > 0) {
      const failedResults = finalResults.filter((r) => r.status === 'failed');
      failedResults.forEach((result) => {
        trackError(
          MixpanelError.MultiSessionCreateError,
          new Error(result.errorMessage || 'Unknown error'),
          {
            file_id: result.fileId,
            file_name: result.fileName,
            file_count: fileConfigs.length,
            failed_count: failedCount,
            success_count: successCount,
          }
        );
      });

      if (successCount === 0) {
        toast({
          title: '상담 기록 생성 실패',
          description: '파일 업로드에 실패했습니다. 다시 시도해주세요.',
          duration: 5000,
        });
      }
    }

    handleClose(false);
  };

  // Step 2에서 사용할 validFiles (config에 있는 것만)
  const configValidFiles = useMemo(() => {
    return validFiles.filter((f) => fileConfigs.some((c) => c.fileId === f.id));
  }, [validFiles, fileConfigs]);

  // 공통 파일 입력
  const fileInput = (
    <input
      ref={fileInputRef}
      type="file"
      accept="audio/*,.mp3,.m4a,.wav,.aac,.ogg,.flac,.wma,.aiff,.opus"
      multiple
      onChange={handleFileInputChange}
      className="hidden"
    />
  );

  // 공통 파일 드롭 영역
  const fileDropArea = (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={onDrop}
      className={cn(
        'bg-surface-contrast p-4 transition-colors',
        isMobile && 'h-[36.8vh] min-h-[200px]',
        isTablet && 'h-[32.4vh] min-h-[200px]',
        !isMobileView && 'h-full min-h-[300px] rounded-lg',
        isDragging
          ? 'border-primary bg-primary-subtle'
          : 'border-surface-strong'
      )}
    >
      {files.length === 0 ? (
        <div
          className={cn(
            'flex h-full flex-col items-center justify-center gap-4 break-keep',
            !isMobileView && 'max-h-[431px] min-h-[280px]'
          )}
        >
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
          <Button variant="outline" size="sm" onClick={handleButtonClick}>
            + 파일 선택하기
          </Button>
        </div>
      ) : (
        <div
          className={cn(
            'h-full w-full space-y-2 overflow-y-auto',
            !isMobileView && 'max-h-[431px] max-w-[488px]'
          )}
        >
          {files.map((file) => (
            <MultiFileItem key={file.id} file={file} onRemove={removeFile} />
          ))}
          {canAddMore && (
            <button
              onClick={handleButtonClick}
              className="h-[82px] w-full rounded-lg border-2 border-surface-strong text-center text-5xl font-thin text-fg-muted"
            >
              +
            </button>
          )}
        </div>
      )}
    </div>
  );

  // 공통 크레딧 정보 (Step 1)
  const creditInfo1 = validFiles.length > 0 && (
    <div className="flex flex-1 flex-col items-center justify-start text-center text-l font-emphasize text-grey-100 lg:justify-center">
      <p>
        <span className="text-green-80">{validFiles.length}개</span>의 상담기록
        생성으로
      </p>
      <p>
        총 <span className="text-green-80">{step1TotalCredit} 크레딧</span>을
        사용합니다.
      </p>
    </div>
  );

  // 공통 개별 설정 목록 (Step 2)
  const configList = (
    <div
      className={cn(
        'space-y-2 overflow-y-auto',
        isMobileView ? 'flex-1' : 'max-h-[400px]'
      )}
    >
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
            isMobileView={isMobileView}
          />
        );
      })}
    </div>
  );

  // Step 2 하단 크레딧 + 버튼
  const step2Buttons = (
    <div className="flex flex-col gap-2">
      <div className="flex justify-center">
        <div className="flex items-center gap-1 rounded-lg bg-primary-subtle px-3 py-1">
          <Text className="font-headline text-primary">{step2TotalCredit}</Text>
          <CreditIcon size={14} />
          <Text className="text-primary">사용</Text>
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
          className={isMobileView ? 'flex-1' : 'w-[335px] flex-1'}
        >
          {isCreating ? '업로드 중...' : '상담 기록 만들기'}
        </Button>
      </div>
    </div>
  );

  return (
    <Modal
      className={cn(
        'flex flex-col',
        !isMobileView && 'h-[730px] max-w-[1056px] gap-12'
      )}
      open={open}
      onOpenChange={handleClose}
      closeOnOverlay={!isCreating && !isClientModalOpen}
      mobileVariant={isMobileView ? 'fullScreen' : 'center'}
      hideCloseButton={isMobileView}
    >
      {/* 헤더 */}
      {isMobileView ? (
        <div className="flex h-[67px] items-center gap-3 border-b border-border px-4 py-3">
          <BackButton onClick={() => handleClose(false)} />
          <p className="text-l font-medium text-grey-80">
            녹음 파일 업로드하기
          </p>
        </div>
      ) : (
        <div className="pt-4 text-center">
          <Title as="h3" className="font-headline">
            녹음 파일로 상담 기록 추가하기
          </Title>
        </div>
      )}

      {/* 콘텐츠 */}
      {isMobileView ? (
        /* 모바일/태블릿 레이아웃 */
        step === 'upload' ? (
          <div className="flex flex-1 flex-col overflow-y-auto">
            {fileInput}
            {fileDropArea}

            {/* 일괄 설정 */}
            <div className="p-6 md:p-12">
              <p className="mb-6 text-l font-emphasize text-grey-100">
                일괄 설정
              </p>

              <div className="flex items-center justify-between py-2">
                <p className="text-l font-medium text-grey-100">내담자 선택</p>
                <button
                  type="button"
                  onClick={() => setIsClientModalOpen(true)}
                  className="flex items-center gap-2 rounded-md border border-grey-30 bg-white px-3 py-2 text-grey-60"
                >
                  <UserIcon size={18} />

                  {(() => {
                    const selectedName = clients.find(
                      (c) => c.id === batchConfig.clientId
                    )?.name;
                    return selectedName ? (
                      <span className="text-sm font-medium text-grey-100">
                        {selectedName}
                      </span>
                    ) : (
                      <span className="text-sm font-medium">선택 안됨</span>
                    );
                  })()}
                </button>
                <ClientSelector
                  clients={clients}
                  selectedClient={
                    clients.find((c) => c.id === batchConfig.clientId) || null
                  }
                  onSelect={handleBatchClientSelect}
                  variant="modal"
                  open={isClientModalOpen}
                  onOpenChange={setIsClientModalOpen}
                />
              </div>
              <div className="flex items-center justify-between py-2">
                <p className="text-l font-medium text-grey-100">축어록 종류</p>
                <MobileSttModelSelector
                  sttModel={batchConfig.sttModel}
                  setSttModel={handleBatchSttModelChange}
                />
              </div>
            </div>

            {creditInfo1}
          </div>
        ) : (
          <div className="flex min-h-0 flex-1 flex-col overflow-hidden p-4 md:p-12">
            <Text className="typo-sm mb-4 text-fg-muted">
              상담기록 세부 설정
            </Text>
            <ScrollFadeWrapper>{configList}</ScrollFadeWrapper>
          </div>
        )
      ) : /* 데스크탑 레이아웃 */
      step === 'upload' ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-6 px-12 md:flex-row">
          {/* 왼쪽: 파일 목록 */}
          <div className="flex h-full w-full max-w-[488px] flex-1 flex-col">
            {fileInput}
            {fileDropArea}
            <Text className="typo-sm mt-2 text-center text-fg-muted">
              파일 개수{' '}
              <span className="font-medium text-primary">{files.length}</span> /{' '}
              {MULTI_UPLOAD_LIMITS.MAX_FILES}
            </Text>
          </div>

          {/* 오른쪽: 일괄 설정 */}
          <div className="flex h-full w-full max-w-fit flex-col gap-y-6">
            <div>
              <Text className="my-2 font-emphasize text-fg">일괄 설정</Text>
              <div className="flex flex-col justify-start lg:flex-row lg:justify-between">
                <Text className="typo-sm mb-2 text-fg-muted">내담자 선택</Text>
                <ClientSelector
                  clients={clients}
                  selectedClient={
                    clients.find((c) => c.id === batchConfig.clientId) || null
                  }
                  onSelect={handleBatchClientSelect}
                  variant="default"
                />
              </div>
              <Text className="typo-sm mb-2 text-fg-muted">축어록 선택</Text>
              <SttModelSelector
                sttModel={batchConfig.sttModel}
                setSttModel={handleBatchSttModelChange}
              />
            </div>
            {creditInfo1}
          </div>
        </div>
      ) : (
        <div className="mx-auto h-full max-h-[490px] w-full max-w-[883px] space-y-4">
          <Text className="typo-sm text-fg-muted">상담기록 세부 설정</Text>
          {configList}
        </div>
      )}

      {/* 하단 버튼 */}
      <div
        className={cn(isMobileView ? 'px-4 pb-4' : 'flex justify-center gap-3')}
      >
        {step === 'upload' ? (
          <Button
            variant="solid"
            tone="primary"
            size="lg"
            onClick={handleNextStep}
            disabled={validFiles.length === 0 || isProcessing}
            className={isMobileView ? 'w-full' : 'w-full max-w-[375px]'}
          >
            {isProcessing ? '파일 업로드 중...' : '다음'}
          </Button>
        ) : (
          step2Buttons
        )}
      </div>

      {/* 크레딧 부족 SnackBar */}
      <SnackBar
        open={creditErrorSnackBar.open}
        message={creditErrorSnackBar.message}
        onOpenChange={(open) =>
          setCreditErrorSnackBar((prev) => ({ ...prev, open }))
        }
        action={{
          label: '플랜 업그레이드',
          onClick: () => openModal('planChange'),
        }}
        duration={8000}
      />
    </Modal>
  );
};

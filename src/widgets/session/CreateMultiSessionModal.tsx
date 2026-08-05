import React, { useCallback, useMemo, useState } from 'react';

import { useQueryClient } from '@tanstack/react-query';

import { useClientList } from '@/features/client/hooks/useClientList';
import type { Client } from '@/features/client/types';
import { DIRECT_UPLOAD_MIN_SECONDS } from '@/features/onboarding/constants/tutorialUi';
import { useDragAndDrop } from '@/features/session/hooks/useDragAndDrop';
import { useMultiFileUpload } from '@/features/session/hooks/useMultiFileUpload';
import { useMultiSessionCreate } from '@/features/session/hooks/useMultiSessionCreate';
import type {
  BatchSessionConfig,
  FileSessionConfig,
  MultiFileInfo,
  SessionCreateResult,
  SessionRequestSttModel,
} from '@/features/session/types';
import { calculateTotalCredit } from '@/features/session/utils/creditCalculator';
import { cn } from '@/lib/cn';
import { trackError, trackEvent } from '@/lib/mixpanel';
import { MULTI_UPLOAD_LIMITS } from '@/shared/constants/fileUpload';
import {
  MixpanelError,
  MixpanelEvent,
} from '@/shared/constants/mixpanelEvents';
import { creditQueryKeys } from '@/shared/constants/queryKeys';
import { useCreditGuard } from '@/shared/hooks/useCreditGuard';
import { useDevice } from '@/shared/hooks/useDevice';
import { CreditIcon, UserIcon } from '@/shared/icons';
import { MobileModalHeader, Title } from '@/shared/ui';
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
import {
  SessionUploadAiGuardNotice,
  SessionUploadFileDropArea,
} from './multi-upload/SessionUploadFileDropArea';
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
  tutorial?: TutorialSessionUploadState;
}

export interface TutorialSessionUploadState {
  files: MultiFileInfo[];
  clientName: string;
  clientId?: string;
  isRecordUnavailable: boolean;
  directUploadState: 'idle' | 'loading' | 'ready' | 'processing';
  onDirectUpload: () => void;
  onRemoveUploadedFile: () => void;
  onComplete: () => void | Promise<void>;
  /** 로컬 Tutorial QA에서 실제 세션 생성 API를 건너뛴다. */
  debug?: boolean;
}

type ModalStep = 'upload' | 'config';

const TUTORIAL_FAKE_UPLOAD_TRANSFER_MS = 8_000;
const TUTORIAL_FAKE_UPLOAD_TICK_MS = 800;

export const CreateMultiSessionModal: React.FC<
  CreateMultiSessionModalProps
> = ({ open, onOpenChange, tutorial }) => {
  const { toast } = useToast();
  const userId = useAuthStore((state) => state.userId);
  const defaultTemplateId = useAuthStore((state) => state.defaultTemplateId);
  const { clients } = useClientList();
  const queryClient = useQueryClient();
  const checkCredit = useCreditGuard();

  // Quest 관련 hooks
  const { currentLevel, completeNextStep } = useQuestStore();

  // Step 상태
  const [step, setStep] = useState<ModalStep>('upload');

  // 모바일 내담자 선택 모달
  const [isClientModalOpen, setIsClientModalOpen] = useState(false);

  // 크레딧 부족 에러 상태
  const [creditErrorSnackBar, setCreditErrorSnackBar] = useState({
    open: false,
    message: '',
  });
  const openModal = useModalStore((state) => state.openModal);
  const { isMobile, isTablet } = useDevice();
  const isMobileView = isMobile || isTablet;
  const isTutorialMode = tutorial !== undefined;

  // 파일 관리
  const { files, addFiles, removeFile, clearFiles, isProcessing, canAddMore } =
    useMultiFileUpload();

  const effectiveFiles = files;
  const effectiveValidFiles = useMemo(
    () => effectiveFiles.filter((file) => file.validationStatus === 'valid'),
    [effectiveFiles]
  );
  const effectiveIsProcessing = isProcessing;
  const effectiveCanAddMore = canAddMore;

  const hasTutorialLocalFiles = isTutorialMode && effectiveFiles.length > 0;
  const isTutorialPreparedFile =
    isTutorialMode &&
    !hasTutorialLocalFiles &&
    (tutorial.directUploadState === 'ready' ||
      tutorial.directUploadState === 'processing') &&
    tutorial.files.length > 0;
  const stepOneValidFiles = isTutorialPreparedFile
    ? tutorial.files
    : effectiveValidFiles;

  const addRealFiles = useCallback(
    (newFiles: File[]) => {
      if (
        isTutorialPreparedFile ||
        (isTutorialMode && effectiveFiles.length > 0)
      )
        return;
      addFiles(isTutorialMode ? newFiles.slice(0, 1) : newFiles);
    },
    [addFiles, effectiveFiles.length, isTutorialMode, isTutorialPreparedFile]
  );

  const handleTutorialFileLimitExceeded = useCallback(() => {
    toast({
      title: '튜토리얼에서는 1개만 업로드 할 수 있어요.',
      description: '기존 파일을 삭제한 뒤 다시 추가해 주세요.',
    });
  }, [toast]);

  const removeUploadedFile = useCallback(
    (fileId: string) => {
      removeFile(fileId);
    },
    [removeFile]
  );

  // 일괄 설정 (Step 1)
  const [batchConfig, setBatchConfig] = useState<BatchSessionConfig>(() => ({
    sttModel: tutorial ? 'basic' : 'advanced',
    clientId: tutorial?.clientId,
  }));

  React.useEffect(() => {
    if (!tutorial?.clientId) return;
    setBatchConfig((prev) =>
      prev.clientId ? prev : { ...prev, clientId: tutorial.clientId }
    );
  }, [tutorial?.clientId]);

  // 개별 설정 (Step 2)
  const [fileConfigs, setFileConfigs] = useState<FileSessionConfig[]>([]);
  const [tutorialFakeResults, setTutorialFakeResults] = useState<
    SessionCreateResult[]
  >([]);
  const [isTutorialFakeCreating, setIsTutorialFakeCreating] = useState(false);

  // 세션 생성
  const { createSessions, results, isCreating } = useMultiSessionCreate({
    userId: userId ? parseInt(userId) : 0,
    templateId: defaultTemplateId || 1,
    tutorialFirstUpload: isTutorialMode,
    onInsufficientCredit: (message) => {
      setCreditErrorSnackBar({
        open: true,
        message,
      });
    },
  });
  const isTutorialFakeUpload = isTutorialMode && isTutorialPreparedFile;
  const effectiveResults = isTutorialFakeUpload ? tutorialFakeResults : results;
  const effectiveIsCreating = isTutorialFakeUpload
    ? isTutorialFakeCreating
    : isCreating;

  // Drag and Drop
  const { isDragging, handleDragOver, handleDragLeave, handleDrop } =
    useDragAndDrop();

  // 모달 닫기 핸들러
  const handleClose = useCallback(
    (isOpen: boolean) => {
      if (!isOpen) {
        trackEvent(MixpanelEvent.MultiSessionCreateModalClose);
        setStep('upload');
        clearFiles();
        setBatchConfig({ sttModel: 'advanced', clientId: undefined });
        setFileConfigs([]);
        setTutorialFakeResults([]);
        setIsTutorialFakeCreating(false);
      }
      onOpenChange(isOpen);
    },
    [clearFiles, onOpenChange]
  );

  // 모달 오픈 트래킹
  React.useEffect(() => {
    if (open) {
      trackEvent(MixpanelEvent.MultiSessionCreateModalOpen);
    }
  }, [open]);

  // 크레딧 계산 (Step 1)
  const step1TotalCredit = useMemo(() => {
    return effectiveValidFiles.reduce((sum, file) => {
      if (file.duration === undefined) return sum;
      const { totalCredit } = calculateTotalCredit({
        uploadType: 'audio',
        transcribeType:
          batchConfig.sttModel === 'advanced' ? 'advanced' : 'basic',
        durationSeconds: file.duration,
      });
      return sum + totalCredit;
    }, 0);
  }, [effectiveValidFiles, batchConfig.sttModel]);

  // 크레딧 계산 (Step 2)
  const step2TotalCredit = useMemo(() => {
    return fileConfigs.reduce((sum, config) => {
      const file = effectiveValidFiles.find((f) => f.id === config.fileId);
      if (!file || file.duration === undefined) return sum;
      const { totalCredit } = calculateTotalCredit({
        uploadType: 'audio',
        transcribeType: config.sttModel === 'advanced' ? 'advanced' : 'basic',
        durationSeconds: file.duration,
      });
      return sum + totalCredit;
    }, 0);
  }, [fileConfigs, effectiveValidFiles]);

  // 파일 드롭 핸들러
  const onFileDrop = useCallback(
    (droppedFiles: File[]) => {
      addRealFiles(droppedFiles);
    },
    [addRealFiles]
  );

  const onDrop = (e: React.DragEvent<HTMLDivElement>) => {
    handleDrop(e, onFileDrop);
  };

  // 일괄 설정 변경
  const handleBatchSttModelChange: React.Dispatch<
    React.SetStateAction<SessionRequestSttModel>
  > = (value) => {
    const sttModel =
      typeof value === 'function' ? value(batchConfig.sttModel) : value;
    setBatchConfig((prev) => ({ ...prev, sttModel }));
  };

  const handleBatchClientSelect = (client: Client | null) => {
    setBatchConfig((prev) => ({ ...prev, clientId: client?.id }));
  };

  const selectedClient = clients.find(
    (client) => client.id === batchConfig.clientId
  );

  // 개별 설정 변경
  const handleConfigChange = (updatedConfig: FileSessionConfig) => {
    setFileConfigs((prev) =>
      prev.map((c) => (c.fileId === updatedConfig.fileId ? updatedConfig : c))
    );
  };

  // Step 2에서 파일 제거
  const handleRemoveFromConfig = (fileId: string) => {
    removeUploadedFile(fileId);
    setFileConfigs((prev) => prev.filter((c) => c.fileId !== fileId));
  };

  // 다음 단계로
  const handleNextStep = () => {
    if (stepOneValidFiles.length === 0) {
      toast({
        title: '업로드할 파일이 없어요',
        description: '업로드 가능한 파일을 추가해 주세요.',
        duration: 3000,
      });
      return;
    }
    trackEvent(MixpanelEvent.MultiSessionStepChange, {
      from: 'upload',
      to: 'config',
      file_count: stepOneValidFiles.length,
    });
    // Step 2로 이동 시 개별 설정 초기화
    setFileConfigs(
      stepOneValidFiles.map((file, index) => ({
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
    trackEvent(MixpanelEvent.MultiSessionStepChange, {
      from: 'config',
      to: 'upload',
    });
    setStep('upload');
  };

  // 세션 생성
  const handleCreateSessions = async () => {
    if (!userId) {
      toast({
        title: '문제가 생겼어요',
        description: '로그인 정보를 불러오는 중이에요.',
        duration: 3000,
      });
      return;
    }

    if (tutorial && isTutorialFakeUpload) {
      if (fileConfigs.length === 0) {
        toast({
          title: '업로드할 파일이 없어요',
          description: '파일을 하나 추가한 뒤 상담 기록을 만들어 주세요.',
          duration: 3000,
        });
        return;
      }

      const initialResults: SessionCreateResult[] = fileConfigs.map(
        (config) => {
          const file = configValidFiles.find(
            (item) => item.id === config.fileId
          );
          return {
            fileId: config.fileId,
            fileName: file?.name ?? '',
            status: 'pending',
          };
        }
      );

      setTutorialFakeResults(initialResults);
      setIsTutorialFakeCreating(true);

      try {
        for (const config of fileConfigs) {
          const file = configValidFiles.find(
            (item) => item.id === config.fileId
          );
          if (!file) continue;

          setTutorialFakeResults((previous) =>
            previous.map((result) =>
              result.fileId === config.fileId
                ? { ...result, status: 'uploading', uploadProgress: 0 }
                : result
            )
          );

          for (let progress = 10; progress <= 100; progress += 10) {
            await new Promise<void>((resolve) =>
              window.setTimeout(resolve, TUTORIAL_FAKE_UPLOAD_TICK_MS)
            );
            setTutorialFakeResults((previous) =>
              previous.map((result) =>
                result.fileId === config.fileId
                  ? { ...result, uploadProgress: progress }
                  : result
              )
            );
          }

          setTutorialFakeResults((previous) =>
            previous.map((result) =>
              result.fileId === config.fileId
                ? { ...result, status: 'creating' }
                : result
            )
          );

          await new Promise<void>((resolve) =>
            window.setTimeout(
              resolve,
              Math.max(
                0,
                DIRECT_UPLOAD_MIN_SECONDS * 1000 -
                  TUTORIAL_FAKE_UPLOAD_TRANSFER_MS
              )
            )
          );

          setTutorialFakeResults((previous) =>
            previous.map((result) =>
              result.fileId === config.fileId
                ? { ...result, status: 'success', uploadProgress: 100 }
                : result
            )
          );
        }

        await tutorial.onComplete();
      } finally {
        setIsTutorialFakeCreating(false);
      }
      return;
    }

    const finalResults = await createSessions(
      fileConfigs,
      effectiveValidFiles,
      async () => {
        if (!isTutorialMode) {
          const guard = await checkCredit(step2TotalCredit);
          if (!guard.ok && !guard.unavailable) {
            setCreditErrorSnackBar({
              open: true,
              message: `STT 세션 시작에 ${step2TotalCredit} 크레딧이 필요해요. (보유: ${guard.remaining})`,
            });
            return false;
          }
        }

        trackEvent(MixpanelEvent.MultiSessionCreateAttempt, {
          file_count: fileConfigs.length,
          total_credit: step2TotalCredit,
        });
        return true;
      }
    );
    if (!finalResults) return;

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
            : `${successCount}개의 상담 기록이 생성 중이에요.`,
        duration: 5000,
      });

      if (tutorial) {
        await tutorial.onComplete();
        return;
      } else if (currentLevel === 4) {
        // 레거시 가이드(레벨 4) 진행 중이라면 완료 처리
        await completeNextStep(useAuthStore.getState().user?.email || '');
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
          description:
            '파일을 업로드하지 못했어요. 잠시 후 다시 시도해 주세요.',
          duration: 5000,
        });
      }
    }

    // 크레딧 잔액 갱신
    const userIdNum = Number(userId);
    if (!isNaN(userIdNum)) {
      queryClient.invalidateQueries({
        queryKey: creditQueryKeys.summary(userIdNum),
      });
    }

    handleClose(false);
  };

  // Step 2에서 사용할 validFiles (config에 있는 것만)
  const configValidFiles = useMemo(() => {
    return stepOneValidFiles.filter((f) =>
      fileConfigs.some((c) => c.fileId === f.id)
    );
  }, [fileConfigs, stepOneValidFiles]);

  const displayFiles = hasTutorialLocalFiles
    ? effectiveFiles
    : (tutorial?.files ?? effectiveFiles);
  const displayValidFiles = hasTutorialLocalFiles
    ? effectiveValidFiles
    : tutorial
      ? displayFiles.filter((file) => file.validationStatus === 'valid')
      : effectiveValidFiles;
  const displayIsProcessing = hasTutorialLocalFiles
    ? effectiveIsProcessing
    : tutorial
      ? tutorial.directUploadState === 'loading' ||
        tutorial.directUploadState === 'processing'
      : effectiveIsProcessing;
  const displayCanAddMore = hasTutorialLocalFiles
    ? false
    : tutorial
      ? !isTutorialPreparedFile
      : effectiveCanAddMore;
  const tutorialDirectUploadCard =
    tutorial?.isRecordUnavailable && displayFiles.length === 0 ? (
      <div className="mx-auto mt-4 flex w-full max-w-[312px] items-center justify-between gap-3 rounded-xl border border-border bg-surface p-3 text-left">
        <div>
          <p className="typo-xs font-headline text-fg">
            지금 등록할 사례가 없다면,
            <br />
            가상 내담자 상담 녹음 파일로
            <br />
            상담 기록을 만들어보세요.
          </p>
        </div>
        <Button
          tone="primary"
          variant="outline"
          size="sm"
          loading={tutorial.directUploadState === 'loading'}
          onClick={tutorial.onDirectUpload}
        >
          바로 올리기
        </Button>
      </div>
    ) : null;

  const fileDropArea = (
    <SessionUploadFileDropArea
      files={displayFiles}
      isMobile={isMobile}
      isTablet={isTablet}
      isDragging={isDragging}
      canAddMore={displayCanAddMore}
      allowFileSelection={!isTutorialPreparedFile}
      maxFiles={isTutorialMode ? 1 : undefined}
      emptyStateHint={tutorial ? 'MP3, WAV 포맷 (최대 500 MB)' : undefined}
      emptyStateContent={tutorialDirectUploadCard}
      onFilesSelected={addRealFiles}
      onRemoveFile={
        hasTutorialLocalFiles
          ? removeUploadedFile
          : (tutorial?.onRemoveUploadedFile ?? removeUploadedFile)
      }
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={onDrop}
      onFileLimitExceeded={
        isTutorialMode ? handleTutorialFileLimitExceeded : undefined
      }
    />
  );

  // 공통 크레딧 정보 (Step 1)
  const creditInfo1 = !isTutorialMode && displayValidFiles.length > 0 && (
    <div className="flex flex-1 flex-col items-center justify-start text-center text-l font-emphasize text-grey-100 lg:justify-center">
      <p>
        <span className="text-green-80">{displayValidFiles.length}개</span>의
        상담기록 생성으로
      </p>
      <p>
        총 <span className="text-green-80">{step1TotalCredit} 크레딧</span>을
        사용해요.
      </p>
    </div>
  );

  const tutorialSettings = tutorial ? (
    <>
      <div className="flex flex-col justify-start lg:flex-row lg:justify-between">
        <Text className="typo-sm mb-2 text-fg-muted">내담자 선택</Text>
        <ClientSelector
          clients={clients}
          selectedClient={selectedClient ?? null}
          onSelect={handleBatchClientSelect}
          variant="dropdown"
          open={isClientModalOpen}
          onOpenChange={setIsClientModalOpen}
          trigger={
            <button
              type="button"
              className="flex min-w-[140px] items-center gap-2 rounded-md border border-border bg-surface px-3 py-2 text-left text-sm font-medium text-fg lg:min-w-[160px]"
            >
              <UserIcon size={18} />
              <span className="truncate">
                {selectedClient?.name ?? tutorial.clientName}
              </span>
            </button>
          }
        />
      </div>
      <Text className="typo-sm mb-2 mt-2 text-fg-muted">축어록 선택</Text>
      {isMobileView ? (
        <MobileSttModelSelector
          sttModel={batchConfig.sttModel}
          setSttModel={handleBatchSttModelChange}
        />
      ) : (
        <SttModelSelector
          sttModel={batchConfig.sttModel}
          setSttModel={handleBatchSttModelChange}
        />
      )}
    </>
  ) : null;

  // 공통 개별 설정 목록 (Step 2)
  const configList = (
    <div
      className={cn(
        'space-y-2 overflow-y-auto overscroll-contain',
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
            result={effectiveResults.find((r) => r.fileId === config.fileId)}
            onConfigChange={handleConfigChange}
            onRemove={handleRemoveFromConfig}
            isMobileView={isMobileView}
            isUploading={effectiveIsCreating}
          />
        );
      })}
    </div>
  );

  // Step 2 하단 크레딧 + 버튼
  const step2Buttons = (
    <div className="flex flex-col gap-2">
      <div className="flex justify-center">
        {effectiveIsCreating ? (
          <div className="flex items-center gap-1 rounded-lg bg-danger-subtle px-3 py-1">
            <Text className="text-sm font-medium text-danger">
              업로드 중이에요. 페이지를 벗어나지 마세요.
            </Text>
          </div>
        ) : !isTutorialMode ? (
          <div className="flex items-center gap-1 rounded-lg bg-primary-subtle px-3 py-1">
            <Text className="font-headline text-primary">
              {step2TotalCredit}
            </Text>
            <CreditIcon size={14} />
            <Text className="text-primary">사용</Text>
          </div>
        ) : null}
      </div>
      <div className="flex gap-2">
        <Button
          variant="outline"
          tone="neutral"
          size="lg"
          onClick={handlePrevStep}
          disabled={effectiveIsCreating}
        >
          이전
        </Button>
        <Button
          variant="solid"
          tone="primary"
          size="lg"
          onClick={handleCreateSessions}
          disabled={fileConfigs.length === 0 || effectiveIsCreating}
          className={isMobileView ? 'flex-1' : 'w-[335px] flex-1'}
        >
          {effectiveIsCreating ? '업로드 중...' : '상담 기록 만들기'}
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
      closeOnOverlay={!effectiveIsCreating && !isClientModalOpen}
      mobileVariant={isMobileView ? 'fullScreen' : 'center'}
      hideCloseButton={isMobileView}
    >
      {/* 헤더 */}
      {isMobileView ? (
        <MobileModalHeader
          title="녹음 파일 업로드하기"
          onBack={() => handleClose(false)}
        />
      ) : (
        <div className="shrink-0 pt-4 text-center">
          <Title as="h3" className="font-headline">
            녹음 파일로 상담 기록 추가하기
          </Title>
        </div>
      )}

      {/* 콘텐츠 */}
      {isMobileView ? (
        /* 모바일/태블릿 레이아웃 */
        step === 'upload' ? (
          <div className="flex flex-1 flex-col overflow-y-auto overscroll-contain">
            <SessionUploadAiGuardNotice className="mx-4 mt-4 shrink-0 md:mx-12" />
            {fileDropArea}

            {/* 일괄 설정 */}
            <div className="p-6 md:p-12">
              <p className="mb-6 text-l font-emphasize text-grey-100">
                일괄 설정
              </p>

              {tutorial ? (
                tutorialSettings
              ) : (
                <>
                  <div className="flex items-center justify-between py-2">
                    <p className="text-l font-medium text-grey-100">
                      내담자 선택
                    </p>
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
                        clients.find((c) => c.id === batchConfig.clientId) ||
                        null
                      }
                      onSelect={handleBatchClientSelect}
                      variant="modal"
                      open={isClientModalOpen}
                      onOpenChange={setIsClientModalOpen}
                    />
                  </div>
                  <div className="flex items-center justify-between py-2">
                    <p className="text-l font-medium text-grey-100">
                      축어록 종류
                    </p>
                    <MobileSttModelSelector
                      sttModel={batchConfig.sttModel}
                      setSttModel={handleBatchSttModelChange}
                    />
                  </div>
                </>
              )}
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
        <div className="flex flex-1 flex-col items-stretch justify-center gap-6 px-12 py-8 md:flex-row">
          {/* 왼쪽: 파일 목록 */}
          <div className="flex h-full w-full max-w-[488px] flex-1 flex-col gap-4">
            <SessionUploadAiGuardNotice className="shrink-0" />
            {fileDropArea}
            {!tutorial && (
              <Text className="typo-sm mt-2 text-center text-fg-muted">
                파일 개수{' '}
                <span className="font-medium text-primary">
                  {displayFiles.length}
                </span>{' '}
                / {MULTI_UPLOAD_LIMITS.MAX_FILES}
              </Text>
            )}
          </div>

          {/* 오른쪽: 일괄 설정 */}
          <div className="flex h-full w-full max-w-fit flex-col gap-y-6">
            <div>
              <Text className="my-2 font-emphasize text-fg">일괄 설정</Text>
              {tutorial ? (
                tutorialSettings
              ) : (
                <>
                  <div className="flex flex-col justify-start lg:flex-row lg:justify-between">
                    <Text className="typo-sm mb-2 text-fg-muted">
                      내담자 선택
                    </Text>
                    <ClientSelector
                      clients={clients}
                      selectedClient={
                        clients.find((c) => c.id === batchConfig.clientId) ||
                        null
                      }
                      onSelect={handleBatchClientSelect}
                      variant="default"
                    />
                  </div>
                  <Text className="typo-sm mb-2 text-fg-muted">
                    축어록 선택
                  </Text>
                  <SttModelSelector
                    sttModel={batchConfig.sttModel}
                    setSttModel={handleBatchSttModelChange}
                  />
                </>
              )}
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
        className={cn(
          isMobileView ? 'px-4 pb-4' : 'flex justify-center gap-3',
          tutorial && 'flex-col items-center'
        )}
      >
        {tutorial && (
          <Text className="typo-xs mb-3 text-center text-fg-muted">
            튜토리얼에서는 크레딧이 소모되지 않아요.
          </Text>
        )}
        {step === 'upload' ? (
          <Button
            variant="solid"
            tone="primary"
            size="lg"
            onClick={handleNextStep}
            disabled={displayValidFiles.length === 0 || displayIsProcessing}
            className={isMobileView ? 'w-full' : 'w-full max-w-[375px]'}
          >
            {displayIsProcessing ? '파일 업로드 중...' : '다음'}
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
          label: '플랜 변경',
          onClick: () => openModal('planChange'),
        }}
        duration={8000}
      />
    </Modal>
  );
};

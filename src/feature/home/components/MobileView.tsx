import React, { useCallback, useMemo, useState } from 'react';

import { createSearchParams, Link, useSearchParams } from 'react-router-dom';

import { Button, Title } from '@/components/ui';
import { Badge } from '@/components/ui/atoms/Badge';
import { Text } from '@/components/ui/atoms/Text';
import { SnackBar } from '@/components/ui/composites/SnackBar';
import { useToast } from '@/components/ui/composites/Toast';
import { ClientSelector } from '@/feature/client/components/ClientSelector';
import { useClientList } from '@/feature/client/hooks/useClientList';
import type { Client } from '@/feature/client/types';
import { SessionRecordCard } from '@/feature/session/components/SessionRecordCard';
import {
  getAcceptString,
  MULTI_UPLOAD_LIMITS,
} from '@/feature/session/constants/fileUpload';
import { useMultiFileUpload } from '@/feature/session/hooks/useMultiFileUpload';
import { useMultiSessionCreate } from '@/feature/session/hooks/useMultiSessionCreate';
import type {
  BatchSessionConfig,
  FileSessionConfig,
  SttModel,
} from '@/feature/session/types';
import { calculateTotalCredit } from '@/feature/session/utils/creditCalculator';
import { CreditDisplay } from '@/feature/settings/components/CreditDisplay';
import { useCreditInfo } from '@/feature/settings/hooks/useCreditInfo';
import {
  calculateDaysUntilReset,
  getPlanLabel,
} from '@/feature/settings/utils/planUtils';
import { trackEvent } from '@/lib/mixpanel';
import { ROUTES, TERMS_TYPES } from '@/router/constants';
import { useNavigateWithUtm } from '@/shared/hooks/useNavigateWithUtm';
import {
  ChevronLeftIcon,
  UserIcon,
  UploadIcon,
  HelpCircleIcon,
  TextAlignJustifyIcon,
  PlusIcon,
  XIcon,
  ChevronRightIcon,
} from '@/shared/icons';
import { formatKoreanDate } from '@/shared/utils/date';
import { useAuthStore } from '@/stores/authStore';
import { useModalStore } from '@/stores/modalStore';

import { useSessionRecords } from '../hooks/useMobileSession';

import { GreetingSection } from './GreetingSection';
import { MobileFileConfigItem } from './MobileFileConfigItem';
import { MobileFileItem } from './MobileFileItem';
import { MobileSttModelSelector } from './MobileSttModelSelector';

type MobileViewDepth = 'home' | 'upload' | 'config' | 'setting';

const MobileView = () => {
  const { toast } = useToast();
  const { navigateWithUtm, setSearchParamsWithUtm } = useNavigateWithUtm();
  const [searchParams] = useSearchParams();
  const userId = useAuthStore((state) => state.userId);
  const userName = useAuthStore((state) => state.userName);
  const defaultTemplateId = useAuthStore((state) => state.defaultTemplateId);
  const { clients } = useClientList();

  // Depth 상태 (URL query string으로 관리)
  const depthParam = searchParams.get('depth');
  const depth: MobileViewDepth =
    depthParam === 'upload' ||
    depthParam === 'config' ||
    depthParam === 'setting'
      ? depthParam
      : 'home';

  // depth 변경 함수 (URL 업데이트, UTM 파라미터 자동 유지)
  const setDepth = useCallback(
    (newDepth: MobileViewDepth) => {
      setSearchParamsWithUtm((prev) => {
        if (newDepth === 'home') {
          prev.delete('depth');
        } else {
          prev.set('depth', newDepth);
        }
        return prev;
      });
    },
    [setSearchParamsWithUtm]
  );

  // 크레딧 정보
  const { creditInfo } = useCreditInfo();

  // 크레딧 부족 에러 상태
  const [creditErrorSnackBar, setCreditErrorSnackBar] = useState({
    open: false,
    message: '',
  });
  const openModal = useModalStore((state) => state.openModal);

  // iOS 파일 위치 안내 모달
  const [isIosGuideModalOpen, setIsIosGuideModalOpen] = useState(false);
  const IOS_GUIDE_DISMISSED_KEY = 'ios_file_guide_dismissed';

  // 상담 기록 (커스텀 훅)
  const {
    sessionRecords,
    isLoading: isLoadingSessions,
    isDummyFlow,
    hasMoreSessions,
    handleLoadMore,
  } = useSessionRecords({ userId });

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

  // 일괄 설정
  const [batchConfig, setBatchConfig] = useState<BatchSessionConfig>({
    sttModel: 'gemini-3',
    clientId: undefined,
  });

  // 내담자 선택 모달
  const [isClientModalOpen, setIsClientModalOpen] = useState(false);

  // 개별 설정
  const [fileConfigs, setFileConfigs] = useState<FileSessionConfig[]>([]);

  // 세션 생성
  const { createSessions, results, isCreating } = useMultiSessionCreate({
    userId: userId ? parseInt(userId) : 0,
    templateId: defaultTemplateId || 1,
  });

  const fileInputRef = React.useRef<HTMLInputElement>(null);

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

  // 파일 선택 핸들러
  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputFiles = e.target.files;
    if (inputFiles) {
      addFiles(Array.from(inputFiles));
    }
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

  // 다음 단계로 (upload -> config)
  const handleNextStep = () => {
    if (validFiles.length === 0) {
      toast({
        title: '유효한 파일이 없습니다',
        description: '업로드 가능한 파일을 추가해주세요.',
        duration: 3000,
      });
      return;
    }
    setFileConfigs(
      validFiles.map((file, index) => ({
        fileId: file.id,
        order: index + 1,
        sttModel: batchConfig.sttModel,
        clientId: batchConfig.clientId,
      }))
    );
    setDepth('config');
  };

  // 이전 단계로 (브라우저 뒤로가기 사용)
  const handlePrevStep = () => {
    if (depth === 'upload') {
      // 업로드 화면에서 홈으로 돌아갈 때 상태 초기화
      clearFiles();
      setBatchConfig({ sttModel: 'gemini-3', clientId: undefined });
      setFileConfigs([]);
    }
    navigateWithUtm(-1);
  };

  // 로그아웃
  const logout = useAuthStore((state) => state.logout);
  const handleLogout = async () => {
    try {
      trackEvent('logout');
      await logout();
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const handleGuideClick = () => {
    window.open(
      'https://rare-puppy-06f.notion.site/2e3dd162832d80b29719d18eafac2612?source=copy_link',
      '_blank',
      'noopener,noreferrer'
    );
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

    // 크레딧 검증
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

    // 완료 후 홈으로
    clearFiles();
    setBatchConfig({ sttModel: 'gemini-3', clientId: undefined });
    setFileConfigs([]);
    setDepth('home');
  };

  // Step 2에서 사용할 validFiles
  const configValidFiles = useMemo(() => {
    return validFiles.filter((f) => fileConfigs.some((c) => c.fileId === f.id));
  }, [validFiles, fileConfigs]);

  // iOS 감지
  const isIOS = useMemo(() => {
    return (
      /iPad|iPhone|iPod/.test(navigator.userAgent) ||
      (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
    );
  }, []);

  // 업로드 버튼 클릭
  const handleUploadClick = useCallback(() => {
    // iOS이고 "다시 보지 않기"를 선택하지 않은 경우 안내 모달 표시
    if (isIOS && !localStorage.getItem(IOS_GUIDE_DISMISSED_KEY)) {
      setIsIosGuideModalOpen(true);
    } else {
      setDepth('upload');
    }
  }, [setDepth, isIOS]);

  // iOS 안내 모달 확인
  const handleIosGuideConfirm = () => {
    setIsIosGuideModalOpen(false);
    setDepth('upload');
  };

  // iOS 안내 모달 "다시 보지 않기"
  const handleIosGuideDismiss = () => {
    localStorage.setItem(IOS_GUIDE_DISMISSED_KEY, 'true');
    setIsIosGuideModalOpen(false);
    setDepth('upload');
  };

  const termsToService = {
    pathname: ROUTES.TERMS,
    search: `?${createSearchParams({ type: TERMS_TYPES.SERVICE })}`,
  };

  const termsToPrivacy = {
    pathname: ROUTES.TERMS,
    search: `?${createSearchParams({ type: TERMS_TYPES.PRIVACY })}`,
  };

  // 설정 화면
  if (depth === 'setting') {
    return (
      <div className="flex h-full flex-col px-6 pt-8">
        {/* 닫기 버튼 */}
        <button
          onClick={handlePrevStep}
          className="absolute right-5 top-7 flex h-11 w-11 items-center justify-center rounded-lg border border-surface-strong bg-surface text-fg-muted"
        >
          <XIcon size={20} />
        </button>

        {/* 나의 크레딧 */}
        <div className="mt-12">
          <Title as="h2" className="mb-4 text-lg font-semibold">
            나의 크레딧
          </Title>
          {creditInfo && (
            <CreditDisplay
              totalCredit={creditInfo.plan.total}
              usedCredit={creditInfo.plan.used}
              planLabel={getPlanLabel(creditInfo.plan.type)}
              planType={creditInfo.plan.type}
              daysUntilReset={calculateDaysUntilReset(
                creditInfo.subscription.reset_at
              )}
              variant="mobile"
            />
          )}
        </div>

        {/* 구분선 */}
        <div className="my-8 border-t border-surface-strong" />

        {/* 메뉴 목록 */}
        <div className="flex flex-col">
          <Link
            to={termsToService}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between py-4"
          >
            <Text className="text-base text-fg">서비스 이용약관</Text>
            <ChevronRightIcon size={20} className="text-fg-muted" />
          </Link>
          <Link
            to={termsToPrivacy}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between py-4"
          >
            <Text className="text-base text-fg">개인정보 처리방침</Text>
            <ChevronRightIcon size={20} className="text-fg-muted" />
          </Link>
          <button onClick={handleLogout} className="py-4 text-left">
            <Text className="text-base text-fg-muted">로그아웃</Text>
          </button>
        </div>
      </div>
    );
  }

  // 홈 화면
  if (depth === 'home') {
    return (
      <div className="flex h-full flex-col overflow-y-auto px-6">
        <button
          onClick={() => setDepth('setting')}
          className="fixed right-5 top-7 z-10 flex h-11 w-11 items-center justify-center rounded-lg border border-surface-strong bg-surface text-fg-muted"
        >
          <TextAlignJustifyIcon />
        </button>
        <GreetingSection userName={userName!} date={formatKoreanDate()} />

        <div className="flex flex-col gap-4">
          <button
            className="flex h-[160px] w-full flex-col items-start justify-center gap-4 rounded-lg border border-surface-strong bg-surface px-8 text-xl font-bold"
            onClick={handleUploadClick}
          >
            <div className="flex h-11 w-11 items-center justify-center rounded-lg border">
              <UploadIcon size={24} className="text-primary-400" />
            </div>
            녹음 파일 업로드하기
          </button>
          <button
            className="flex h-[160px] w-full flex-col items-start justify-center gap-4 rounded-lg border border-surface-strong bg-surface px-8 text-xl font-bold"
            onClick={handleGuideClick}
          >
            <div className="flex h-11 w-11 items-center justify-center rounded-lg border">
              <HelpCircleIcon size={24} className="text-secondary" />
            </div>
            모바일 업로드 가이드
          </button>
          {creditInfo && (
            <CreditDisplay
              totalCredit={creditInfo.plan.total}
              usedCredit={creditInfo.plan.used}
              planLabel={getPlanLabel(creditInfo.plan.type)}
              planType={creditInfo.plan.type}
              daysUntilReset={calculateDaysUntilReset(
                creditInfo.subscription.reset_at
              )}
              variant="mobile"
            />
          )}
        </div>

        <div className="mx-3 my-10 rounded-md border border-surface-strong" />

        {/* 상담 기록 섹션 */}
        <div className="flex-1">
          <div className="mb-4 flex items-center gap-2">
            <Title as="h2" className="text-lg font-semibold">
              상담기록
            </Title>
            {isDummyFlow && (
              <Badge tone="warning" variant="soft" size="sm">
                예시
              </Badge>
            )}
          </div>

          <div className="space-y-3 pb-6">
            {isLoadingSessions ? (
              <div className="rounded-lg border border-surface-strong bg-surface p-6 text-center">
                <Text className="text-fg-muted">상담기록을 불러오는 중...</Text>
              </div>
            ) : sessionRecords.length > 0 ? (
              <>
                {sessionRecords.map((record) => (
                  <SessionRecordCard
                    key={record.session_id}
                    record={record}
                    isReadOnly={isDummyFlow}
                    isMobile={true}
                  />
                ))}

                {/* 더보기 버튼 */}
                {hasMoreSessions && (
                  <button
                    onClick={handleLoadMore}
                    className="flex w-full items-center justify-center gap-2 rounded-lg border-2 border-surface-strong bg-surface py-4 text-fg-muted transition-colors hover:bg-surface-contrast"
                  >
                    <PlusIcon size={20} />
                    더보기
                  </button>
                )}
              </>
            ) : (
              <div className="rounded-lg border border-surface-strong bg-surface p-6 text-center">
                <Text className="text-fg-muted">
                  아직 상담 기록이 없습니다.
                </Text>
              </div>
            )}
          </div>
        </div>

        {/* iOS 파일 위치 안내 모달 */}
        {isIosGuideModalOpen && (
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="ios-guide-title"
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-6"
          >
            <div className="w-full max-w-sm rounded-2xl bg-white px-6 py-8 text-center">
              <Title
                as="h2"
                id="ios-guide-title"
                className="mb-6 text-xl font-bold"
              >
                파일 위치 안내
              </Title>
              <Text className="mb-8 text-base leading-relaxed text-fg">
                아이폰 녹음 앱으로 녹음한 파일은
                <br />
                &apos;나의 iPhone&apos; 혹은 &apos;iCloud Drive&apos;안에
                <br />
                저장되어 있어야 업로드가 가능합니다.
              </Text>
              <div className="flex gap-3">
                <button
                  onClick={handleIosGuideDismiss}
                  className="flex-1 py-3 text-base text-fg-muted"
                >
                  다시 보지 않기
                </button>
                <Button
                  variant="solid"
                  tone="primary"
                  size="lg"
                  className="flex-1"
                  onClick={handleIosGuideConfirm}
                >
                  확인
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // 파일 업로드 화면 (Step 1)
  if (depth === 'upload') {
    return (
      <div className="flex h-full flex-col">
        {/* 헤더 */}
        <div className="flex items-center gap-3 border-b border-border px-4 py-3">
          <button onClick={handlePrevStep} className="p-1">
            <ChevronLeftIcon size={24} />
          </button>
          <Title as="h2" className="text-lg font-semibold">
            녹음 파일 업로드
          </Title>
        </div>

        {/* 파일 목록 */}
        <div
          className={`flex-1 select-none overflow-y-auto bg-surface-contrast p-4 ${
            files.length === 0 ? 'flex items-center justify-center' : ''
          }`}
        >
          <input
            id="audioInput"
            ref={fileInputRef}
            type="file"
            accept={getAcceptString('audio')}
            multiple
            onChange={handleFileInputChange}
            className="sr-only hidden"
          />

          {files.length === 0 ? (
            <button
              onClick={handleButtonClick}
              className="flex flex-col items-center justify-center gap-3 text-fg-muted"
            >
              <div className="flex flex-col items-center justify-center gap-3 rounded-xl border p-6">
                <UploadIcon size={32} />
                <Text>파일을 선택해주세요</Text>
                <Text className="text-sm text-fg-muted">
                  최대 {MULTI_UPLOAD_LIMITS.MAX_FILES}개
                  <br />
                  파일당 최대 500MB
                </Text>
              </div>
            </button>
          ) : (
            <div className="flex w-full flex-col gap-y-3 overflow-hidden">
              {files.map((file) => (
                <MobileFileItem
                  key={file.id}
                  file={file}
                  onRemove={removeFile}
                />
              ))}

              {canAddMore && (
                <button
                  onClick={handleButtonClick}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-surface py-6 text-fg-muted"
                >
                  <PlusIcon size={20} />
                </button>
              )}
            </div>
          )}
        </div>

        {/* 일괄 설정 */}
        <div className="flex flex-1 flex-col bg-surface px-4 py-4">
          <div>
            <Text className="mb-3 font-semibold text-fg">일괄 설정</Text>

            <div className="mb-4 flex items-center justify-between">
              <Text className="text-sm text-fg-muted">내담자 선택</Text>
              <Button
                variant="outline"
                size="sm"
                className="flex items-center gap-2"
                onClick={() => setIsClientModalOpen(true)}
              >
                <UserIcon size={14} />
                <Text className="text-sm">
                  {clients.find((c) => c.id === batchConfig.clientId)?.name ||
                    '클라이언트 선택 안됨'}
                </Text>
              </Button>
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

            <div className="flex items-center justify-between">
              <Text className="text-sm text-fg-muted">축어록 종류</Text>
              <MobileSttModelSelector
                sttModel={batchConfig.sttModel}
                setSttModel={handleBatchSttModelChange}
              />
            </div>
          </div>

          {validFiles.length > 0 && (
            <div className="flex flex-1 flex-col justify-center pb-16 text-center">
              <Text className="font-semibold">
                <span className="text-primary">{validFiles.length}개</span>의
                상담기록 생성으로
              </Text>
              <Text className="font-semibold">
                총{' '}
                <span className="text-primary">{step1TotalCredit} 크레딧</span>
                을 사용합니다.
              </Text>
            </div>
          )}
        </div>

        {/* 하단 버튼 */}
        <div className="fixed bottom-3 w-full px-4">
          <Button
            variant="solid"
            tone="primary"
            size="lg"
            className="w-full"
            onClick={handleNextStep}
            disabled={validFiles.length === 0 || isProcessing}
          >
            {isProcessing ? '파일 처리 중...' : '다음'}
          </Button>
        </div>
      </div>
    );
  }

  // 상세 설정 화면 (Step 2)
  return (
    <div className="flex h-full flex-col">
      {/* 헤더 */}
      <div className="flex items-center gap-3 border-b border-border bg-surface px-4 py-3">
        <button onClick={handlePrevStep} disabled={isCreating} className="p-1">
          <ChevronLeftIcon size={24} />
        </button>
        <Title as="h2" className="text-lg font-semibold">
          녹음 파일 업로드
        </Title>
      </div>

      {/* 파일 설정 목록 */}
      <div className="flex-1 overflow-y-auto bg-surface p-4">
        <Text className="mb-3 text-sm text-fg-muted">상담기록 세부 설정</Text>

        <div className="mb-16 space-y-3">
          {fileConfigs.map((config, index) => {
            const file = configValidFiles.find((f) => f.id === config.fileId);
            if (!file) return null;
            return (
              <MobileFileConfigItem
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
      </div>

      {/* 하단 영역 */}
      <div className="fixed bottom-3 w-full bg-transparent px-4">
        {/* 크레딧 표시 */}
        <div className="mb-3 flex justify-center">
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
              <g clipPath="url(#clip0_credit_mobile)">
                <path
                  d="M7 14C10.866 14 14 10.866 14 7C14 3.134 10.866 0 7 0C3.134 0 0 3.134 0 7C0.00418359 10.8643 3.13573 13.9958 7 14ZM4.1125 4.1125C5.70836 2.52055 8.29164 2.52055 9.8875 4.1125C10.1113 4.34424 10.1049 4.71352 9.87317 4.93732C9.64712 5.15566 9.28873 5.15566 9.06268 4.93732C7.92351 3.79846 6.07677 3.79868 4.9379 4.93787C3.79903 6.07707 3.79925 7.92378 4.93845 9.06265C6.07742 10.2013 7.92373 10.2013 9.0627 9.06265C9.29444 8.83884 9.66372 8.84527 9.88753 9.07701C10.1058 9.30306 10.1058 9.66142 9.88753 9.8875C8.29281 11.4822 5.70724 11.4822 4.11253 9.8875C2.51779 8.29279 2.51779 5.70721 4.1125 4.1125Z"
                  fill="currentColor"
                />
              </g>
              <defs>
                <clipPath id="clip0_credit_mobile">
                  <rect width="14" height="14" fill="white" />
                </clipPath>
              </defs>
            </svg>
            <Text className="text-primary-600">사용</Text>
          </div>
        </div>

        <Button
          variant="solid"
          tone="primary"
          size="lg"
          className="w-full"
          onClick={handleCreateSessions}
          disabled={fileConfigs.length === 0 || isCreating}
        >
          {isCreating ? '업로드 중...' : '상담 기록 만들기'}
        </Button>
      </div>

      {/* 크레딧 부족 스낵바 */}
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
    </div>
  );
};

export default MobileView;

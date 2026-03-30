import React, { useCallback, useState } from 'react';

import { useQueryClient } from '@tanstack/react-query';

import { useClientList } from '@/features/client/hooks/useClientList';
import type { Client } from '@/features/client/types';
import { useCreditInfo } from '@/features/settings/hooks/useCreditInfo';
import { trackError, trackEvent } from '@/lib/mixpanel';
import { createHandWrittenSession } from '@/shared/api/supabase/sessionQueries';
import {
  MixpanelError,
  MixpanelEvent,
} from '@/shared/constants/mixpanelEvents';
import { sessionQueryKeys } from '@/shared/constants/queryKeys';
import { useDevice } from '@/shared/hooks/useDevice';
import { CreditIcon, UserIcon } from '@/shared/icons';
import { Title } from '@/shared/ui';
import { BackButton } from '@/shared/ui/atoms/BackButton';
import { Button } from '@/shared/ui/atoms/Button';
import { Text } from '@/shared/ui/atoms/Text';
import { Modal } from '@/shared/ui/composites/Modal';
import { SnackBar } from '@/shared/ui/composites/SnackBar';
import { useToast } from '@/shared/ui/composites/Toast';
import { useAuthStore } from '@/stores/authStore';
import { useModalStore } from '@/stores/modalStore';
import { ClientSelector } from '@/widgets/client/ClientSelector';

interface CreateHandWrittenSessionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const HAND_WRITTEN_CREDIT = 30;
const MIN_CONTENT_LENGTH = 100;
const MAX_CONTENT_LENGTH = 50000;

export const CreateHandWrittenSessionModal: React.FC<
  CreateHandWrittenSessionModalProps
> = ({ open, onOpenChange }) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { isMobile, isTablet } = useDevice();
  const isMobileView = isMobile || isTablet;
  const userId = useAuthStore((state) => state.userId);
  const defaultTemplateId = useAuthStore((state) => state.defaultTemplateId);
  const { clients } = useClientList();
  const { creditInfo, refetch: refetchCredit } = useCreditInfo();

  // 폼 상태
  const [contents, setContents] = useState('');
  const [title, setTitle] = useState('');
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showTitleError, setShowTitleError] = useState(false);
  const [shakeTitle, setShakeTitle] = useState(false);

  // 모바일 클라이언트 선택 모달
  const [isClientModalOpen, setIsClientModalOpen] = useState(false);

  // 크레딧 부족 에러 상태
  const [creditErrorSnackBar, setCreditErrorSnackBar] = useState({
    open: false,
    message: '',
  });
  const openModal = useModalStore((state) => state.openModal);

  // 모달 닫기 핸들러
  const handleClose = useCallback(
    (isOpen: boolean) => {
      if (!isOpen && !isSubmitting) {
        trackEvent(MixpanelEvent.HandWrittenSessionCreateModalClose);
        setContents('');
        setTitle('');
        setSelectedClient(null);
        setShowTitleError(false);
      }
      onOpenChange(isOpen);
    },
    [isSubmitting, onOpenChange]
  );

  // 모달 오픈 트래킹
  React.useEffect(() => {
    if (open) {
      trackEvent(MixpanelEvent.HandWrittenSessionCreateModalOpen);
    }
  }, [open]);

  // 내담자 선택 핸들러
  const handleClientSelect = (client: Client | null) => {
    setSelectedClient(client);
    // 내담자 선택 시 기본 제목 설정
    if (client && !title) {
      const sessionCount = (client.session_count ?? client.counsel_number) + 1;
      setTitle(`${client.name} ${sessionCount}회기`);
    }
  };

  // 제출 핸들러
  const handleSubmit = async () => {
    if (!userId) {
      toast({
        title: '오류',
        description: '로그인 정보를 불러오는 중입니다.',
        duration: 3000,
      });
      return;
    }

    if (!contents.trim()) {
      toast({
        title: '입력 오류',
        description: '상담 내용을 입력해주세요.',
        duration: 3000,
      });
      return;
    }

    if (contents.trim().length < MIN_CONTENT_LENGTH) {
      toast({
        title: '입력 오류',
        description: `상담 내용은 최소 ${MIN_CONTENT_LENGTH}자 이상 입력해주세요.`,
        duration: 3000,
      });
      return;
    }

    if (!title.trim()) {
      setShowTitleError(true);
      setShakeTitle(true);
      setTimeout(() => setShakeTitle(false), 500);
      return;
    }

    // 프론트 크레딧 검증
    const remainingCredit = creditInfo?.plan.remaining ?? 0;
    if (HAND_WRITTEN_CREDIT > remainingCredit) {
      setCreditErrorSnackBar({
        open: true,
        message: `크레딧이 부족합니다. 필요: ${HAND_WRITTEN_CREDIT}, 보유: ${remainingCredit}`,
      });
      return;
    }

    setIsSubmitting(true);
    trackEvent(MixpanelEvent.HandWrittenSessionCreateAttempt, {
      has_client: !!selectedClient,
      content_length: contents.length,
    });

    try {
      const response = await createHandWrittenSession({
        user_id: parseInt(userId),
        client_id: selectedClient?.id,
        title: title.trim(),
        counsel_date: new Date().toISOString().split('T')[0],
        contents: contents.trim(),
        template_id: defaultTemplateId || 1,
      });

      trackEvent(MixpanelEvent.HandWrittenSessionCreateSuccess, {
        session_id: response.session_id,
        has_client: !!selectedClient,
        content_length: contents.length,
      });

      toast({
        title: '상담 기록 생성 요청 완료',
        description: '상담노트가 생성 중입니다. 잠시 후 확인해주세요.',
        duration: 5000,
      });

      // 세션 목록 쿼리 invalidate (폴링 시작)
      queryClient.invalidateQueries({
        queryKey: sessionQueryKeys.all(parseInt(userId)),
      });

      // 크레딧 정보 갱신
      refetchCredit();

      handleClose(false);
    } catch (error: unknown) {
      const err = error as { message?: string; status?: number };

      trackError(
        MixpanelError.HandWrittenSessionCreateError,
        new Error(err.message),
        {
          content_length: contents.length,
          has_client: !!selectedClient,
        }
      );

      toast({
        title: '상담 기록 생성 실패',
        description: err.message || '다시 시도해주세요.',
        duration: 5000,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const contentLength = contents.length;
  const isUnderLimit = contentLength < MIN_CONTENT_LENGTH;
  const isOverLimit = contentLength > MAX_CONTENT_LENGTH;
  const isTitleEmpty = !title.trim();
  const canSubmit =
    contents.trim().length >= MIN_CONTENT_LENGTH &&
    !isOverLimit &&
    !isSubmitting;

  // 공통 요소
  const textAreaHeight = isMobile
    ? 'h-[34vh] min-h-[200px]'
    : isTablet
      ? 'h-[41.6vh] min-h-[200px]'
      : 'h-full min-h-[300px]';

  const textArea = (
    <div className="flex flex-1 flex-col">
      <textarea
        value={contents}
        onChange={(e) => setContents(e.target.value)}
        placeholder="상담 내용을 입력해주세요."
        className={`w-full resize-none rounded-lg border bg-grey-10 p-4 text-grey-100 outline-none transition-colors ${textAreaHeight} ${
          isOverLimit
            ? 'border-red-80 focus:border-red-80'
            : 'border-grey-40 focus:border-green-80'
        }`}
        disabled={isSubmitting}
      />
      <p
        className={`mt-2 text-center text-sm font-sub ${
          isOverLimit || isUnderLimit ? 'text-red-80' : 'text-grey-100'
        }`}
      >
        글자 수 {contentLength.toLocaleString()} /{' '}
        {MAX_CONTENT_LENGTH.toLocaleString()}자
      </p>
    </div>
  );

  const titleInput = (
    <div className="flex flex-col gap-2">
      <Text className="text-m font-medium text-grey-100 lg:text-l">
        상담 기록 제목
      </Text>
      <input
        type="text"
        value={title}
        onChange={(e) => {
          setTitle(e.target.value);
          if (e.target.value.trim()) {
            setShowTitleError(false);
          }
        }}
        placeholder={
          selectedClient
            ? `${selectedClient.name} ${(selectedClient.session_count ?? selectedClient.counsel_number) + 1}회기`
            : '제목을 입력해주세요'
        }
        className={`w-full rounded-lg border bg-grey-10 px-3 py-2 text-m text-grey-100 outline-none transition-colors ${
          showTitleError && isTitleEmpty
            ? 'border-red-500 focus:border-red-500'
            : 'border-grey-40 focus:border-green-80'
        } ${shakeTitle ? 'animate-shake' : ''}`}
        disabled={isSubmitting}
      />
      {showTitleError && isTitleEmpty && (
        <Text className="typo-xs text-red-500">
          상담기록 제목을 입력해주세요.
        </Text>
      )}
    </div>
  );

  const creditBadge = (
    <div className="flex items-center gap-1 rounded-lg bg-primary-subtle px-3 py-1">
      <span className="text-m font-medium text-green-80">
        {HAND_WRITTEN_CREDIT}
      </span>
      <CreditIcon size={14} />
      <span className="text-m font-medium text-green-80">사용</span>
    </div>
  );

  const submitButton = (
    <Button
      variant="solid"
      tone="primary"
      size="lg"
      onClick={handleSubmit}
      disabled={!canSubmit}
      className={isMobileView ? 'w-full' : 'w-full max-w-[375px]'}
    >
      {isSubmitting ? '파일 업로드 중...' : '상담 기록 만들기'}
    </Button>
  );

  const creditSnackBar = (
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
  );

  return (
    <Modal
      className={
        isMobileView
          ? 'flex flex-col'
          : 'flex h-[730px] max-w-[1056px] flex-col gap-8'
      }
      open={open}
      onOpenChange={handleClose}
      closeOnOverlay={!isSubmitting && !isClientModalOpen}
      mobileVariant={isMobileView ? 'fullScreen' : 'center'}
      hideCloseButton={isMobileView}
    >
      {/* 헤더 */}
      {isMobileView ? (
        <div className="flex h-[67px] items-center gap-3 border-b border-border px-4 py-3">
          <BackButton onClick={() => handleClose(false)} />
          <p className="text-m font-medium text-grey-100">직접 입력하기</p>
        </div>
      ) : (
        <div className="pt-4 text-center">
          <Title as="h3" className="font-headline">
            직접 입력하여 상담 기록 추가하기
          </Title>
        </div>
      )}

      {/* 메인 컨텐츠 */}
      {isMobileView ? (
        <div className="flex flex-1 flex-col overflow-y-auto p-6 md:p-12">
          {textArea}

          {/* 설정 영역 */}
          <div className="mt-6 flex-1">
            <p className="mb-4 text-l font-emphasize text-fg">기록 설정</p>
            {titleInput}

            <div className="mt-4 flex items-center justify-between">
              <p className="text-m font-medium text-grey-100">내담자 선택</p>
              <button
                type="button"
                onClick={() => setIsClientModalOpen(true)}
                className="flex items-center gap-2 rounded-md border border-grey-30 bg-white px-3 py-2 text-fg-muted"
              >
                <UserIcon size={18} />
                <span
                  className={`text-sm font-medium ${selectedClient ? 'text-grey-100' : 'text-grey-60'}`}
                >
                  {selectedClient?.name || '선택 안됨'}
                </span>
              </button>
              <ClientSelector
                clients={clients}
                selectedClient={selectedClient}
                onSelect={handleClientSelect}
                variant="modal"
                open={isClientModalOpen}
                onOpenChange={setIsClientModalOpen}
              />
            </div>
          </div>
        </div>
      ) : (
        <div className="flex flex-1 gap-8 px-8">
          {textArea}

          <div className="flex w-[280px] flex-col gap-6">
            <h4 className="text-l font-emphasize text-grey-100">기록 설정</h4>
            {titleInput}
            <div className="flex flex-col gap-2">
              <p className="text-m font-medium text-grey-100 lg:text-l">
                내담자 선택
              </p>
              <ClientSelector
                clients={clients}
                selectedClient={selectedClient}
                onSelect={handleClientSelect}
                variant="default"
              />
            </div>
          </div>
        </div>
      )}

      {/* 하단 */}
      <div
        className={
          isMobileView
            ? 'flex flex-col items-center gap-2 px-4 pb-4'
            : 'flex flex-col items-center gap-2 pb-4'
        }
      >
        {creditBadge}
        {submitButton}
      </div>

      {creditSnackBar}
    </Modal>
  );
};

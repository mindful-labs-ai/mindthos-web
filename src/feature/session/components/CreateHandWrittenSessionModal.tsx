import React, { useCallback, useState } from 'react';

import { useQueryClient } from '@tanstack/react-query';

import { Title } from '@/components/ui';
import { Button } from '@/components/ui/atoms/Button';
import { Text } from '@/components/ui/atoms/Text';
import { Modal } from '@/components/ui/composites/Modal';
import { SnackBar } from '@/components/ui/composites/SnackBar';
import { useToast } from '@/components/ui/composites/Toast';
import { ClientSelector } from '@/feature/client/components/ClientSelector';
import { useClientList } from '@/feature/client/hooks/useClientList';
import type { Client } from '@/feature/client/types';
import { PlanChangeModal } from '@/feature/settings/components/PlanChangeModal';
import { useCreditInfo } from '@/feature/settings/hooks/useCreditInfo';
import { trackError, trackEvent } from '@/lib/mixpanel';
import { useAuthStore } from '@/stores/authStore';

import { createHandWrittenSession } from '../services/sessionService';

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
  const userId = useAuthStore((state) => state.userId);
  const defaultTemplateId = useAuthStore((state) => state.defaultTemplateId);
  const { clients } = useClientList();
  const { creditInfo, refetch: refetchCredit } = useCreditInfo();

  // 폼 상태
  const [contents, setContents] = useState('');
  const [title, setTitle] = useState('');
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 크레딧 부족 에러 상태
  const [creditErrorSnackBar, setCreditErrorSnackBar] = useState({
    open: false,
    message: '',
  });
  const [isPlanChangeModalOpen, setIsPlanChangeModalOpen] = useState(false);

  // 모달 닫기 핸들러
  const handleClose = useCallback(
    (isOpen: boolean) => {
      if (!isOpen && !isSubmitting) {
        setContents('');
        setTitle('');
        setSelectedClient(null);
      }
      onOpenChange(isOpen);
    },
    [isSubmitting, onOpenChange]
  );

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
      toast({
        title: '입력 오류',
        description: '상담기록 제목을 입력해주세요.',
        duration: 3000,
      });
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

    try {
      const response = await createHandWrittenSession({
        user_id: parseInt(userId),
        client_id: selectedClient?.id,
        title: title.trim(),
        counsel_date: new Date().toISOString().split('T')[0],
        contents: contents.trim(),
        template_id: defaultTemplateId || 1,
      });

      trackEvent('hand_written_session_create_success', {
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
        queryKey: ['sessions', parseInt(userId)],
      });

      // 크레딧 정보 갱신
      refetchCredit();

      handleClose(false);
    } catch (error: unknown) {
      const err = error as { message?: string; status?: number };

      trackError('hand_written_session_create_error', new Error(err.message), {
        content_length: contents.length,
        has_client: !!selectedClient,
      });

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
  const canSubmit =
    contents.trim().length >= MIN_CONTENT_LENGTH &&
    title.trim().length > 0 &&
    !isOverLimit &&
    !isSubmitting;

  return (
    <Modal
      className="flex h-[730px] max-w-[1056px] flex-col gap-8"
      open={open}
      onOpenChange={handleClose}
      closeOnOverlay={!isSubmitting}
    >
      {/* 헤더 */}
      <div className="pt-4 text-center">
        <Title as="h3" className="font-bold">
          직접 입력하여 상담 기록 추가하기
        </Title>
      </div>

      {/* 메인 컨텐츠 */}
      <div className="flex flex-1 gap-8 px-8">
        {/* 왼쪽: 텍스트 입력 영역 */}
        <div className="flex flex-1 flex-col">
          <textarea
            value={contents}
            onChange={(e) => setContents(e.target.value)}
            placeholder="상담 내용을 입력해주세요."
            className={`h-full min-h-[400px] w-full resize-none rounded-lg border-2 bg-surface-contrast p-4 text-fg outline-none transition-colors ${
              isOverLimit
                ? 'border-red-500 focus:border-red-500'
                : 'border-border focus:border-primary'
            }`}
            disabled={isSubmitting}
          />
          <Text
            className={`mt-2 text-center text-sm ${
              isOverLimit || isUnderLimit ? 'text-red-500' : 'text-fg-muted'
            }`}
          >
            글자 수 {contentLength.toLocaleString()} (최소{' '}
            {MIN_CONTENT_LENGTH.toLocaleString()}자 / 최대{' '}
            {MAX_CONTENT_LENGTH.toLocaleString()}자)
          </Text>
        </div>

        {/* 오른쪽: 설정 영역 */}
        <div className="flex w-[280px] flex-col gap-6">
          <Title as="h4" className="text-lg font-semibold text-fg">
            기록 설정
          </Title>

          {/* 상담기록 제목 */}
          <div className="flex flex-col gap-2">
            <Text className="text-sm font-semibold text-fg">상담기록 제목</Text>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={
                selectedClient
                  ? `${selectedClient.name} ${(selectedClient.session_count ?? selectedClient.counsel_number) + 1}회기`
                  : '제목을 입력해주세요'
              }
              className="w-full rounded-lg border-2 border-border bg-surface px-3 py-2 text-sm text-fg outline-none transition-colors focus:border-primary"
              disabled={isSubmitting}
            />
          </div>

          {/* 내담자 선택 */}
          <div className="flex flex-col gap-2">
            <Text className="text-sm font-semibold text-fg">내담자 선택</Text>
            <ClientSelector
              clients={clients}
              selectedClient={selectedClient}
              onSelect={handleClientSelect}
              variant="default"
            />
          </div>
        </div>
      </div>

      {/* 하단 버튼 */}
      <div className="flex flex-col items-center gap-2 pb-4">
        <div className="flex items-center gap-1 rounded-lg bg-primary-100 px-3 py-1">
          <Text className="font-bold text-primary-600">
            {HAND_WRITTEN_CREDIT}
          </Text>
          <svg
            width="14"
            height="14"
            viewBox="0 0 14 14"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="text-primary-600"
          >
            <g clipPath="url(#clip0_credit_handwritten)">
              <path
                d="M7 14C10.866 14 14 10.866 14 7C14 3.134 10.866 0 7 0C3.134 0 0 3.134 0 7C0.00418359 10.8643 3.13573 13.9958 7 14ZM4.1125 4.1125C5.70836 2.52055 8.29164 2.52055 9.8875 4.1125C10.1113 4.34424 10.1049 4.71352 9.87317 4.93732C9.64712 5.15566 9.28873 5.15566 9.06268 4.93732C7.92351 3.79846 6.07677 3.79868 4.9379 4.93787C3.79903 6.07707 3.79925 7.92378 4.93845 9.06265C6.07742 10.2013 7.92373 10.2013 9.0627 9.06265C9.29444 8.83884 9.66372 8.84527 9.88753 9.07701C10.1058 9.30306 10.1058 9.66142 9.88753 9.8875C8.29281 11.4822 5.70724 11.4822 4.11253 9.8875C2.51779 8.29279 2.51779 5.70721 4.1125 4.1125Z"
                fill="currentColor"
              />
            </g>
            <defs>
              <clipPath id="clip0_credit_handwritten">
                <rect width="14" height="14" fill="white" />
              </clipPath>
            </defs>
          </svg>
          <Text className="text-primary-600">사용</Text>
        </div>
        <Button
          variant="solid"
          tone="primary"
          size="lg"
          onClick={handleSubmit}
          disabled={!canSubmit}
          className="w-full max-w-[375px]"
        >
          {isSubmitting ? '생성 중...' : '상담기록 만들기'}
        </Button>
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
          onClick: () => setIsPlanChangeModalOpen(true),
        }}
        duration={8000}
      />

      {/* 플랜 변경 모달 */}
      <PlanChangeModal
        open={isPlanChangeModalOpen}
        onOpenChange={setIsPlanChangeModalOpen}
      />
    </Modal>
  );
};

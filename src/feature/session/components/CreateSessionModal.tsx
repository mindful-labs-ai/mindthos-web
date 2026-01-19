// TODO: 삭제 예정 - CreateMultiSessionModal로 대체됨, 어디에서도 import되지 않음
import React from 'react';

import { useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';

import { Title } from '@/components/ui';
import { Button } from '@/components/ui/atoms/Button';
import { Text } from '@/components/ui/atoms/Text';
import { Modal } from '@/components/ui/composites/Modal';
import { SnackBar } from '@/components/ui/composites/SnackBar';
import { useToast } from '@/components/ui/composites/Toast';
import { ClientSelector } from '@/feature/client/components/ClientSelector';
import { useClientList } from '@/feature/client/hooks/useClientList';
import type { Client } from '@/feature/client/types';
import { useTutorial } from '@/feature/onboarding/hooks/useTutorial';
import { PlanChangeModal } from '@/feature/settings/components/PlanChangeModal';
import { trackError, trackEvent } from '@/lib/mixpanel';
import { getSessionDetailRoute } from '@/router/constants';
import { useAuthStore } from '@/stores/authStore';
import { useQuestStore } from '@/stores/questStore';

import { isFileSizeExceeded } from '../constants/fileUpload';
import { useCreateSession } from '../hooks/useCreateSession';
import { useSessionStatus } from '../hooks/useSessionStatus';
import type { FileInfo, SttModel, UploadType } from '../types';
import { calculateTotalCredit } from '../utils/creditCalculator';
import { getSessionModalTitle } from '../utils/sessionModal';

import { FileUploadArea } from './FileUploadArea';
import SttModelSelector from './SttModelSelector';

interface CreateSessionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  type: UploadType;
}

export const CreateSessionModal: React.FC<CreateSessionModalProps> = ({
  open,
  onOpenChange,
  type,
}) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Auth store
  const userId = useAuthStore((state) => state.userId);
  const defaultTemplateId = useAuthStore((state) => state.defaultTemplateId);

  // Hooks
  const { clients } = useClientList();
  const { createSession, createdSessionId } = useCreateSession();
  const { currentLevel, setShowConfetti } = useQuestStore();
  const { completeNextStep, endTutorial } = useTutorial({
    currentLevel,
  });

  // Internal state
  const [selectedClient, setSelectedClient] = React.useState<Client | null>(
    null
  );
  const [selectedFile, setSelectedFile] = React.useState<FileInfo | null>(null);
  const [directInput, setDirectInput] = React.useState('');
  const [sttModel, setSttModel] = React.useState<SttModel>('gemini-3');
  const [isCreating, setIsCreating] = React.useState(false);

  // 파일 크기 초과 여부 계산
  const fileSizeExceeded =
    selectedFile && type !== 'direct'
      ? isFileSizeExceeded(selectedFile.size, type as 'audio' | 'pdf')
      : false;

  // Error SnackBar state
  const [errorSnackBar, setErrorSnackBar] = React.useState<{
    open: boolean;
    message: string;
    isCreditError: boolean;
  }>({
    open: false,
    message: '',
    isCreditError: false,
  });

  // Plan upgrade modal state
  const [isPlanChangeModalOpen, setIsPlanChangeModalOpen] =
    React.useState(false);

  // 세션 처리 상태 폴링
  useSessionStatus({
    sessionId: createdSessionId || '',
    enabled: !!createdSessionId,
    onComplete: (data, status) => {
      if (status === 'succeeded') {
        // 특정 세션만 refetch (전체 세션 목록이 아닌)
        queryClient.invalidateQueries({
          queryKey: ['session', 'detail', data.session_id],
        });

        // 크레딧 사용 정보 업데이트
        if (userId) {
          const userIdNumber = parseInt(userId);
          if (!isNaN(userIdNumber)) {
            queryClient.invalidateQueries({
              queryKey: ['credit', 'usage', userIdNumber],
            });
          }
        }

        toast({
          title: '상담 기록 작성 완료',
          description: '축어록 및 상담노트가 성공적으로 작성되었습니다.',
          action: {
            label: '확인하기',
            onClick: () => navigate(getSessionDetailRoute(data.session_id)),
          },
          duration: 10000,
        });
      } else if (status === 'failed') {
        toast({
          title: '상담 기록 작성 실패',
          description: data.error_message || '알 수 없는 오류가 발생했습니다.',
          duration: 8000,
        });
      }
    },
  });

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
    if (fileSizeExceeded) return;

    // 사용자 인증 확인
    if (!userId) {
      toast({
        title: '오류',
        description:
          '로그인 정보를 불러오는 중입니다. 잠시 후 다시 시도해주세요.',
        duration: 3000,
      });
      return;
    }

    // userId를 number로 변환
    const userIdNumber = parseInt(userId);
    if (isNaN(userIdNumber)) {
      toast({
        title: '오류',
        description: '사용자 정보가 올바르지 않습니다. 다시 로그인해주세요.',
        duration: 3000,
      });
      return;
    }

    // 템플릿 ID 확인 (없으면 기본값 1 사용)
    const templateId = defaultTemplateId || 1;

    setIsCreating(true);
    try {
      // uploadType에 따른 분기 처리
      let transcribeType: 'basic' | 'advanced' | undefined;

      if (type === 'audio') {
        if (sttModel === 'gemini-3') transcribeType = 'advanced';
        if (sttModel === 'whisper') transcribeType = 'basic';
      } else if (type === 'pdf' || type === 'direct') {
        transcribeType = undefined; // PDF와 직접 입력은 전사 타입 불필요
      }

      // 실제 API 호출
      await createSession({
        userId: userIdNumber,
        clientId: selectedClient?.id,
        uploadType: type,
        transcribeType,
        templateId,
        file: selectedFile || undefined,
        directInput: type === 'direct' ? directInput : undefined,
      });

      // 세션 생성 성공 트래킹
      trackEvent('session_create_success', {
        upload_type: type,
        transcribe_type: transcribeType,
        has_client: !!selectedClient,
      });

      // 세션 생성 시작 알림
      const uploadTypeLabel =
        type === 'audio' ? '오디오' : type === 'pdf' ? 'PDF' : '텍스트';

      toast({
        title: '상담 기록 작성 중',
        description: `${uploadTypeLabel}를 분석하고 상담노트를 작성하고 있습니다. 잠시만 기다려주세요.`,
        duration: 5000,
      });

      // 튜토리얼(레벨 4) 진행 중이라면 완료 처리
      if (currentLevel === 4 && userIdNumber) {
        await completeNextStep(useAuthStore.getState().user?.email || '');
        setShowConfetti(true);
        endTutorial();
      }

      // 모달 닫기
      handleClose();
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : '알 수 없는 오류';

      trackError('session_create_error', error, {
        upload_type: type,
        transcribe_type:
          type === 'audio'
            ? sttModel === 'gemini-3'
              ? 'advanced'
              : 'basic'
            : undefined,
      });

      // 크레딧 부족 에러 확인
      const isCreditError = errorMessage.includes('크레딧이 부족합니다');

      // SnackBar로 에러 표시
      setErrorSnackBar({
        open: true,
        message: isCreditError
          ? errorMessage
          : '상담 기록 생성에 실패했습니다. 다시 시도해주세요.',
        isCreditError,
      });
    } finally {
      setIsCreating(false);
    }
  };

  const canSubmit =
    (type !== 'direct' ? selectedFile !== null : directInput.trim() !== '') &&
    !isCreating &&
    !fileSizeExceeded;

  return (
    <>
      <Modal className="max-w-lg" open={open} onOpenChange={handleClose}>
        <div className="flex flex-col justify-center gap-6 p-6">
          <div className="text-center">
            <Title as="h3" className="font-bold">
              {getSessionModalTitle(type)}
            </Title>
          </div>

          <div className="flex flex-col items-center justify-center">
            <ClientSelector
              clients={clients}
              variant="default"
              selectedClient={selectedClient}
              onSelect={setSelectedClient}
            />

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
          </div>

          {type === 'audio' && (
            <SttModelSelector sttModel={sttModel} setSttModel={setSttModel} />
          )}

          <div className="space-y-2">
            {(() => {
              if (!selectedFile) return null;

              let creditInfo = null;

              if (type === 'audio' && 'duration' in selectedFile) {
                const transcribeType =
                  sttModel === 'gemini-3' ? 'advanced' : 'basic';
                creditInfo = calculateTotalCredit({
                  uploadType: 'audio',
                  transcribeType,
                  durationSeconds: selectedFile.duration,
                });
              } else if (type === 'pdf' || type === 'direct') {
                creditInfo = calculateTotalCredit({
                  uploadType: 'pdf',
                });
              }

              if (!creditInfo) return null;

              return (
                <div className="flex justify-center">
                  <div className="flex w-fit items-center justify-center gap-2 rounded-lg bg-primary-100 px-2">
                    <Text className="flex items-center gap-1 text-center text-primary-600">
                      {creditInfo.totalCredit}
                      <svg
                        width="14"
                        height="14"
                        viewBox="0 0 14 14"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <g clipPath="url(#clip0_2702_37025)">
                          <path
                            d="M7 14C10.866 14 14 10.866 14 7C14 3.134 10.866 0 7 0C3.134 0 0 3.134 0 7C0.00418359 10.8643 3.13573 13.9958 7 14ZM4.1125 4.1125C5.70836 2.52055 8.29164 2.52055 9.8875 4.1125C10.1113 4.34424 10.1049 4.71352 9.87317 4.93732C9.64712 5.15566 9.28873 5.15566 9.06268 4.93732C7.92351 3.79846 6.07677 3.79868 4.9379 4.93787C3.79903 6.07707 3.79925 7.92378 4.93845 9.06265C6.07742 10.2013 7.92373 10.2013 9.0627 9.06265C9.29444 8.83884 9.66372 8.84527 9.88753 9.07701C10.1058 9.30306 10.1058 9.66142 9.88753 9.8875C8.29281 11.4822 5.70724 11.4822 4.11253 9.8875C2.51779 8.29279 2.51779 5.70721 4.1125 4.1125Z"
                            fill="#44CE4B"
                          />
                        </g>
                        <defs>
                          <clipPath id="clip0_2702_37025">
                            <rect width="14" height="14" fill="white" />
                          </clipPath>
                        </defs>
                      </svg>
                    </Text>
                    <Text className="text-center text-primary-600">사용</Text>
                  </div>
                </div>
              );
            })()}

            <Button
              variant="solid"
              tone="primary"
              size="lg"
              onClick={handleCreateSession}
              disabled={!canSubmit}
              className="w-full"
            >
              {isCreating
                ? '파일 업로드 중...'
                : fileSizeExceeded
                  ? '파일 크기 초과'
                  : '상담 기록 만들기'}
            </Button>
          </div>
        </div>
      </Modal>

      <SnackBar
        open={errorSnackBar.open}
        message={errorSnackBar.message}
        onOpenChange={(open) => setErrorSnackBar((prev) => ({ ...prev, open }))}
        action={
          errorSnackBar.isCreditError
            ? {
                label: '플랜 업그레이드',
                onClick: () => {
                  setIsPlanChangeModalOpen(true);
                },
              }
            : undefined
        }
        duration={8000}
      />

      <PlanChangeModal
        open={isPlanChangeModalOpen}
        onOpenChange={setIsPlanChangeModalOpen}
      />
    </>
  );
};

import React from 'react';

import { useLocation, useNavigate } from 'react-router-dom';

import { Button, Sidebar, Text } from '@/components/ui';
import { PopUp } from '@/components/ui/composites/PopUp';
import { useToast } from '@/components/ui/composites/Toast';
import { useClientList } from '@/feature/client/hooks/useClientList';
import type { Client } from '@/feature/client/types';
import { CreateSessionModal } from '@/feature/session/components/CreateSessionModal';
import { useCreateSession } from '@/feature/session/hooks/useCreateSession';
import { useSessionStatus } from '@/feature/session/hooks/useSessionStatus';
import type { FileInfo, UploadType } from '@/feature/session/types';
import { CreditDisplay } from '@/feature/settings/components/CreditDisplay';
import { useCreditInfo } from '@/feature/settings/hooks/useCreditInfo';
import {
  calculateDaysUntilReset,
  getPlanLabel,
} from '@/feature/settings/utils/planUtils';
import { getSessionDetailRoute } from '@/router/constants';
import {
  FileTextIcon,
  PlusIcon,
  XIcon,
  UploadIcon,
  Edit3Icon,
} from '@/shared/icons';
import { useAuthStore } from '@/stores/authStore';

import {
  getNavValueFromPath,
  getPathFromNavValue,
  getMainNavItems,
  getBottomNavItems,
} from '../navigationConfig';

interface SideTabProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SideTab: React.FC<SideTabProps> = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const [isNewRecordMenuOpen, setIsNewRecordMenuOpen] = React.useState(false);
  const [isCreateSessionModalOpen, setIsCreateSessionModalOpen] =
    React.useState(false);
  const [uploadType, setUploadType] = React.useState<UploadType>('audio');

  // 고객 목록 가져오기
  const { clients } = useClientList();

  // 크레딧 정보 가져오기
  const { creditInfo } = useCreditInfo();

  // 인증 스토어
  const userId = useAuthStore((state) => state.userId);
  const defaultTemplateId = useAuthStore((state) => state.defaultTemplateId);

  // 세션 생성 Hook
  const { createSession, createdSessionId } = useCreateSession();

  // 세션 처리 상태 폴링 Hook
  useSessionStatus({
    sessionId: createdSessionId || '',
    enabled: !!createdSessionId,
    onComplete: (data, status) => {
      if (status === 'succeeded') {
        console.log('[세션 처리 완료]', data);
        toast({
          title: '상담 기록 생성 완료',
          description: 'STT 및 상담노트가 성공적으로 생성되었습니다.',
          action: {
            label: '확인하기',
            onClick: () => navigate(getSessionDetailRoute(data.session_id)),
          },
          duration: 10000,
        });
      } else if (status === 'failed') {
        console.error('[세션 처리 실패]', data.error_message);
        toast({
          title: '상담 기록 생성 실패',
          description: data.error_message || '알 수 없는 오류가 발생했습니다.',
          duration: 8000,
        });
      }
    },
  });

  // 현재 경로에 따라 activeNav 자동 설정
  const activeNav = getNavValueFromPath(location.pathname);

  // 메인 네비게이션 아이템
  const mainNavItems = getMainNavItems();

  // 하단 메뉴 아이템
  const bottomNavItems = getBottomNavItems();

  const handleNavSelect = (value: string) => {
    const path = getPathFromNavValue(value);
    if (path) {
      navigate(path);
    }
  };

  const handleAudioUploadClick = () => {
    setUploadType('audio');
    setIsNewRecordMenuOpen(false);
    setIsCreateSessionModalOpen(true);
  };

  const handlePdfUploadClick = () => {
    setUploadType('pdf');
    setIsNewRecordMenuOpen(false);
    setIsCreateSessionModalOpen(true);
  };

  const handleDirectInputClick = () => {
    setUploadType('direct');
    setIsNewRecordMenuOpen(false);
    setIsCreateSessionModalOpen(true);
  };

  const handleCreateSession = async (data: {
    client: Client | null;
    file?: FileInfo;
    directInput?: string;
  }) => {
    console.log('[handleCreateSession] 시작:', {
      userId,
      defaultTemplateId,
      uploadType,
      data,
    });

    // 사용자 인증 확인
    if (!userId) {
      console.error('[handleCreateSession] 사용자 ID가 없습니다.');
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
      console.error('[handleCreateSession] 유효하지 않은 사용자 ID:', userId);
      toast({
        title: '오류',
        description: '사용자 정보가 올바르지 않습니다. 다시 로그인해주세요.',
        duration: 3000,
      });
      return;
    }

    // 템플릿 ID 확인 (없으면 기본값 1 사용)
    const templateId = defaultTemplateId || 1;

    try {
      console.log('[handleCreateSession] API 호출 시작:', {
        userId: userIdNumber,
        clientId: data.client?.id,
        uploadType,
        templateId,
      });

      // uploadType에 따른 분기 처리
      let transcribeType: 'basic' | 'advanced' | undefined;

      if (uploadType === 'audio') {
        transcribeType = 'advanced'; // 오디오는 기본적으로 advanced
      } else if (uploadType === 'pdf' || uploadType === 'direct') {
        transcribeType = undefined; // PDF와 직접 입력은 전사 타입 불필요
      }

      // 실제 API 호출
      const response = await createSession({
        userId: userIdNumber,
        clientId: data.client?.id,
        uploadType,
        transcribeType,
        templateId,
        file: data.file,
        directInput: data.directInput,
      });

      console.log('[handleCreateSession] 세션 생성 성공:', response);

      // 세션 생성 시작 알림
      const uploadTypeLabel =
        uploadType === 'audio'
          ? '오디오'
          : uploadType === 'pdf'
            ? 'PDF'
            : '텍스트';

      toast({
        title: '상담 기록 생성 중',
        description: `${uploadTypeLabel}를 분석하고 상담노트를 작성하고 있습니다. 잠시만 기다려주세요.`,
        duration: 5000,
      });

      // 모달 닫기
      setIsCreateSessionModalOpen(false);
    } catch (error) {
      console.error('[handleCreateSession] 세션 생성 실패:', error);
      const errorMessage =
        error instanceof Error ? error.message : '알 수 없는 오류';
      toast({
        title: '세션 생성 실패',
        description: errorMessage,
        duration: 8000,
      });
    }
  };

  return (
    <aside
      className={`relative z-10 flex h-full flex-col border-r border-border bg-bg px-3 transition-all duration-300 ${
        isOpen ? 'w-64' : 'w-0'
      } overflow-hidden`}
    >
      {/* Logo Section */}
      <div className="flex h-14 items-center justify-between border-b border-border p-4">
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-2 rounded hover:opacity-80"
        >
          <img
            src="/logo_mindthos_kr.webp"
            alt="마음토스"
            className="h-6 w-auto"
            draggable="false"
          />
        </button>
        <button
          onClick={onClose}
          className="rounded p-1 hover:bg-bg-subtle lg:hidden"
        >
          <XIcon size={20} />
        </button>
      </div>

      {/* New Session Button (with dropdown) */}
      <div className="p-4">
        <PopUp
          open={isNewRecordMenuOpen}
          onOpenChange={setIsNewRecordMenuOpen}
          placement="bottom-right"
          trigger={
            <Button
              variant="outline"
              tone="primary"
              size="md"
              className="w-full justify-start"
              icon={<PlusIcon size={18} />}
              onClick={() => setIsNewRecordMenuOpen(!isNewRecordMenuOpen)}
            >
              새 상담 기록
            </Button>
          }
          content={
            <div className="w-[200px] space-y-1">
              <button
                onClick={handleAudioUploadClick}
                className="flex w-full items-center gap-3 rounded-lg px-4 py-3 transition-colors hover:bg-gray-50"
              >
                <UploadIcon size={18} className="text-primary" />
                <Text>녹음 파일 업로드</Text>
              </button>
              <button
                onClick={handlePdfUploadClick}
                className="flex w-full items-center gap-3 rounded-lg px-4 py-3 transition-colors hover:bg-gray-50"
              >
                <FileTextIcon size={18} className="text-primary" />
                <Text>PDF 파일 업로드</Text>
              </button>
              <button
                onClick={handleDirectInputClick}
                className="flex w-full items-center gap-3 rounded-lg px-4 py-3 transition-colors hover:bg-gray-50"
              >
                <Edit3Icon size={18} className="text-primary" />
                <Text>직접 입력하기</Text>
              </button>
            </div>
          }
        />
      </div>

      {/* Main Navigation using Sidebar component */}
      <div className="flex-1 overflow-y-auto px-3">
        <Sidebar
          items={mainNavItems}
          activeValue={activeNav}
          onSelect={handleNavSelect}
          className="min-w-0 border-none bg-transparent p-0"
        />
      </div>

      <div>
        {/* Credit Display */}
        {creditInfo && (
          <CreditDisplay
            totalCredit={creditInfo.plan.total}
            usedCredit={creditInfo.plan.used}
            planLabel={getPlanLabel(creditInfo.plan.type)}
            planType={creditInfo.plan.type}
            daysUntilReset={calculateDaysUntilReset(
              creditInfo.subscription.reset_at
            )}
            variant="sidebar"
          />
        )}
        <div className="border-t border-border px-3 py-3">
          <Sidebar
            items={bottomNavItems}
            activeValue={activeNav}
            onSelect={handleNavSelect}
            className="min-w-0 border-none bg-transparent p-0"
          />
        </div>
      </div>

      {/* 세션 생성 모달 */}
      <CreateSessionModal
        open={isCreateSessionModalOpen}
        onOpenChange={setIsCreateSessionModalOpen}
        type={uploadType}
        clients={clients}
        onCreateSession={handleCreateSession}
      />
    </aside>
  );
};

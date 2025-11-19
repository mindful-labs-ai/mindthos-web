import React from 'react';

import {
  FileText,
  HelpCircle,
  Home,
  Layers,
  Plus,
  Settings,
  Users,
  X,
  Upload,
  Edit3,
} from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';

import { Button, ProgressCircle, Sidebar, Text } from '@/components/ui';
import { PopUp } from '@/components/ui/composites/PopUp';
import { useClientList } from '@/feature/client/hooks/useClientList';
import { CreateSessionModal } from '@/feature/session/components/CreateSessionModal';
import { createMockSessionData } from '@/feature/session/utils/createMockSessionData';
import { mockSettingsData } from '@/feature/settings/data/mockData';
import { useAuthStore } from '@/stores/authStore';
import { useSessionStore } from '@/stores/sessionStore';

interface AudioFileInfo {
  name: string;
  size: number;
  duration: number;
  file: File;
}

interface SideTabProps {
  isOpen: boolean;
  onClose: () => void;
}

// 경로와 nav value 매핑
const pathToNavValue: Record<string, string> = {
  '/': 'home',
  '/clients': 'client',
  '/history': 'history',
  '/template': 'template',
  '/settings': 'settings',
  '/help': 'help',
};

// nav value와 경로 매핑
const navValueToPath: Record<string, string> = {
  home: '/',
  client: '/clients',
  history: '/history',
  template: '/template',
  settings: '/settings',
  help: '/help',
};

export const SideTab: React.FC<SideTabProps> = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isNewRecordMenuOpen, setIsNewRecordMenuOpen] = React.useState(false);
  const [isCreateSessionModalOpen, setIsCreateSessionModalOpen] =
    React.useState(false);

  // 고객 목록 가져오기
  const { clients } = useClientList();

  // 세션 스토어 & 인증 스토어
  const addSession = useSessionStore((state) => state.addSession);
  const userId = useAuthStore((state) => state.userId);

  // 현재 경로에 따라 activeNav 자동 설정
  const activeNav = pathToNavValue[location.pathname] || 'home';

  // 메인 네비게이션 아이템
  const mainNavItems = [
    { icon: <Home size={18} />, label: '홈', value: 'home' },
    { icon: <Users size={18} />, label: '클라이언트', value: 'client' },
    { icon: <FileText size={18} />, label: '상담 기록', value: 'history' },
    { icon: <Layers size={18} />, label: '템플릿', value: 'template' },
  ];

  // 하단 메뉴 아이템
  const bottomNavItems = [
    { icon: <Settings size={18} />, label: '설정', value: 'settings' },
    {
      icon: <HelpCircle size={18} />,
      label: '도움말 및 지원',
      value: 'help',
    },
  ];

  const handleNavSelect = (value: string) => {
    const path = navValueToPath[value];
    if (path) {
      navigate(path);
    }
  };

  const handleAudioUploadClick = () => {
    setIsNewRecordMenuOpen(false);
    setIsCreateSessionModalOpen(true);
  };

  const handlePdfUploadClick = () => {
    setIsNewRecordMenuOpen(false);
  };

  const handleDirectInputClick = () => {
    setIsNewRecordMenuOpen(false);
  };

  const handleCreateSession = async (data: {
    client: { id: string; name: string } | null;
    file: AudioFileInfo;
  }) => {
    // 2초 딜레이로 전사 & 요약 처리 시뮬레이션
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // Mock 세션 데이터 생성
    const { session, transcribe } = createMockSessionData({
      file: data.file,
      clientId: data.client?.id || null,
      userId: userId || 'default-user',
    });

    addSession(session, transcribe);
  };

  return (
    <aside
      className={`flex h-full flex-col border-r border-border bg-bg px-3 transition-all duration-300 ${
        isOpen ? 'w-64' : 'w-0'
      } overflow-hidden`}
    >
      {/* Logo Section */}
      <div className="flex h-14 items-center justify-between border-b border-border p-4">
        <div className="flex items-center gap-2">
          <img
            src="/logo_mindthos_kr.webp"
            alt="마음토스"
            className="h-6 w-auto"
          />
        </div>
        <button
          onClick={onClose}
          className="rounded p-1 hover:bg-bg-subtle lg:hidden"
        >
          <X size={20} />
        </button>
      </div>

      {/* New Session Button (with dropdown) */}
      <div className="p-4">
        <PopUp
          open={isNewRecordMenuOpen}
          onOpenChange={setIsNewRecordMenuOpen}
          trigger={
            <Button
              variant="outline"
              tone="primary"
              size="md"
              className="w-full justify-start"
              icon={<Plus size={18} />}
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
                <Upload size={18} className="text-primary" />
                <Text>녹음 파일 업로드</Text>
              </button>
              <button
                onClick={handlePdfUploadClick}
                className="flex w-full items-center gap-3 rounded-lg px-4 py-3 transition-colors hover:bg-gray-50"
              >
                <FileText size={18} className="text-primary" />
                <Text>PDF 파일 업로드</Text>
              </button>
              <button
                onClick={handleDirectInputClick}
                className="flex w-full items-center gap-3 rounded-lg px-4 py-3 transition-colors hover:bg-gray-50"
              >
                <Edit3 size={18} className="text-primary" />
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

      {/* TODO : usage indicator data fix */}
      <div>
        {/* Usage Section */}
        <div className="mx-3 mb-6 space-y-3 rounded-lg border-t border-border bg-surface-contrast px-1 py-4 text-left">
          <Text className="px-3 text-xs font-medium text-fg-muted">
            주이용 툴기
          </Text>
          <div className="flex items-center gap-2 px-3">
            <ProgressCircle
              value={Math.floor(
                ((mockSettingsData.plan.audio_credit -
                  mockSettingsData.usage.voice_transcription.credit) /
                  mockSettingsData.plan.audio_credit) *
                  100
              )}
              size={28}
              strokeWidth={4}
              showValue={false}
            />
            <div className="text-center">
              <Text className="text-sm text-fg">
                <span className="font-bold text-primary">
                  {mockSettingsData.plan.audio_credit -
                    mockSettingsData.usage.voice_transcription.credit}
                  분 남음
                </span>{' '}
                / {mockSettingsData.plan.audio_credit}분
              </Text>
            </div>
          </div>

          <Text className="px-3 text-xs font-medium text-fg-muted">
            요약 생성
          </Text>
          <div className="flex items-center gap-2 px-3">
            <ProgressCircle
              value={Math.floor(
                ((mockSettingsData.plan.summary_credit -
                  mockSettingsData.usage.summary_generation.credit) /
                  mockSettingsData.plan.summary_credit) *
                  100
              )}
              size={28}
              strokeWidth={4}
              showValue={false}
            />
            <div className="text-center">
              <Text className="text-sm text-fg">
                <span className="font-bold text-primary">
                  {mockSettingsData.plan.summary_credit -
                    mockSettingsData.usage.summary_generation.credit}
                  회 남음
                </span>{' '}
                / {mockSettingsData.plan.summary_credit}회
              </Text>
            </div>
          </div>
        </div>
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
        clients={clients}
        onCreateSession={handleCreateSession}
      />
    </aside>
  );
};

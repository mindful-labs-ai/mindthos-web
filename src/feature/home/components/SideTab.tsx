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
} from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';

import { Button, Sidebar, Text } from '@/components/ui';

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

      {/* New Session Button */}
      <div className="p-4">
        <Button
          variant="outline"
          tone="primary"
          size="md"
          className="w-full justify-start"
          icon={<Plus size={18} />}
        >
          새 상담 기록
        </Button>
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

      {/* Bottom Navigation using Sidebar component */}
      <div>
        {/* Usage Section */}
        <div className="space-y-3 border-t border-border px-3 pb-6 pt-4">
          <Text className="px-3 text-xs font-medium text-fg-muted">
            주이용 툴기
          </Text>
          <div className="space-y-2 px-3">
            <UsageItem label="1900분 남음" total="2000분" value={1900} />
          </div>

          <Text className="px-3 text-xs font-medium text-fg-muted">
            AI 분석
          </Text>
          <div className="space-y-2 px-3">
            <UsageItem label="100회 남음" total="200회" value={100} />
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
    </aside>
  );
};

// UsageItem Component
interface UsageItemProps {
  label: string;
  total: string;
  value: number;
}

const UsageItem: React.FC<UsageItemProps> = ({ label, total, value }) => {
  const percentage = (value / parseInt(total.replace(/\D/g, ''))) * 100;

  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs">
        <span className="text-primary-500">{label}</span>
        <span className="text-fg-muted">/ {total}</span>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-bg-subtle">
        <div
          className="h-full bg-primary-500 transition-all"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
};

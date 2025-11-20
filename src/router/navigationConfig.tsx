import React from 'react';

import {
  FileText,
  HelpCircle,
  Home,
  Layers,
  Settings,
  Users,
} from 'lucide-react';

import { ROUTES } from './constants';

export interface NavigationItem {
  path: string;
  label: string;
  value: string;
  icon?: React.ReactNode;
}

export const NAVIGATION_ITEMS: NavigationItem[] = [
  {
    path: ROUTES.ROOT,
    label: '홈',
    value: 'home',
    icon: <Home size={18} />,
  },
  {
    path: ROUTES.CLIENTS,
    label: '클라이언트',
    value: 'client',
    icon: <Users size={18} />,
  },
  {
    path: ROUTES.HISTORY,
    label: '상담 기록',
    value: 'history',
    icon: <FileText size={18} />,
  },
  {
    path: ROUTES.TEMPLATE,
    label: '템플릿',
    value: 'template',
    icon: <Layers size={18} />,
  },
  {
    path: ROUTES.SETTINGS,
    label: '설정',
    value: 'settings',
    icon: <Settings size={18} />,
  },
  {
    path: '/help',
    label: '도움말 및 지원',
    value: 'help',
    icon: <HelpCircle size={18} />,
  },
];

// 경로에서 nav value 찾기
export const getNavValueFromPath = (path: string): string => {
  const item = NAVIGATION_ITEMS.find((item) => item.path === path);
  return item?.value || 'home';
};

// nav value에서 경로 찾기
export const getPathFromNavValue = (value: string): string => {
  const item = NAVIGATION_ITEMS.find((item) => item.value === value);
  return item?.path || ROUTES.ROOT;
};

// 경로에서 표시 이름 찾기
export const getRouteLabel = (path: string): string => {
  const item = NAVIGATION_ITEMS.find((item) => item.path === path);
  return item?.label || path;
};

// 메인 네비게이션 아이템 (홈, 클라이언트, 상담 기록, 템플릿)
export const getMainNavItems = () => {
  return NAVIGATION_ITEMS.filter((item) =>
    ['home', 'client', 'history', 'template'].includes(item.value)
  ).map((item) => ({
    icon: item.icon,
    label: item.label,
    value: item.value,
  }));
};

// 하단 네비게이션 아이템 (설정, 도움말)
export const getBottomNavItems = () => {
  return NAVIGATION_ITEMS.filter((item) =>
    ['settings', 'help'].includes(item.value)
  ).map((item) => ({
    icon: item.icon,
    label: item.label,
    value: item.value,
  }));
};

// 경로별 표시 이름 매핑 (Header에서 사용)
export const routeNameMap: Record<string, string> = NAVIGATION_ITEMS.reduce(
  (acc, item) => {
    acc[item.path] = item.label;
    return acc;
  },
  {} as Record<string, string>
);

import React from 'react';

import {
  FileTextIcon,
  HelpCircleIcon,
  HomeIcon,
  LayersIcon,
  SettingsIcon,
  UsersIcon,
} from '@/shared/icons';

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
    icon: <HomeIcon size={18} />,
  },
  {
    path: ROUTES.CLIENTS,
    label: '클라이언트',
    value: 'client',
    icon: <UsersIcon size={18} />,
  },
  {
    path: ROUTES.SESSIONS,
    label: '상담 기록',
    value: 'sessions',
    icon: <FileTextIcon size={18} />,
  },
  {
    path: ROUTES.TEMPLATE,
    label: '템플릿',
    value: 'template',
    icon: <LayersIcon size={18} />,
  },
  {
    path: ROUTES.GENOGRAM,
    label: '가계도',
    value: 'genogram',
    icon: (
      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <mask id="path-1-inside-1_5497_51436" fill="white">
          <rect x="1" y="1" width="8.88889" height="8.88889" rx="1.11111" />
        </mask>
        <rect
          x="1"
          y="1"
          width="8.88889"
          height="8.88889"
          rx="1.11111"
          stroke="#3C3C3C"
          stroke-width="3"
          mask="url(#path-1-inside-1_5497_51436)"
        />
        <circle
          cx="18.9444"
          cy="5.44444"
          r="3.69444"
          stroke="#3C3C3C"
          stroke-width="1.5"
        />
        <circle
          cx="11.9444"
          cy="18.4444"
          r="3.69444"
          stroke="#3C3C3C"
          stroke-width="1.5"
        />
        <path
          d="M5.5 9C5.5 10 5.5 12 5.5 12H19V9"
          stroke="#3C3C3C"
          stroke-width="1.5"
        />
        <path d="M12 12.1094V14.3316" stroke="#3C3C3C" stroke-width="1.5" />
      </svg>
    ),
  },
  {
    path: ROUTES.SETTINGS,
    label: '설정',
    value: 'settings',
    icon: <SettingsIcon size={18} />,
  },
  {
    path: '/help',
    label: '도움말 및 지원',
    value: 'help',
    icon: <HelpCircleIcon size={18} />,
  },
];

// 경로에서 nav value 찾기
export const getNavValueFromPath = (path: string): string => {
  let item = NAVIGATION_ITEMS.find((item) => item.path === path);

  if (!item) {
    item = NAVIGATION_ITEMS.find((navItem) => {
      if (navItem.path === '/') {
        return path === '/';
      }
      return path.startsWith(navItem.path);
    });
  }

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

// 메인 네비게이션 아이템 (홈, 클라이언트, 상담 기록, 템플릿, 가계도)
export const MAIN_NAV_ITEMS = NAVIGATION_ITEMS.filter((item) =>
  ['home', 'client', 'sessions', 'template', 'genogram'].includes(item.value)
).map((item) => ({
  icon: item.icon,
  label: item.label,
  value: item.value,
}));

// 하단 네비게이션 아이템 (설정, 도움말)
export const BOTTOM_NAV_ITEMS = NAVIGATION_ITEMS.filter((item) =>
  ['settings', 'help'].includes(item.value)
).map((item) => ({
  icon: item.icon,
  label: item.label,
  value: item.value,
}));

// 레거시 함수 (호환성 유지)
export const getMainNavItems = () => MAIN_NAV_ITEMS;
export const getBottomNavItems = () => BOTTOM_NAV_ITEMS;

// 경로별 표시 이름 매핑 (Header에서 사용)
export const routeNameMap: Record<string, string> = NAVIGATION_ITEMS.reduce(
  (acc, item) => {
    acc[item.path] = item.label;
    return acc;
  },
  {} as Record<string, string>
);

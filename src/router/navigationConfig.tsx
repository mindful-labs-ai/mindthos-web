import React from 'react';

import {
  // SideAnalysisIcon,
  // SideCalendarIcon,
  SideClientIcon,
  SideGenogramIcon,
  SideHelpIcon,
  SideHomeIcon,
  SideSessionIcon,
  SideSettingsIcon,
  SideTemplateIcon,
} from '@/shared/icons';

import { ROUTES } from './constants';

export interface NavigationItem {
  path: string;
  label: string;
  value: string;
  icon?: React.ReactNode;
  badge?: 'beta' | 'comingSoon';
  disabled?: boolean;
}

export const NAVIGATION_ITEMS: NavigationItem[] = [
  {
    path: ROUTES.ROOT,
    label: '홈',
    value: 'home',
    icon: <SideHomeIcon size={24} />,
  },
  // {
  //   path: ROUTES.CALENDAR,
  //   label: '일정',
  //   value: 'calendar',
  //   icon: <SideCalendarIcon size={24} />,
  //   badge: 'comingSoon',
  //   disabled: true,
  // },
  {
    path: ROUTES.CLIENTS,
    label: '클라이언트',
    value: 'client',
    icon: <SideClientIcon size={24} />,
  },
  {
    path: ROUTES.SESSIONS,
    label: '상담 기록',
    value: 'sessions',
    icon: <SideSessionIcon size={24} />,
  },
  {
    path: ROUTES.TEMPLATE,
    label: '템플릿',
    value: 'template',
    icon: <SideTemplateIcon size={24} />,
  },
  {
    path: ROUTES.GENOGRAM,
    label: '가계도',
    value: 'genogram',
    icon: <SideGenogramIcon size={24} />,
    badge: 'beta',
  },
  // {
  //   path: ROUTES.ANALYSIS,
  //   label: '심리검사 분석',
  //   value: 'analysis',
  //   icon: <SideAnalysisIcon size={24} />,
  //   badge: 'comingSoon',
  //   disabled: true,
  // },
  {
    path: ROUTES.SETTINGS,
    label: '설정',
    value: 'settings',
    icon: <SideSettingsIcon size={24} />,
  },
  {
    path: '/help',
    label: '도움말 및 지원',
    value: 'help',
    icon: <SideHelpIcon size={24} />,
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

export const SESSION_MANAGEMENT_ITEMS = NAVIGATION_ITEMS.filter((item) =>
  ['home', 'calendar', 'client', 'sessions', 'template'].includes(item.value)
).map((item) => ({
  icon: item.icon,
  label: item.label,
  value: item.value,
  badge: item.badge,
  disabled: item.disabled,
}));

export const AI_ANALYSIS_ITEMS = NAVIGATION_ITEMS.filter((item) =>
  ['genogram', 'analysis'].includes(item.value)
).map((item) => ({
  icon: item.icon,
  label: item.label,
  value: item.value,
  badge: item.badge,
  disabled: item.disabled,
}));

// 하단 네비게이션 아이템 (설정, 도움말)
export const BOTTOM_NAV_ITEMS = NAVIGATION_ITEMS.filter((item) =>
  ['settings', 'help'].includes(item.value)
).map((item) => ({
  icon: item.icon,
  label: item.label,
  value: item.value,
  badge: item.badge,
  disabled: item.disabled,
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

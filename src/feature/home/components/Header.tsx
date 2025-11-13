import React from 'react';

import { useLocation } from 'react-router-dom';

import {
  BreadCrumb,
  type BreadCrumbItem,
} from '@/components/ui/composites/BreadCrumb';

// 경로별 표시 이름 매핑
const routeNameMap: Record<string, string> = {
  '/': '홈',
  '/clients': '클라이언트',
  '/history': '상담 기록',
  '/template': '템플릿',
  '/settings': '설정',
  '/help': '도움말 및 지원',
};

export const Header: React.FC = () => {
  const location = useLocation();

  const getBreadcrumbItems = (): BreadCrumbItem[] => {
    const pathnames = location.pathname.split('/').filter((x) => x);

    if (pathnames.length === 0) {
      return [{ label: '홈', href: '/' }];
    }

    // 하위 경로인 경우
    const items: BreadCrumbItem[] = [{ label: '홈', href: '/' }];

    let currentPath = '';
    pathnames.forEach((name) => {
      currentPath += `/${name}`;
      const label = routeNameMap[currentPath] || name;
      items.push({
        label,
        href: currentPath,
      });
    });

    return items;
  };

  const breadcrumbItems = getBreadcrumbItems();

  return (
    <header className="sticky top-0 z-10 flex h-14 items-center border-b border-border bg-bg px-6 py-4 lg:px-8">
      <BreadCrumb items={breadcrumbItems} />
    </header>
  );
};

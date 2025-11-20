import React from 'react';

import { useLocation } from 'react-router-dom';

import {
  BreadCrumb,
  type BreadCrumbItem,
} from '@/components/ui/composites/BreadCrumb';
import { useSessionStore } from '@/stores/sessionStore';

import { routeNameMap } from '../navigationConfig';

export const Header: React.FC = () => {
  const location = useLocation();
  const sessions = useSessionStore((state) => state.sessions);

  const getBreadcrumbItems = (): BreadCrumbItem[] => {
    const pathnames = location.pathname.split('/').filter((x) => x);

    if (pathnames.length === 0) {
      return [{ label: '홈', href: '/' }];
    }

    // 하위 경로인 경우
    const items: BreadCrumbItem[] = [{ label: '홈', href: '/' }];

    let currentPath = '';
    pathnames.forEach((name, index) => {
      currentPath += `/${name}`;

      // /history/:sessionId 경로인 경우 세션 제목 사용
      if (
        pathnames[index - 1] === 'history' &&
        index === pathnames.length - 1
      ) {
        const session = sessions.find((s) => s.id === name);
        const label = session?.title || '세션 상세';
        items.push({
          label,
          href: currentPath,
        });
      } else {
        const label = routeNameMap[currentPath] || name;
        items.push({
          label,
          href: currentPath,
        });
      }
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

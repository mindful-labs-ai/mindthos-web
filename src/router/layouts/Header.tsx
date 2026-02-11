import React from 'react';

import { useLocation, useSearchParams } from 'react-router-dom';

import {
  BreadCrumb,
  type BreadCrumbItem,
} from '@/components/ui/composites/BreadCrumb';
import { useClientList } from '@/feature/client/hooks/useClientList';
import { useSessionList } from '@/feature/session/hooks/useSessionList';
import { useAuthStore } from '@/stores/authStore';

import { routeNameMap } from '../navigationConfig';

export const Header: React.FC = () => {
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const userId = useAuthStore((state) => state.userId);
  const { clients } = useClientList();
  const { data: sessionsData } = useSessionList({
    userId: userId ? Number(userId) : 0,
    enabled: !!userId,
  });

  const sessions = sessionsData?.sessions.map((s) => s.session) || [];

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

      // /sessions/:sessionId 경로인 경우 세션 제목 사용
      if (
        pathnames[index - 1] === 'sessions' &&
        index === pathnames.length - 1
      ) {
        const session = sessions.find((s) => s.id === name);
        const label = session?.title || '제목 없음';
        items.push({
          label,
          href: currentPath,
        });
      }
      // /clients/:clientId 경로인 경우 클라이언트 이름 사용
      else if (
        pathnames[index - 1] === 'clients' &&
        index === pathnames.length - 1
      ) {
        const client = clients.find((c) => c.id === name);
        const label = client?.name || '제목 없음';
        items.push({
          label,
          href: currentPath,
        });
      }
      // /genogram 경로에서 쿼리스트링 clientId로 클라이언트 이름 표시
      else if (name === 'genogram') {
        const label = routeNameMap[currentPath] || '가계도';
        items.push({ label, href: currentPath });

        // 쿼리스트링에 clientId가 있으면 클라이언트 이름 추가
        const clientId = searchParams.get('clientId');
        if (clientId) {
          const client = clients.find((c) => c.id === clientId);
          if (client) {
            items.push({
              label: client.name,
              href: `${currentPath}?clientId=${clientId}`,
            });
          }
        }
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
    <header className="sticky top-0 hidden h-14 items-center justify-start border-b border-border bg-bg px-6 py-4 sm:flex lg:px-8">
      <BreadCrumb items={breadcrumbItems} />
    </header>
  );
};

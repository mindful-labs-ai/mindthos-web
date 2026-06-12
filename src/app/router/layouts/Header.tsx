import React from 'react';

import { useQuery } from '@tanstack/react-query';
import { useLocation, useSearchParams } from 'react-router-dom';

import { useClientList } from '@/features/client/hooks/useClientList';
import { getSessionById } from '@/shared/api/supabase/sessionQueries';
import { sessionQueryKeys } from '@/shared/constants/queryKeys';
import {
  BreadCrumb,
  type BreadCrumbItem,
} from '@/shared/ui/composites/BreadCrumb';
import { useAuthStore } from '@/stores/authStore';
import { useDocumentStore } from '@/stores/documentStore';
import { NotificationBell } from '@/widgets/notification';
import { ProfileMenu } from '@/widgets/profile';

import { routeNameMap } from '../navigationConfig';

export const Header: React.FC = () => {
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const userId = useAuthStore((state) => state.userId);
  const { clients } = useClientList();
  const myDocuments = useDocumentStore((state) => state.myDocuments);
  const pathnames = location.pathname.split('/').filter((x) => x);
  const currentSessionId =
    pathnames.length >= 2 && pathnames[pathnames.length - 2] === 'sessions'
      ? pathnames[pathnames.length - 1]
      : null;
  const userIdNumber = userId ? Number(userId) : 0;

  const { data: currentSession } = useQuery({
    queryKey: [
      ...sessionQueryKeys.detailById(currentSessionId ?? ''),
      userIdNumber,
    ],
    queryFn: () =>
      getSessionById({
        sessionId: currentSessionId ?? '',
        userId: userIdNumber,
      }),
    enabled: !!userIdNumber && !!currentSessionId,
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
  });

  const getBreadcrumbItems = (): BreadCrumbItem[] => {
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
        const label = currentSession?.title || '제목 없음';
        items.push({
          label,
          href: currentPath,
        });
      }
      // /clients/:clientId 경로인 경우 내담자 이름 사용
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
      // /documents/:documentId(/edit) 경로인 경우 문서 제목 사용 (/documents/new는 제작 뷰)
      else if (pathnames[index - 1] === 'documents') {
        const label =
          name === 'new'
            ? '빈 문서'
            : myDocuments.find((d) => d.id === name)?.title || '제목 없음';
        items.push({
          label,
          href: currentPath,
        });
      }
      // /documents/:documentId/edit의 edit 세그먼트
      else if (pathnames[index - 2] === 'documents' && name === 'edit') {
        items.push({
          label: '편집',
          href: currentPath,
        });
      }
      // /genogram 경로에서 쿼리스트링 clientId로 내담자 이름 표시
      else if (name === 'genogram') {
        const label = routeNameMap[currentPath] || '가계도';
        items.push({ label, href: currentPath });

        // 쿼리스트링에 clientId가 있으면 내담자 이름 추가
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
    <header className="sticky top-0 z-header hidden h-header items-center justify-between gap-4 border-b border-header-border bg-header-bg px-8 py-4 sm:flex">
      <BreadCrumb items={breadcrumbItems} />
      <div className="flex items-center gap-3">
        <NotificationBell />
        <ProfileMenu surface="dropdown" />
      </div>
    </header>
  );
};

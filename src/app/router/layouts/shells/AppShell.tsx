import { type ReactNode } from 'react';

interface AppShellProps {
  sidebar: ReactNode;
  header: ReactNode;
  mobileHeader: ReactNode;
  isMobileView: boolean;
  children: ReactNode;
}

/**
 * AppShell - 슬롯 기반 메인 레이아웃 셸
 *
 * useDevice 기반으로 레이아웃 가시성 제어:
 * - Desktop: sidebar + header + main
 * - Mobile/Tablet: mobileHeader + main
 *
 * h-dvh: 모바일 브라우저의 동적 뷰포트 높이(주소창/키보드) 자동 대응
 */
export const AppShell = ({
  sidebar,
  header,
  mobileHeader,
  isMobileView,
  children,
}: AppShellProps) => (
  <div className="flex h-dvh w-full overflow-hidden bg-app-bg">
    {/* Sidebar - 데스크톱에서만 표시 */}
    {!isMobileView && sidebar}

    {/* Main Content Area */}
    <div className="flex min-w-0 flex-1 flex-col">
      {/* Mobile Header - 모바일/태블릿에서만 표시 */}
      {isMobileView && mobileHeader}

      {/* Desktop Header - 데스크톱에서만 표시 */}
      {!isMobileView && header}

      {/* Page Content — scrollbar-gutter로 스크롤바 유무와 무관하게 폭 고정(탭 전환 시 흔들림 방지) */}
      <main className="min-w-0 flex-1 overflow-y-auto overflow-x-hidden [scrollbar-gutter:stable]">
        {children}
      </main>
    </div>
  </div>
);

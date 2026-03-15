import { type ReactNode } from 'react';

interface AppShellProps {
  sidebar: ReactNode;
  header: ReactNode;
  mobileHeader: ReactNode;
  children: ReactNode;
}

/**
 * AppShell - 슬롯 기반 메인 레이아웃 셸
 *
 * CSS 반응형으로 레이아웃 가시성 제어:
 * - Desktop (sm+): sidebar + header + main
 * - Mobile/Tablet (<sm): mobileHeader + main
 *
 * h-dvh: 모바일 브라우저의 동적 뷰포트 높이(주소창/키보드) 자동 대응
 */
export const AppShell = ({
  sidebar,
  header,
  mobileHeader,
  children,
}: AppShellProps) => (
  <div className="flex h-dvh w-full overflow-hidden bg-bg-subtle">
    {/* Sidebar - sm 이상에서만 표시 */}
    <div className="hidden sm:contents">{sidebar}</div>

    {/* Main Content Area */}
    <div className="flex min-w-0 flex-1 flex-col">
      {/* Mobile Header - sm 미만에서만 표시 */}
      <div className="contents sm:hidden">{mobileHeader}</div>

      {/* Desktop Header - sm 이상에서만 표시 */}
      <div className="hidden sm:contents">{header}</div>

      {/* Page Content */}
      <main className="min-w-0 flex-1 overflow-y-auto overflow-x-hidden">
        {children}
      </main>
    </div>
  </div>
);

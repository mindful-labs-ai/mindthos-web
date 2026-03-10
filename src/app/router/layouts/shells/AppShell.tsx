import type { ReactNode } from 'react';

interface AppShellProps {
  sidebar: ReactNode;
  header: ReactNode;
  children: ReactNode;
}

/**
 * AppShell - 슬롯 기반 메인 레이아웃 셸
 *
 * CSS 반응형으로 레이아웃 가시성 제어:
 * - Desktop (sm+): sidebar + header + main
 * - Mobile (<sm): main only (전체 화면)
 *
 * h-dvh: 모바일 브라우저의 동적 뷰포트 높이(주소창/키보드) 자동 대응
 */
export const AppShell = ({ sidebar, header, children }: AppShellProps) => (
  <div className="flex h-dvh w-full bg-bg-subtle">
    {/* Sidebar - sm 이상에서만 표시 */}
    <div className="hidden sm:contents">{sidebar}</div>

    {/* Main Content Area */}
    <div className="flex flex-1 flex-col">
      {/* Header - sm 이상에서만 표시 (Header 내부에서도 hidden sm:flex) */}
      <div className="hidden sm:contents">{header}</div>

      {/* Page Content */}
      <main className="flex-1 overflow-y-auto">{children}</main>
    </div>
  </div>
);

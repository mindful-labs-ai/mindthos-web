import React from 'react';

import { Outlet, useLocation } from 'react-router-dom';

import { Header } from '@/app/router/layouts/Header';
import { MobileHeader } from '@/app/router/layouts/MobileHeader';
import { SideDrawer } from '@/app/router/layouts/SideDrawer';
import { SideTab } from '@/app/router/layouts/SideTab';
import { isChromelessRoute } from '@/app/router/shellConfig';
import { useDevice } from '@/shared/hooks/useDevice';
import { useModalStore } from '@/stores/modalStore';

import { AppShell } from './shells/AppShell';

/**
 * 메인 앱 레이아웃
 * AppShell을 통해 useDevice 기반 적응형 레이아웃 적용
 * - Desktop: Sidebar + Header + Content
 * - Mobile/Tablet: MobileHeader + Content + SideDrawer
 *
 * chromeless 라우트(shellConfig.ts에서 선언)에서는
 * sidebar/header 없이 콘텐츠만 전체 화면으로 렌더링
 */
const MainFlowLayout = () => {
  const location = useLocation();
  const { isMobile, isTablet } = useDevice();
  const isMobileView = isMobile || isTablet;
  const chromeless = isMobileView && isChromelessRoute(location.pathname);

  const [isDrawerOpen, setIsDrawerOpen] = React.useState(false);
  const openModal = useModalStore((state) => state.openModal);

  const handleNewSession = React.useCallback(() => {
    openModal('createMultiSession');
  }, [openModal]);

  if (chromeless) {
    return (
      <div className="flex h-dvh w-full flex-col overflow-hidden bg-surface-contrast">
        <main className="min-w-0 flex-1 overflow-y-auto overflow-x-hidden">
          <Outlet />
        </main>
      </div>
    );
  }

  return (
    <>
      <AppShell
        sidebar={<SideTab />}
        header={<Header />}
        mobileHeader={
          <MobileHeader
            onMenuOpen={() => setIsDrawerOpen(true)}
            onNewSession={handleNewSession}
          />
        }
        isMobileView={isMobileView}
      >
        <Outlet />
      </AppShell>

      {/* Mobile/Tablet Drawer */}
      {isMobileView && (
        <SideDrawer open={isDrawerOpen} onClose={() => setIsDrawerOpen(false)}>
          <SideTab
            variant="drawer"
            onNavSelect={() => setIsDrawerOpen(false)}
          />
        </SideDrawer>
      )}
    </>
  );
};

export default MainFlowLayout;

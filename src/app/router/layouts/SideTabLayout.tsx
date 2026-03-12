import React from 'react';

import { Outlet } from 'react-router-dom';

import { useModalStore } from '@/stores/modalStore';

import { Header } from '@/app/router/layouts/Header';
import { MobileHeader } from '@/app/router/layouts/MobileHeader';
import { SideDrawer } from '@/app/router/layouts/SideDrawer';
import { SideTab } from '@/app/router/layouts/SideTab';

import { AppShell } from './shells/AppShell';

/**
 * 메인 앱 레이아웃
 * AppShell을 통해 CSS 기반 반응형 레이아웃 적용
 * - Desktop (sm+): Sidebar + Header + Content
 * - Mobile/Tablet (<sm): MobileHeader + Content + SideDrawer
 */
const MainFlowLayout = () => {
  const [isDrawerOpen, setIsDrawerOpen] = React.useState(false);
  const openModal = useModalStore((state) => state.openModal);

  const handleNewSession = React.useCallback(() => {
    openModal('createMultiSession');
  }, [openModal]);

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
      >
        <Outlet />
      </AppShell>

      {/* Mobile/Tablet Drawer */}
      <div className="sm:hidden">
        <SideDrawer
          open={isDrawerOpen}
          onClose={() => setIsDrawerOpen(false)}
        >
          <SideTab
            variant="drawer"
            onNavSelect={() => setIsDrawerOpen(false)}
          />
        </SideDrawer>
      </div>
    </>
  );
};

export default MainFlowLayout;

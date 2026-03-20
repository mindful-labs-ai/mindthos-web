import React from 'react';

import { Outlet, useLocation } from 'react-router-dom';

import { Header } from '@/app/router/layouts/Header';
import { MobileHeader } from '@/app/router/layouts/MobileHeader';
import { SideDrawer } from '@/app/router/layouts/SideDrawer';
import { SideTab } from '@/app/router/layouts/SideTab';
import { isChromelessRoute } from '@/app/router/shellConfig';
import { useDevice } from '@/shared/hooks/useDevice';
import { TitleEdit, UploadIcon } from '@/shared/icons';
import { BackButton } from '@/shared/ui/atoms/BackButton';
import { Modal } from '@/shared/ui/composites/Modal';
import { useModalStore } from '@/stores/modalStore';
import { ActionCard } from '@/widgets/home/ActionCard';
import { CreateHandWrittenSessionModal } from '@/widgets/session/CreateHandWrittenSessionModal';

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
  const [isHandWrittenModalOpen, setIsHandWrittenModalOpen] =
    React.useState(false);
  const openModal = useModalStore((state) => state.openModal);
  const closeModal = useModalStore((state) => state.closeModal);
  const isSessionTypeOpen = useModalStore((state) =>
    state.openModals.includes('sessionTypeSelect')
  );

  const handleNewSession = React.useCallback(() => {
    if (isMobileView) {
      openModal('sessionTypeSelect');
    } else {
      openModal('createMultiSession');
    }
  }, [isMobileView, openModal]);

  const openAfterClose = React.useCallback(
    (callback: () => void) => {
      const onPop = () => {
        callback();
        window.removeEventListener('popstate', onPop);
      };
      window.addEventListener('popstate', onPop, { once: true });
      closeModal('sessionTypeSelect');
    },
    [closeModal]
  );

  const handleAudioUpload = () => {
    openAfterClose(() => openModal('createMultiSession'));
  };

  const handleDirectInput = () => {
    openAfterClose(() => setIsHandWrittenModalOpen(true));
  };

  if (chromeless) {
    return (
      <div className="flex h-dvh w-full flex-col overflow-hidden">
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

      {/* Mobile/Tablet: 세션 생성 분기 모달 */}
      {isMobileView && (
        <>
          <Modal
            open={isSessionTypeOpen}
            onOpenChange={() => closeModal('sessionTypeSelect')}
            mobileVariant="fullScreen"
            hideCloseButton
            className="flex flex-col bg-grey-20"
          >
            <div className="flex h-[67px] items-center gap-3 border-b border-border px-4 py-3">
              <BackButton onClick={() => closeModal('sessionTypeSelect')} />
              <p className="text-l font-medium text-grey-80">
                상담 기록 만들기
              </p>
            </div>
            <div className="flex flex-col gap-4 p-6 md:p-12">
              <ActionCard
                icon={<UploadIcon size={24} className="text-green-80" />}
                title="녹음 파일 업로드하기"
                onClick={handleAudioUpload}
              />
              <ActionCard
                icon={<TitleEdit size={32} className="text-grey-70" />}
                title="직접 입력하기"
                onClick={handleDirectInput}
              />
            </div>
          </Modal>

          <CreateHandWrittenSessionModal
            open={isHandWrittenModalOpen}
            onOpenChange={setIsHandWrittenModalOpen}
          />
        </>
      )}
    </>
  );
};

export default MainFlowLayout;

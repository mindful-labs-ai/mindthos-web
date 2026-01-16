import { Outlet } from 'react-router-dom';

import { Header } from '@/router/layouts/Header';
import { SideTab } from '@/router/layouts/SideTab';
import { useDevice } from '@/shared/hooks/useDevice';
import { useViewportHeight } from '@/shared/hooks/useViewportHeight';

const MainFlowLayout = () => {
  const { isMobile } = useDevice();
  const viewportHeight = useViewportHeight();

  // 모바일: 동적 높이 사용, 데스크톱: h-screen 사용
  if (isMobile) {
    return (
      <div
        className="flex w-full flex-col bg-bg-subtle"
        style={{ height: viewportHeight }}
      >
        {/* Page Content - 모바일에서는 SideTab, Header 없이 전체 화면 사용 */}
        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    );
  }

  return (
    <div className="flex h-screen w-full bg-bg-subtle">
      {/* SideTab */}
      <SideTab />

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col">
        {/* Header with BreadCrumb */}
        <Header />

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default MainFlowLayout;

import { Outlet } from 'react-router-dom';

import { Header } from '@/app/router/layouts/Header';
import { SideTab } from '@/app/router/layouts/SideTab';

import { AppShell } from './shells/AppShell';

/**
 * 메인 앱 레이아웃
 * AppShell을 통해 CSS 기반 반응형 레이아웃 적용
 * - Desktop: Sidebar + Header + Content
 * - Mobile: Content only (전체 화면)
 */
const MainFlowLayout = () => (
  <AppShell sidebar={<SideTab />} header={<Header />}>
    <Outlet />
  </AppShell>
);

export default MainFlowLayout;

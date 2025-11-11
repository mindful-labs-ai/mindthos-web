import { Outlet } from 'react-router-dom';

/**
 * 애플리케이션의 루트 레이아웃
 * 모든 페이지에 공통으로 적용되는 레이아웃
 */
const RootLayout = () => {
  return (
    <>
      {/* 공통 헤더, 네비게이션 등이 필요하면 여기에 추가 */}
      <Outlet />
      {/* 공통 푸터 등이 필요하면 여기에 추가 */}
    </>
  );
};

export default RootLayout;

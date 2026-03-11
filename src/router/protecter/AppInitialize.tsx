import { NoneDesktopAlert } from '../../components/NoneDesktopAlert';

/**
 * 앱 초기화 시 실행되는 컴포넌트들을 관리
 * - 모바일 디바이스 알림
 * - 기능 접근 권한은 useFeatureAccess 훅에서 TanStack Query로 자동 관리
 */
export const AppInitialize = () => {
  return (
    <>
      <NoneDesktopAlert />
    </>
  );
};

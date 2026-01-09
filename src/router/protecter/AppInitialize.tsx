import { NoneDesktopAlert } from '../../components/NoneDesktopAlert';

/**
 * 앱 초기화 시 실행되는 컴포넌트들을 관리
 * - 모바일 디바이스 알림
 * - 추후 초기화 로직 추가 시 여기에 추가
 */
export const AppInitialize = () => {
  return (
    <>
      <NoneDesktopAlert />
    </>
  );
};

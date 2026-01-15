import { useEffect } from 'react';

import UpdateNoteModal from '@/components/UpdateNoteModal';
import { useUpdateStore } from '@/stores/updateStore';

/**
 * 인증된 유저에 대해 앱 초기화 시 실행되는 컴포넌트들을 관리
 * - 업데이트 노트 모달
 * - 추후 인증 후 초기화 로직 추가 시 여기에 추가
 */
export const AuthenticatedInitialize = () => {
  const initialize = useUpdateStore((state) => state.initialize);

  useEffect(() => {
    initialize();
  }, [initialize]);

  return (
    <>
      <UpdateNoteModal />
    </>
  );
};

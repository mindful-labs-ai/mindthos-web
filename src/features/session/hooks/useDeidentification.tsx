import { useState } from 'react';

import { DeidentificationModal } from '@/widgets/session/DeidentificationModal';

export function useDeidentification() {
  const [showDeid, setShowDeid] = useState(false);
  const [hasActivatedOnce, setHasActivatedOnce] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  /** 버튼 클릭 시: 첫 실행이면 모달, 이후엔 바로 토글 */
  const handleDeidentify = () => {
    if (!hasActivatedOnce) {
      setIsModalOpen(true);
    } else {
      setShowDeid((prev) => !prev);
    }
  };

  /** 모달에서 확인 클릭 시 */
  const confirmDeidentify = () => {
    setHasActivatedOnce(true);
    setShowDeid(true);
    setIsModalOpen(false);
    // TODO: 비식별화 API 호출 및 크레딧 차감
  };

  /** 훅에서 직접 렌더링할 모달 엘리먼트 */
  const deidModal = (
    <DeidentificationModal
      open={isModalOpen}
      onOpenChange={setIsModalOpen}
      onConfirm={confirmDeidentify}
    />
  );

  return {
    showDeid,
    hasActivatedOnce,
    handleDeidentify,
    deidModal,
  };
}

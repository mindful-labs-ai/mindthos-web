import { useEffect, useState } from 'react';

import { useQueryClient } from '@tanstack/react-query';
import { createPortal } from 'react-dom';
import { useLocation } from 'react-router-dom';

import { ComingSoonModal } from '@/components/common/ComingSoonModal';
import { UpdateNoteModal } from '@/components/UpdateNoteModal';
import { CompleteMissionModal } from '@/feature/onboarding/components/CompleteMissionModal';
import { MissionFloatingButton } from '@/feature/onboarding/components/MissionFloatingButton';
import { QuestMissionModal } from '@/feature/onboarding/components/QuestMissionModal';
import { CreateMultiSessionModal } from '@/feature/session/components/CreateMultiSessionModal';
import { CouponBox } from '@/feature/settings/components/CouponBox';
import { PlanChangeModal } from '@/feature/settings/components/PlanChangeModal';
import { UserEditModal } from '@/feature/settings/components/UserEditModal';
import {
  useCoupons,
  couponQueryKeys,
} from '@/feature/settings/hooks/useCoupons';
import { couponService } from '@/feature/settings/services/couponService';
import { useAuthStore } from '@/stores/authStore';
import { useModalStore } from '@/stores/modalStore';
import { useQuestStore } from '@/stores/questStore';
import { useUpdateStore } from '@/stores/updateStore';

/**
 * 전역 모달 컨테이너
 * 모든 모달을 Portal을 통해 document.body에 렌더링하여
 * DOM 계층과 독립적으로 관리
 * */
export const GlobalModalContainer = () => {
  const { currentLevel, completeNextStep } = useQuestStore();
  const user = useAuthStore((state) => state.user);
  const location = useLocation();
  const isGenogramRoute = location.pathname.includes('/genogram');

  // 업데이트 노트 초기화
  const initializeUpdate = useUpdateStore((state) => state.initialize);
  useEffect(() => {
    initializeUpdate();
  }, [initializeUpdate]);

  // 모달 스토어에서 상태와 액션 가져오기
  const openModal = useModalStore((state) => state.openModal);
  const closeModal = useModalStore((state) => state.closeModal);
  const isUserEditOpen = useModalStore((state) =>
    state.openModals.includes('userEdit')
  );
  const isPlanChangeOpen = useModalStore((state) =>
    state.openModals.includes('planChange')
  );
  const isCreateMultiSessionOpen = useModalStore((state) =>
    state.openModals.includes('createMultiSession')
  );
  const isComingSoonOpen = useModalStore((state) =>
    state.openModals.includes('comingSoon')
  );
  const comingSoonData = useModalStore(
    (state) => state.modalData.comingSoon as { source: string } | undefined
  );
  const isCouponModalOpen = useModalStore((state) =>
    state.openModals.includes('couponModal')
  );

  // 쿠폰 데이터 (모달에서는 planType 없이 전체 조회)
  const { coupons, isLoading: isCouponsLoading } = useCoupons();
  const queryClient = useQueryClient();
  const [registerError, setRegisterError] = useState<string | null>(null);
  const [isRegistering, setIsRegistering] = useState(false);

  const handleRegisterCoupon = async (code: string): Promise<boolean> => {
    setRegisterError(null);
    setIsRegistering(true);
    try {
      await couponService.register(code);
      await queryClient.invalidateQueries({ queryKey: couponQueryKeys.all });
      return true;
    } catch (error: unknown) {
      setRegisterError(
        (error as { message?: string })?.message ?? '쿠폰 등록에 실패했습니다.'
      );
      return false;
    } finally {
      setIsRegistering(false);
    }
  };

  const handleOpenUserEdit = () => {
    openModal('userEdit');
  };

  const handleCloseUserEdit = (open: boolean) => {
    if (!open) {
      closeModal('userEdit');
    }
  };

  const handleClosePlanChange = (open: boolean) => {
    if (!open) {
      closeModal('planChange');
    }
  };

  const handleCloseCreateMultiSession = (open: boolean) => {
    if (!open) {
      closeModal('createMultiSession');
    }
  };

  const handleCloseComingSoon = (open: boolean) => {
    if (!open) {
      closeModal('comingSoon');
    }
  };

  const handleCloseCouponModal = (open: boolean) => {
    if (!open) {
      closeModal('couponModal');
    }
  };

  const handleUserEditSuccess = async () => {
    // 내 정보 입력 미션(Level 5)인 경우 퀘스트 완료 처리
    if (currentLevel === 5 && user?.email) {
      await completeNextStep(user.email);
    }
  };

  // Portal을 사용하여 body에 직접 렌더링
  return createPortal(
    <>
      {/* 업데이트 노트 모달 */}
      <UpdateNoteModal />

      {/* 온보딩 관련 모달 */}
      <QuestMissionModal />
      <CompleteMissionModal onOpenUserEdit={handleOpenUserEdit} />

      {/* 플로팅 버튼 (모달은 아니지만 전역 UI) - genogram 라우트에서는 숨김 */}
      {!isGenogramRoute && (
        <MissionFloatingButton onOpenUserEdit={handleOpenUserEdit} />
      )}

      {/* 사용자 정보 수정 모달 */}
      <UserEditModal
        open={isUserEditOpen}
        onOpenChange={handleCloseUserEdit}
        onSuccess={handleUserEditSuccess}
      />

      {/* 플랜 변경 모달 */}
      <PlanChangeModal
        open={isPlanChangeOpen}
        onOpenChange={handleClosePlanChange}
      />

      {/* 다중 세션 생성 모달 */}
      <CreateMultiSessionModal
        open={isCreateMultiSessionOpen}
        onOpenChange={handleCloseCreateMultiSession}
      />

      {/* 출시 예정 모달 */}
      <ComingSoonModal
        open={isComingSoonOpen}
        onOpenChange={handleCloseComingSoon}
        source={comingSoonData?.source}
      />

      {/* 쿠폰함 모달 */}
      <CouponBox
        variant="modal"
        open={isCouponModalOpen}
        onOpenChange={handleCloseCouponModal}
        coupons={coupons}
        isLoading={isCouponsLoading}
        onRegister={handleRegisterCoupon}
        registerError={registerError}
        isRegistering={isRegistering}
      />
    </>,
    document.body
  );
};

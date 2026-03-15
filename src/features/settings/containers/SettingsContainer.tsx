import React from 'react';

import { useQueryClient } from '@tanstack/react-query';
import { createSearchParams } from 'react-router-dom';

import { ROUTES, TERMS_TYPES } from '@/app/router/constants';
import { useCardInfo } from '@/features/settings/hooks/useCardInfo';
import { useCreditInfo } from '@/features/settings/hooks/useCreditInfo';
import {
  calculateDaysUntilReset,
  formatRenewalDate,
  getPlanLabel,
} from '@/features/settings/utils/planUtils';
import { trackError, trackEvent } from '@/lib/mixpanel';
import { authService } from '@/shared/api/services/auth/authService';
import { billingService } from '@/shared/api/supabase/billingQueries';
import { useToast } from '@/shared/ui/composites/Toast';
import { useAuthStore } from '@/stores/authStore';
import { useModalStore } from '@/stores/modalStore';

import { SettingsView } from './SettingsView';

export const SettingsContainer: React.FC = () => {
  const user = useAuthStore((state) => state.user);
  const userName = useAuthStore((state) => state.userName);
  const organization = useAuthStore((state) => state.organization);
  const logout = useAuthStore((state) => state.logout);
  const userId = useAuthStore((state) => state.userId);

  const { creditInfo } = useCreditInfo();
  const { cardInfo } = useCardInfo();

  const [isCancelModalOpen, setIsCancelModalOpen] = React.useState(false);
  const [isLogoutModalOpen, setIsLogoutModalOpen] = React.useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = React.useState(false);
  const [isCreditUsageModalOpen, setIsCreditUsageModalOpen] =
    React.useState(false);
  const openModal = useModalStore((state) => state.openModal);
  const [isDeleting, setIsDeleting] = React.useState(false);
  const [deleteError, setDeleteError] = React.useState('');
  const [isCardModalOpen, setIsCardModalOpen] = React.useState(false);
  const [isRenewalModalOpen, setIsRenewalModalOpen] = React.useState(false);
  const [view, setView] = React.useState<
    'settings' | 'noticeList' | 'noticeDetail'
  >('settings');
  const [selectedNoticeId, setSelectedNoticeId] = React.useState<string | null>(
    null
  );

  const queryClient = useQueryClient();
  const { toast } = useToast();

  const isPaidPlan =
    creditInfo && creditInfo.plan.type.toLowerCase() !== 'free';
  const hasCancellationScheduled =
    creditInfo?.subscription?.scheduled_plan_id != null;
  const isOAuthUser = user?.app_metadata?.provider !== 'email';

  const scrollToTop = () => document.querySelector('main')?.scrollTo(0, 0);

  const handleOpenNoticeList = () => {
    trackEvent('notice_list_view');
    setSelectedNoticeId(null);
    setView('noticeList');
    scrollToTop();
  };

  const handleSelectNotice = (noticeId: string) => {
    trackEvent('notice_detail_view', { notice_id: noticeId });
    setSelectedNoticeId(noticeId);
    setView('noticeDetail');
    scrollToTop();
  };

  const handleBackToList = () => {
    setSelectedNoticeId(null);
    setView('noticeList');
    scrollToTop();
  };

  const handleEditInfo = () => {
    openModal('userEdit');
  };

  const handleOpenCardRegistration = () => {
    if (!user?.id) {
      toast({
        title: '사용자 정보 오류',
        description: '다시 로그인 후 시도해주세요.',
      });
      return;
    }
    setIsCardModalOpen(true);
  };

  const handleCardRegistrationClose = () => {
    setIsCardModalOpen(false);
  };

  const handleCardRegistrationSuccess = async () => {
    await queryClient.invalidateQueries({ queryKey: ['cardInfo', userId] });
    setIsCardModalOpen(false);
  };

  const handleCreditUsageLog = () => {
    setIsCreditUsageModalOpen(true);
  };

  const handleUpgradePlan = () => {
    openModal('planChange');
  };

  const handleCancelSubscription = () => {
    setIsCancelModalOpen(true);
  };

  const handleConfirmCancelSubscription = async () => {
    trackEvent('subscription_cancel', {
      plan_type: creditInfo?.plan?.type,
    });
    await billingService.cancelSubscription();

    if (userId) {
      const userIdNumber = parseInt(userId);
      if (!isNaN(userIdNumber)) {
        await queryClient.invalidateQueries({
          queryKey: ['credit', 'subscription', userIdNumber],
        });
      }
    }

    toast({
      title: '구독 해지 예약',
      description: '구독 종료 후 무료 플랜으로 전환됩니다.',
    });
  };

  const handleUndoCancellation = async () => {
    try {
      await billingService.undoCancellation();

      if (userId) {
        const userIdNumber = parseInt(userId);
        if (!isNaN(userIdNumber)) {
          await queryClient.invalidateQueries({
            queryKey: ['credit', 'subscription', userIdNumber],
          });
        }
      }

      toast({
        title: '해지 예약 취소',
        description: '구독이 계속 유지됩니다.',
      });
    } catch (error) {
      trackError('cancel_subscription_revert_error', error);
      toast({
        title: '해지 예약 취소 실패',
        description: '다시 시도해주세요.',
      });
    }
  };

  const handleGuide = () => {
    window.open(
      'https://rare-puppy-06f.notion.site/v2-2cfdd162832d801bae95f67269c062c7?source=copy_link',
      '_blank',
      'noopener,noreferrer'
    );
  };

  const termsTo = {
    pathname: ROUTES.TERMS,
    search: `?${createSearchParams({ type: TERMS_TYPES.SERVICE })}`,
  };

  const handleLogoutClick = () => {
    setIsLogoutModalOpen(true);
  };

  const handleConfirmLogout = async () => {
    try {
      trackEvent('logout');
      await logout();
    } catch (error) {
      trackError('logout_error', error);
    }
  };

  const handleDeleteAccount = () => {
    setIsDeleteModalOpen(true);
    setDeleteError('');
  };

  const handleConfirmDelete = async () => {
    if (!user?.email) {
      setDeleteError('사용자 정보를 찾을 수 없습니다.');
      return;
    }

    setIsDeleting(true);
    setDeleteError('');

    try {
      trackEvent('account_delete');
      await authService.deleteAccount(user.email);
      await logout();
    } catch (error) {
      trackError('account_delete_error', error);
      setDeleteError('계정 탈퇴에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleOpenCouponModal = () => {
    openModal('couponModal');
  };

  return (
    <SettingsView
      view={view}
      selectedNoticeId={selectedNoticeId}
      userName={userName}
      userEmail={user?.email}
      organization={organization}
      creditInfo={creditInfo}
      cardInfo={cardInfo}
      isPaidPlan={isPaidPlan}
      hasCancellationScheduled={hasCancellationScheduled}
      isOAuthUser={isOAuthUser}
      isCancelModalOpen={isCancelModalOpen}
      isLogoutModalOpen={isLogoutModalOpen}
      isDeleteModalOpen={isDeleteModalOpen}
      isCreditUsageModalOpen={isCreditUsageModalOpen}
      isCardModalOpen={isCardModalOpen}
      isRenewalModalOpen={isRenewalModalOpen}
      isDeleting={isDeleting}
      deleteError={deleteError}
      customerKey={user?.id ? String(user.id) : ''}
      termsTo={termsTo}
      onSetCancelModalOpen={setIsCancelModalOpen}
      onSetLogoutModalOpen={setIsLogoutModalOpen}
      onSetDeleteModalOpen={setIsDeleteModalOpen}
      onSetCreditUsageModalOpen={setIsCreditUsageModalOpen}
      onSetRenewalModalOpen={setIsRenewalModalOpen}
      onEditInfo={handleEditInfo}
      onOpenCardRegistration={handleOpenCardRegistration}
      onCardRegistrationClose={handleCardRegistrationClose}
      onCardRegistrationSuccess={handleCardRegistrationSuccess}
      onCreditUsageLog={handleCreditUsageLog}
      onUpgradePlan={handleUpgradePlan}
      onCancelSubscription={handleCancelSubscription}
      onConfirmCancelSubscription={handleConfirmCancelSubscription}
      onUndoCancellation={handleUndoCancellation}
      onGuide={handleGuide}
      onOpenNoticeList={handleOpenNoticeList}
      onSelectNotice={handleSelectNotice}
      onBackToList={handleBackToList}
      onLogoutClick={handleLogoutClick}
      onConfirmLogout={handleConfirmLogout}
      onDeleteAccount={handleDeleteAccount}
      onConfirmDelete={handleConfirmDelete}
      onOpenCouponModal={handleOpenCouponModal}
      getPlanLabel={getPlanLabel}
      formatRenewalDate={formatRenewalDate}
      calculateDaysUntilReset={calculateDaysUntilReset}
    />
  );
};

export default SettingsContainer;

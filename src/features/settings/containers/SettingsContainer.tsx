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
import { CouponIcon, MailIcon, MapPinIcon, UserIcon } from '@/shared/icons';
import { Button } from '@/shared/ui/atoms/Button';
import { Text } from '@/shared/ui/atoms/Text';
import { Title } from '@/shared/ui/atoms/Title';
import { Card } from '@/shared/ui/composites/Card';
import { useToast } from '@/shared/ui/composites/Toast';
import { WelcomeBanner } from '@/shared/ui/composites/WelcomeBanner';
import { useAuthStore } from '@/stores/authStore';
import { useModalStore } from '@/stores/modalStore';
import { CardRegistrationModal } from '@/widgets/payment/CardRegistrationModal';
import { CancelSubscriptionModal } from '@/widgets/settings/CancelSubscriptionModal';
import { CardInfo } from '@/widgets/settings/CardInfo';
import { CreditDisplay } from '@/widgets/settings/CreditDisplay';
import { CreditRenewalModal } from '@/widgets/settings/CreditRenewalModal';
import { CreditUsageInfo } from '@/widgets/settings/CreditUsageInfo';
import { CreditUsageModal } from '@/widgets/settings/CreditUsageModal';
import { DeleteAccountModal } from '@/widgets/settings/DeleteAccountModal';
import { LogoutModal } from '@/widgets/settings/LogoutModal';
import { NoticeDetail } from '@/widgets/settings/NoticeDetail';
import { NoticeList } from '@/widgets/settings/NoticeList';

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

  // --- Widget slots ---

  const noticeContent =
    view === 'noticeList' ? (
      <NoticeList onSelectNotice={handleSelectNotice} />
    ) : view === 'noticeDetail' && selectedNoticeId ? (
      <NoticeDetail noticeId={selectedNoticeId} onBack={handleBackToList} />
    ) : null;

  const userInfoContent = (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <UserIcon size={20} className="text-fg-muted" />
        <Text className="text-lg font-semibold">
          {userName || '이름 없음'}
        </Text>
      </div>
      <div className="flex items-center gap-3">
        <MailIcon size={20} className="text-fg-muted" />
        <Text className="text-lg font-semibold">
          {user?.email || '이메일 없음'}
        </Text>
      </div>
      <div className="flex items-center gap-3">
        <MapPinIcon size={20} className="text-fg-muted" />
        <Text className="text-lg font-semibold">
          {organization || '소속 기관 없음'}
        </Text>
      </div>{' '}
    </div>
  );

  const cardInfoSection = (
    <CardInfo
      cardType={cardInfo?.type}
      cardNumber={cardInfo?.number}
      company={cardInfo?.company}
      onAdd={handleOpenCardRegistration}
    />
  );

  const usageInfoCard = (
    <Card>
      <Card.Body className="p-6">
        <div className="flex items-center justify-between">
          <Title as="h2" className="text-lg font-semibold text-fg-muted">
            사용 정보
          </Title>
          <div className="flex gap-4">
            <Button
              variant="outline"
              tone="neutral"
              size="sm"
              onClick={handleOpenCouponModal}
              className="text-fg-muted"
            >
              <span className="flex items-center gap-0.5 text-center">
                <CouponIcon />
                보유 중인 쿠폰
              </span>
            </Button>
            <Button
              variant="outline"
              tone="neutral"
              size="sm"
              onClick={handleCreditUsageLog}
              className="text-fg-muted"
            >
              크레딧 사용 내역
            </Button>
          </div>
        </div>

        <div className="flex flex-col space-y-3">
          {creditInfo && (
            <>
              {creditInfo.plan.type.toLowerCase() === 'free' ? (
                <Text className="text-left text-base">
                  <span className="font-bold text-primary">
                    {getPlanLabel(creditInfo.plan.type)}
                  </span>{' '}
                  이용 중
                </Text>
              ) : (
                <div className="space-y-2">
                  <Text className="flex gap-3 text-left font-semibold">
                    <span className="font-bold text-primary">
                      {getPlanLabel(creditInfo.plan.type)}
                    </span>
                    {hasCancellationScheduled ? (
                      <span className="text-danger">
                        {formatRenewalDate(creditInfo.subscription.end_at)}{' '}
                        해지 예정
                      </span>
                    ) : (
                      <>
                        {formatRenewalDate(creditInfo.subscription.end_at)}{' '}
                        갱신 예정
                      </>
                    )}
                  </Text>
                </div>
              )}

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  tone="primary"
                  size="sm"
                  className="w-32"
                  onClick={handleUpgradePlan}
                >
                  {isPaidPlan ? '플랜 변경하기' : '플랜 업그레이드'}
                </Button>
                {isPaidPlan && !hasCancellationScheduled && (
                  <Button
                    variant="ghost"
                    tone="neutral"
                    size="sm"
                    onClick={handleCancelSubscription}
                    className="text-fg-muted hover:text-danger"
                  >
                    구독 해지
                  </Button>
                )}
                {hasCancellationScheduled && (
                  <Button
                    variant="outline"
                    tone="neutral"
                    size="sm"
                    onClick={handleUndoCancellation}
                  >
                    해지 예약 취소
                  </Button>
                )}
              </div>

              <div className="flex w-full justify-center gap-6 px-8">
                <div className="flex flex-1 items-center justify-center">
                  <CreditDisplay
                    totalCredit={creditInfo.plan.total}
                    usedCredit={creditInfo.plan.used}
                    planLabel={getPlanLabel(creditInfo.plan.type)}
                    planType={creditInfo.plan.type}
                    daysUntilReset={calculateDaysUntilReset(
                      creditInfo.subscription.end_at
                    )}
                    variant="detailed"
                    onRenewal={
                      isPaidPlan
                        ? () => setIsRenewalModalOpen(true)
                        : undefined
                    }
                  />
                </div>
                <div className="flex-1">
                  <CreditUsageInfo
                    remainingCredit={creditInfo.plan.remaining}
                  />
                </div>
              </div>
            </>
          )}
        </div>
      </Card.Body>
    </Card>
  );

  const welcomeBanner = (
    <WelcomeBanner
      title="마음토스 시작하기"
      description="아직 마음토스 사용법이 어렵다면, 가이드를 확인해보세요."
      buttonText="더 알아보기"
      onButtonClick={handleGuide}
      className="text-left"
    />
  );

  const cancelModal =
    creditInfo && isPaidPlan ? (
      <CancelSubscriptionModal
        open={isCancelModalOpen}
        onOpenChange={setIsCancelModalOpen}
        currentPlanType={creditInfo.plan.type}
        currentPlanCredit={creditInfo.plan.total}
        effectiveAt={creditInfo.subscription.end_at}
        onConfirm={handleConfirmCancelSubscription}
      />
    ) : null;

  const logoutModal = (
    <LogoutModal
      open={isLogoutModalOpen}
      onOpenChange={setIsLogoutModalOpen}
      onConfirm={handleConfirmLogout}
    />
  );

  const deleteModal = (
    <DeleteAccountModal
      open={isDeleteModalOpen}
      onOpenChange={setIsDeleteModalOpen}
      onConfirm={handleConfirmDelete}
      isDeleting={isDeleting}
      error={deleteError}
    />
  );

  const cardRegistrationModal = (
    <CardRegistrationModal
      isOpen={isCardModalOpen}
      onClose={handleCardRegistrationClose}
      customerKey={user?.id ? String(user.id) : ''}
      onSuccess={handleCardRegistrationSuccess}
    />
  );

  const creditUsageModal = (
    <CreditUsageModal
      open={isCreditUsageModalOpen}
      onOpenChange={setIsCreditUsageModalOpen}
    />
  );

  const creditRenewalModal = (
    <CreditRenewalModal
      open={isRenewalModalOpen}
      onOpenChange={setIsRenewalModalOpen}
    />
  );

  return (
    <SettingsView
      view={view}
      termsTo={termsTo}
      isOAuthUser={isOAuthUser}
      onOpenNoticeList={handleOpenNoticeList}
      onLogoutClick={handleLogoutClick}
      onDeleteAccount={handleDeleteAccount}
      onEditInfo={handleEditInfo}
      noticeContent={noticeContent}
      userInfoContent={userInfoContent}
      cardInfoSection={cardInfoSection}
      usageInfoCard={usageInfoCard}
      welcomeBanner={welcomeBanner}
      cancelModal={cancelModal}
      logoutModal={logoutModal}
      deleteModal={deleteModal}
      cardRegistrationModal={cardRegistrationModal}
      creditUsageModal={creditUsageModal}
      creditRenewalModal={creditRenewalModal}
    />
  );
};

export default SettingsContainer;

import React from 'react';

import { useQueryClient } from '@tanstack/react-query';
import { Link, createSearchParams } from 'react-router-dom';

import { Button } from '@/components/ui/atoms/Button';
import { Text } from '@/components/ui/atoms/Text';
import { Title } from '@/components/ui/atoms/Title';
import { Card } from '@/components/ui/composites/Card';
import { useToast } from '@/components/ui/composites/Toast';
import { WelcomeBanner } from '@/components/ui/composites/WelcomeBanner';
import { CardRegistrationModal } from '@/feature/payment/components/CardRegistrationModal';
import { billingService } from '@/feature/payment/services/billingService';
import { CancelSubscriptionModal } from '@/feature/settings/components/CancelSubscriptionModal';
import { CreditDisplay } from '@/feature/settings/components/CreditDisplay';
import { CreditUsageInfo } from '@/feature/settings/components/CreditUsageInfo';
import { CreditUsageModal } from '@/feature/settings/components/CreditUsageModal';
import { DeleteAccountModal } from '@/feature/settings/components/DeleteAccountModal';
import { LogoutModal } from '@/feature/settings/components/LogoutModal';
import { useCardInfo } from '@/feature/settings/hooks/useCardInfo';
import { useCreditInfo } from '@/feature/settings/hooks/useCreditInfo';
import {
  calculateDaysUntilReset,
  formatRenewalDate,
  getPlanLabel,
} from '@/feature/settings/utils/planUtils';
import { trackError, trackEvent } from '@/lib/mixpanel';
import { ROUTES, TERMS_TYPES } from '@/router/constants';
import { authService } from '@/services/auth/authService';
import { CouponIcon, MailIcon, MapPinIcon, UserIcon } from '@/shared/icons';
import { useAuthStore } from '@/stores/authStore';
import { useModalStore } from '@/stores/modalStore';

import { CardInfo } from '../components/CardInfo';
import { CreditRenewalModal } from '../components/CreditRenewalModal';

export const SettingsPage: React.FC = () => {
  const user = useAuthStore((state) => state.user);
  const userName = useAuthStore((state) => state.userName);
  const organization = useAuthStore((state) => state.organization);
  const logout = useAuthStore((state) => state.logout);

  // 크레딧 정보 가져오기
  const { creditInfo } = useCreditInfo();

  // 카드 정보 가져오기
  const { cardInfo } = useCardInfo();

  const [isCancelModalOpen, setIsCancelModalOpen] = React.useState(false);
  const [isLogoutModalOpen, setIsLogoutModalOpen] = React.useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = React.useState(false);
  const [isCreditUsageModalOpen, setIsCreditUsageModalOpen] =
    React.useState(false);
  // 전역 모달 스토어 사용
  const openModal = useModalStore((state) => state.openModal);
  const [isDeleting, setIsDeleting] = React.useState(false);
  const [deleteError, setDeleteError] = React.useState('');
  const [isCardModalOpen, setIsCardModalOpen] = React.useState(false);
  const [isRenewalModalOpen, setIsRenewalModalOpen] = React.useState(false);

  const queryClient = useQueryClient();
  const { toast } = useToast();
  const userId = useAuthStore((state) => state.userId);

  // 현재 플랜이 유료인지 확인
  const isPaidPlan =
    creditInfo && creditInfo.plan.type.toLowerCase() !== 'free';
  // 해지 예약 여부 확인
  const hasCancellationScheduled =
    creditInfo?.subscription?.scheduled_plan_id != null;

  // OAuth 로그인 여부 확인 (이메일 로그인이 아닌 경우)
  const isOAuthUser = user?.app_metadata?.provider !== 'email';

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

    // 구독 정보 다시 조회
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

      // 구독 정보 다시 조회
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

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-[1332px] flex-col px-16 py-[42px]">
      <div>
        <Title as="h1" className="text-left text-2xl font-bold">
          서비스 설정
        </Title>
      </div>

      <div className="flex-1 space-y-6 py-[42px]">
        <Card>
          <Card.Body className="space-y-4 p-6">
            <div className="flex items-center justify-between">
              <Title as="h2" className="text-lg font-semibold text-fg-muted">
                상담사 정보
              </Title>
              <Button
                variant="outline"
                tone="neutral"
                size="sm"
                onClick={handleEditInfo}
                className="text-fg-muted"
              >
                정보 수정
              </Button>
            </div>

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
              </div>
            </div>
          </Card.Body>
        </Card>

        <CardInfo
          cardType={cardInfo?.type}
          cardNumber={cardInfo?.number}
          company={cardInfo?.company}
          onAdd={handleOpenCardRegistration}
        />

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
                  onClick={() => openModal('couponModal')}
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

        <WelcomeBanner
          title="마음토스 시작하기"
          description="아직 마음토스 사용법이 어렵다면, 가이드를 확인해보세요."
          buttonText="더 알아보기"
          onButtonClick={handleGuide}
          className="text-left"
        />
      </div>

      <div className="border-t border-border px-8 py-6">
        <div className="flex items-center justify-center gap-4 text-sm">
          <Link
            to={termsTo}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center rounded-md px-3 py-1.5 text-sm font-medium text-muted transition-colors hover:text-fg"
          >
            서비스 약관
          </Link>
          <span className="text-border">|</span>
          <Button
            size="sm"
            variant="ghost"
            onClick={handleLogoutClick}
            className="text-muted transition-colors hover:text-fg"
          >
            로그아웃
          </Button>
          {!isOAuthUser && (
            <>
              <span className="text-border">|</span>
              <Button
                size="sm"
                variant="ghost"
                onClick={handleDeleteAccount}
                className="text-fg-muted transition-colors hover:text-danger"
              >
                계정 탈퇴
              </Button>
            </>
          )}
        </div>
      </div>

      {creditInfo && isPaidPlan && (
        <CancelSubscriptionModal
          open={isCancelModalOpen}
          onOpenChange={setIsCancelModalOpen}
          currentPlanType={creditInfo.plan.type}
          currentPlanCredit={creditInfo.plan.total}
          effectiveAt={creditInfo.subscription.end_at}
          onConfirm={handleConfirmCancelSubscription}
        />
      )}

      <LogoutModal
        open={isLogoutModalOpen}
        onOpenChange={setIsLogoutModalOpen}
        onConfirm={handleConfirmLogout}
      />

      <DeleteAccountModal
        open={isDeleteModalOpen}
        onOpenChange={setIsDeleteModalOpen}
        onConfirm={handleConfirmDelete}
        isDeleting={isDeleting}
        error={deleteError}
      />

      <CardRegistrationModal
        isOpen={isCardModalOpen}
        onClose={handleCardRegistrationClose}
        customerKey={user?.id ? String(user.id) : ''}
        onSuccess={handleCardRegistrationSuccess}
      />
      <CreditUsageModal
        open={isCreditUsageModalOpen}
        onOpenChange={setIsCreditUsageModalOpen}
      />
      <CreditRenewalModal
        open={isRenewalModalOpen}
        onOpenChange={setIsRenewalModalOpen}
      />
    </div>
  );
};

export default SettingsPage;

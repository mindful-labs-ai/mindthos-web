import React from 'react';

import { useQueryClient } from '@tanstack/react-query';
import { Link, createSearchParams } from 'react-router-dom';

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
import { BADGE_ICON_MAP } from '@/shared/constants/badgeIcons';
import { GUIDE_URL } from '@/shared/constants/externalUrls';
import {
  MixpanelError,
  MixpanelEvent,
} from '@/shared/constants/mixpanelEvents';
import { cardQueryKeys, creditQueryKeys } from '@/shared/constants/queryKeys';
import { useDevice } from '@/shared/hooks/useDevice';
import {
  useUserAccesses,
  type UserAccess,
} from '@/shared/hooks/useFeatureAccess';
import {
  ChevronRightIcon,
  CouponIcon,
  SettingPageEmailIcon,
  SettingPageLocationIcon,
  SettingPageNameIcon,
} from '@/shared/icons';
import { Button } from '@/shared/ui/atoms/Button';
import { Text } from '@/shared/ui/atoms/Text';
import { Title } from '@/shared/ui/atoms/Title';
import { Modal } from '@/shared/ui/composites/Modal';
import { useToast } from '@/shared/ui/composites/Toast';
import { WelcomeBanner } from '@/shared/ui/composites/WelcomeBanner';
import { useAuthStore } from '@/stores/authStore';
import { useModalStore } from '@/stores/modalStore';
import { CardRegistrationModal } from '@/widgets/payment/CardRegistrationModal';
import { BadgeDetailModal } from '@/widgets/settings/BadgeDetailModal';
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
  const { isMobile, isTablet } = useDevice();
  const isMobileView = isMobile || isTablet;
  const user = useAuthStore((state) => state.user);
  const userName = useAuthStore((state) => state.userName);
  const organization = useAuthStore((state) => state.organization);
  const logout = useAuthStore((state) => state.logout);
  const userId = useAuthStore((state) => state.userId);

  const { creditInfo } = useCreditInfo();
  const { cardInfo } = useCardInfo();
  const { accesses: badges } = useUserAccesses();
  const [selectedBadge, setSelectedBadge] = React.useState<UserAccess | null>(
    null
  );

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

  const scrollToTop = () => document.querySelector('main')?.scrollTo(0, 0);

  const handleOpenNoticeList = () => {
    trackEvent(MixpanelEvent.NoticeListView);
    trackEvent(MixpanelEvent.SettingsSectionChange, { section: 'noticeList' });
    setSelectedNoticeId(null);
    setView('noticeList');
    scrollToTop();
  };

  const handleSelectNotice = (noticeId: string) => {
    trackEvent(MixpanelEvent.NoticeDetailView, { notice_id: noticeId });
    trackEvent(MixpanelEvent.SettingsSectionChange, {
      section: 'noticeDetail',
    });
    setSelectedNoticeId(noticeId);
    setView('noticeDetail');
    scrollToTop();
  };

  const handleBackToList = () => {
    trackEvent(MixpanelEvent.SettingsSectionChange, { section: 'noticeList' });
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
        description: '다시 로그인 후 시도해 주세요.',
      });
      return;
    }
    setIsCardModalOpen(true);
  };

  const handleCardRegistrationClose = () => {
    setIsCardModalOpen(false);
  };

  const handleCardRegistrationSuccess = async () => {
    await queryClient.invalidateQueries({
      queryKey: cardQueryKeys.info(userId!),
    });
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
    trackEvent(MixpanelEvent.SubscriptionCancel, {
      plan_type: creditInfo?.plan?.type,
    });
    await billingService.cancelSubscription();

    if (userId) {
      const userIdNumber = parseInt(userId);
      if (!isNaN(userIdNumber)) {
        await queryClient.invalidateQueries({
          queryKey: creditQueryKeys.summary(userIdNumber),
        });
      }
    }

    toast({
      title: '구독 해지 예약',
      description: '구독 종료 후 무료 플랜으로 전환돼요.',
    });
  };

  const handleUndoCancellation = async () => {
    try {
      await billingService.undoCancellation();

      if (userId) {
        const userIdNumber = parseInt(userId);
        if (!isNaN(userIdNumber)) {
          await queryClient.invalidateQueries({
            queryKey: creditQueryKeys.summary(userIdNumber),
          });
        }
      }

      toast({
        title: '해지 예약 취소',
        description: '구독이 계속 유지돼요.',
      });
    } catch (error) {
      trackError(MixpanelError.CancelSubscriptionRevertError, error);
      toast({
        title: '해지 예약 취소 실패',
        description: '잠시 후 다시 시도해 주세요.',
      });
    }
  };

  const handleGuide = () => {
    window.open(GUIDE_URL, '_blank', 'noopener,noreferrer');
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
      trackEvent(MixpanelEvent.Logout);
      await logout();
    } catch (error) {
      trackError(MixpanelError.LogoutError, error);
    }
  };

  const handleDeleteAccount = () => {
    setIsDeleteModalOpen(true);
    setDeleteError('');
  };

  const handleConfirmDelete = async () => {
    if (!user?.email) {
      setDeleteError('사용자 정보를 찾을 수 없어요.');
      return;
    }

    setIsDeleting(true);
    setDeleteError('');

    try {
      trackEvent(MixpanelEvent.AccountDelete);
      await authService.deleteAccount(user.email);
      await logout();
    } catch (error) {
      trackError(MixpanelError.AccountDeleteError, error);
      setDeleteError('계정을 탈퇴하지 못했어요. 잠시 후 다시 시도해 주세요.');
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
    <div className="flex items-end justify-between">
      <div className="space-y-3">
        <div className="flex items-center gap-3">
          <SettingPageNameIcon
            size={isMobile ? 16 : 20}
            className="text-grey-70"
          />
          <Text className="text-m font-emphasize md:text-xl">
            {userName || '이름 없음'}
          </Text>
        </div>
        <div className="flex items-center gap-3">
          <SettingPageEmailIcon
            size={isMobile ? 16 : 20}
            className="text-grey-70"
          />
          <Text className="text-m font-emphasize md:text-xl">
            {user?.email || '이메일 없음'}
          </Text>
        </div>
        <div className="flex items-center gap-3">
          <SettingPageLocationIcon
            size={isMobile ? 16 : 20}
            className="text-grey-70"
          />
          <Text className="text-m font-emphasize md:text-xl">
            {organization || '소속 기관 없음'}
          </Text>
        </div>
      </div>

      {badges.length > 0 && (
        <div className="flex gap-2">
          {badges.map((badge) => {
            const Icon = BADGE_ICON_MAP[badge.type];
            if (!Icon) return null;
            return (
              <button
                key={badge.id}
                type="button"
                onClick={() => setSelectedBadge(badge)}
                className="transition-transform lg:hover:scale-105"
                aria-label={`${badge.name} 뱃지 상세 보기`}
              >
                <Icon size={isMobile ? 48 : 60} />
              </button>
            );
          })}
        </div>
      )}
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

  const [isUsageMenuOpen, setIsUsageMenuOpen] = React.useState(false);

  // 공통: 플랜 정보 + 크레딧
  const usageContent = creditInfo && (
    <>
      {creditInfo.plan.type.toLowerCase() === 'free' ? (
        <Text className="typo-m text-left">
          <span className="font-headline text-primary">
            {getPlanLabel(creditInfo.plan.type)}
          </span>{' '}
          이용 중
        </Text>
      ) : (
        <div className="space-y-2">
          <Text className="flex gap-3 text-left font-emphasize">
            <span className="font-headline text-primary">
              {getPlanLabel(creditInfo.plan.type)}
            </span>
            {hasCancellationScheduled ? (
              <span className="text-danger">
                {formatRenewalDate(creditInfo.subscription.end_at)} 해지 예정
              </span>
            ) : (
              <>{formatRenewalDate(creditInfo.subscription.end_at)} 갱신 예정</>
            )}
          </Text>
        </div>
      )}

      <div className="mb-2 flex gap-4">
        <Button
          variant="outline"
          tone="primary"
          size="sm"
          className="w-32"
          onClick={handleUpgradePlan}
        >
          {isPaidPlan ? '플랜 관리' : '플랜 변경'}
        </Button>
        {isPaidPlan && !hasCancellationScheduled && (
          <Button
            variant="ghost"
            tone="neutral"
            size="sm"
            onClick={handleCancelSubscription}
            className="text-fg-muted lg:hover:text-danger"
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

      <div
        className={
          isMobileView
            ? 'flex flex-col gap-4'
            : 'flex w-full justify-center gap-6 overflow-x-clip px-8'
        }
      >
        <div
          className={
            isMobileView ? '' : 'flex flex-1 items-center justify-center'
          }
        >
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
              isPaidPlan ? () => setIsRenewalModalOpen(true) : undefined
            }
          />
        </div>
        <div className={isMobileView ? '' : 'flex-1'}>
          <CreditUsageInfo remainingCredit={creditInfo.plan.remaining} />
        </div>
      </div>
    </>
  );

  const usageInfoCard = isMobileView ? (
    <div className="bg-white p-4 md:rounded-xl md:border md:border-grey-30 md:p-6">
      <div className="mb-2 flex items-center justify-between">
        <p className="text-m font-emphasize text-grey-70 md:text-l">
          사용 정보
        </p>
        {isMobile ? (
          <>
            <button
              type="button"
              className="rounded-lg p-2 text-grey-60 transition-colors lg:hover:bg-grey-20 lg:hover:text-grey-80"
              onClick={() => setIsUsageMenuOpen(true)}
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="12" cy="12" r="1" />
                <circle cx="12" cy="5" r="1" />
                <circle cx="12" cy="19" r="1" />
              </svg>
            </button>
            <Modal
              open={isUsageMenuOpen}
              onOpenChange={setIsUsageMenuOpen}
              mobileVariant="bottomSheet"
            >
              <div className="mb-16 w-full space-y-1">
                <button
                  onClick={() => {
                    handleOpenCouponModal();
                    setIsUsageMenuOpen(false);
                  }}
                  className="flex w-full items-center justify-between gap-3 rounded-lg px-2 py-1.5 text-left transition-colors lg:hover:bg-surface"
                >
                  <span className="text-l text-grey-100">보유 중인 쿠폰</span>
                  <ChevronRightIcon size={20} className="text-grey-70" />
                </button>
                <button
                  onClick={() => {
                    handleCreditUsageLog();
                    setIsUsageMenuOpen(false);
                  }}
                  className="flex w-full items-center justify-between gap-3 rounded-lg px-2 py-1.5 text-left transition-colors lg:hover:bg-surface"
                >
                  <span className="text-l text-grey-100">크레딧 사용 내역</span>
                  <ChevronRightIcon size={20} className="text-grey-70" />
                </button>
              </div>
            </Modal>
          </>
        ) : (
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleOpenCouponModal}
              className="flex items-center gap-1 rounded-md border border-grey-30 px-3 py-1 text-sm font-medium text-grey-80 transition-colors lg:hover:bg-grey-10"
            >
              <CouponIcon /> 보유 중인 쿠폰
            </button>
            <button
              type="button"
              onClick={handleCreditUsageLog}
              className="rounded-md border border-grey-30 px-3 py-1 text-sm font-medium text-grey-80 transition-colors lg:hover:bg-grey-10"
            >
              크레딧 사용 내역
            </button>
          </div>
        )}
      </div>
      <div className="mt-3 flex flex-col space-y-4">{usageContent}</div>
    </div>
  ) : (
    <div className="rounded-xl border border-grey-30 bg-white p-6">
      <div className="mb-2 flex items-center justify-between">
        <h2 className="text-l font-emphasize text-grey-70">사용 정보</h2>
        <div className="flex gap-4">
          <button
            type="button"
            onClick={handleOpenCouponModal}
            className="flex items-center gap-1 rounded-md border border-grey-30 px-3 py-1 text-sm font-medium text-grey-80 transition-colors lg:hover:bg-grey-10"
          >
            <CouponIcon /> 보유 중인 쿠폰
          </button>
          <button
            type="button"
            onClick={handleCreditUsageLog}
            className="rounded-md border border-grey-30 px-3 py-1 text-sm font-medium text-grey-80 transition-colors lg:hover:bg-grey-10"
          >
            크레딧 사용 내역
          </button>
        </div>
      </div>
      <div className="flex flex-col space-y-4">{usageContent}</div>
    </div>
  );

  const welcomeBanner = (
    <WelcomeBanner
      title="마음토스 시작하기"
      description="아직 마음토스 사용법이 어렵다면, 가이드를 확인해보세요."
      buttonText="더 알아보기"
      onButtonClick={handleGuide}
      className="mx-4 text-left md:mx-0"
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

  // --- 조립: 타이틀 ---
  const titleSlot = !isMobileView ? (
    view === 'noticeList' ? (
      <div>
        <Title
          as="h1"
          className="text-left text-2xl font-headline text-grey-100"
        >
          마음토스 공지사항
        </Title>
      </div>
    ) : view === 'settings' ? (
      <div>
        <Title
          as="h1"
          className="text-left text-2xl font-headline text-grey-100"
        >
          서비스 설정
        </Title>
      </div>
    ) : null
  ) : null;

  // --- 조립: 공지사항 콘텐츠 (패딩 포함) ---
  const noticeSlot = noticeContent ? (
    <div
      className={
        isMobileView ? 'flex-1 px-4 py-4 md:px-10 md:py-6' : 'flex-1 py-[42px]'
      }
    >
      {noticeContent}
    </div>
  ) : null;

  // --- 조립: 상담사 정보 섹션 ---
  const userInfoSection = (
    <div
      className={
        isMobileView
          ? 'bg-white p-4 md:rounded-xl md:border md:border-grey-30 md:p-6'
          : 'rounded-xl border border-grey-30 bg-white p-6'
      }
    >
      <div className="flex items-center justify-between">
        <p className="text-m font-emphasize text-grey-70 md:text-l">
          상담사 정보
        </p>
        <button
          type="button"
          onClick={handleEditInfo}
          className="rounded-md border border-grey-30 px-3 py-1 text-m font-medium text-grey-70 transition-colors lg:hover:bg-grey-10"
        >
          정보 수정
        </button>
      </div>
      <div className="mt-4">{userInfoContent}</div>
    </div>
  );

  // --- 조립: 푸터 ---
  const footerSlot = (
    <div
      className={isMobileView ? 'py-6' : 'border-t border-grey-30 px-8 py-6'}
    >
      <div className="flex items-center justify-center gap-4 text-sm">
        <button
          type="button"
          onClick={handleOpenNoticeList}
          className="font-medium text-grey-60 transition-colors lg:hover:text-grey-80"
        >
          공지사항
        </button>
        <span className="text-grey-40">|</span>
        <Link
          to={termsTo}
          target="_blank"
          rel="noopener noreferrer"
          className="font-medium text-grey-60 transition-colors lg:hover:text-grey-80"
        >
          서비스 약관
        </Link>
        <span className="text-grey-40">|</span>
        <button
          type="button"
          onClick={handleLogoutClick}
          className="font-medium text-grey-60 transition-colors lg:hover:text-grey-80"
        >
          로그아웃
        </button>
        <span className="text-grey-40">|</span>
        <button
          type="button"
          onClick={handleDeleteAccount}
          className="font-medium text-grey-60 transition-colors lg:hover:text-red-80"
        >
          계정 탈퇴
        </button>
      </div>
    </div>
  );

  // --- 조립: 모달 모음 ---
  const modalsSlot = (
    <>
      {cancelModal}
      {logoutModal}
      {deleteModal}
      {cardRegistrationModal}
      {creditUsageModal}
      {creditRenewalModal}
      {selectedBadge && (
        <BadgeDetailModal
          open={!!selectedBadge}
          onOpenChange={(open) => {
            if (!open) setSelectedBadge(null);
          }}
          access={selectedBadge}
        />
      )}
    </>
  );

  return (
    <SettingsView
      view={view}
      className={
        isMobileView
          ? 'w-full space-y-4 py-4 md:px-10 md:py-6'
          : 'mx-auto flex min-h-screen w-full max-w-[1332px] flex-col space-y-6 px-16 py-[42px]'
      }
      title={titleSlot}
      userInfoSection={userInfoSection}
      cardInfoSection={cardInfoSection}
      usageInfoCard={usageInfoCard}
      welcomeBanner={welcomeBanner}
      noticeContent={noticeSlot}
      footer={footerSlot}
      modals={modalsSlot}
    />
  );
};

export default SettingsContainer;

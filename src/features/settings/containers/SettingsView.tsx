import React from 'react';

import { Link } from 'react-router-dom';

import { BADGE_ICON_MAP } from '@/features/settings/constants/badgeIcons';
import type { CreditInfo } from '@/shared/api/supabase/creditQueries';
import { useUserAccesses } from '@/shared/hooks/useFeatureAccess';
import type { UserAccess } from '@/shared/hooks/useFeatureAccess';
import { CouponIcon, MailIcon, MapPinIcon, UserIcon } from '@/shared/icons';
import { Button } from '@/shared/ui/atoms/Button';
import { Text } from '@/shared/ui/atoms/Text';
import { Title } from '@/shared/ui/atoms/Title';
import { Card } from '@/shared/ui/composites/Card';
import { WelcomeBanner } from '@/shared/ui/composites/WelcomeBanner';
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

export interface SettingsViewProps {
  view: 'settings' | 'noticeList' | 'noticeDetail';
  selectedNoticeId: string | null;
  userName: string | null;
  userEmail?: string;
  organization: string | null;
  creditInfo: CreditInfo | undefined;
  cardInfo:
    | { type: string; company: string; number: string; createdAt: string }
    | null
    | undefined;
  isPaidPlan: boolean | undefined;
  hasCancellationScheduled: boolean;
  isOAuthUser: boolean;
  isCancelModalOpen: boolean;
  isLogoutModalOpen: boolean;
  isDeleteModalOpen: boolean;
  isCreditUsageModalOpen: boolean;
  isCardModalOpen: boolean;
  isRenewalModalOpen: boolean;
  isDeleting: boolean;
  deleteError: string;
  customerKey: string;
  termsTo: { pathname: string; search: string };
  onSetCancelModalOpen: (open: boolean) => void;
  onSetLogoutModalOpen: (open: boolean) => void;
  onSetDeleteModalOpen: (open: boolean) => void;
  onSetCreditUsageModalOpen: (open: boolean) => void;
  onSetRenewalModalOpen: (open: boolean) => void;
  onEditInfo: () => void;
  onOpenCardRegistration: () => void;
  onCardRegistrationClose: () => void;
  onCardRegistrationSuccess: () => Promise<void>;
  onCreditUsageLog: () => void;
  onUpgradePlan: () => void;
  onCancelSubscription: () => void;
  onConfirmCancelSubscription: () => Promise<void>;
  onUndoCancellation: () => Promise<void>;
  onGuide: () => void;
  onOpenNoticeList: () => void;
  onSelectNotice: (noticeId: string) => void;
  onBackToList: () => void;
  onLogoutClick: () => void;
  onConfirmLogout: () => Promise<void>;
  onDeleteAccount: () => void;
  onConfirmDelete: () => Promise<void>;
  onOpenCouponModal: () => void;
  getPlanLabel: (type: string) => string;
  formatRenewalDate: (date: string | null) => string;
  calculateDaysUntilReset: (resetAt: string | null) => number | undefined;
}
export const SettingsView: React.FC<SettingsViewProps> = ({
  view,
  selectedNoticeId,
  userName,
  userEmail,
  organization,
  creditInfo,
  cardInfo,
  isPaidPlan,
  hasCancellationScheduled,
  isOAuthUser,
  isCancelModalOpen,
  isLogoutModalOpen,
  isDeleteModalOpen,
  isCreditUsageModalOpen,
  isCardModalOpen,
  isRenewalModalOpen,
  isDeleting,
  deleteError,
  customerKey,
  termsTo,
  onSetCancelModalOpen,
  onSetLogoutModalOpen,
  onSetDeleteModalOpen,
  onSetCreditUsageModalOpen,
  onSetRenewalModalOpen,
  onEditInfo,
  onOpenCardRegistration,
  onCardRegistrationClose,
  onCardRegistrationSuccess,
  onCreditUsageLog,
  onUpgradePlan,
  onCancelSubscription,
  onConfirmCancelSubscription,
  onUndoCancellation,
  onGuide,
  onOpenNoticeList,
  onSelectNotice,
  onBackToList,
  onLogoutClick,
  onConfirmLogout,
  onDeleteAccount,
  onConfirmDelete,
  onOpenCouponModal,
  getPlanLabel,
  formatRenewalDate,
  calculateDaysUntilReset,
}) => {
  const { accesses: badges } = useUserAccesses();
  const [selectedBadge, setSelectedBadge] = React.useState<UserAccess | null>(
    null
  );

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-[1332px] flex-col px-16 py-[42px]">
      {view === 'noticeList' && (
        <>
          <div>
            <Title as="h1" className="text-left text-2xl font-bold">
              마음토스 공지사항
            </Title>
          </div>
          <div className="flex-1 py-[42px]">
            <NoticeList onSelectNotice={onSelectNotice} />
          </div>
        </>
      )}

      {view === 'noticeDetail' && selectedNoticeId && (
        <NoticeDetail noticeId={selectedNoticeId} onBack={onBackToList} />
      )}

      {view === 'settings' && (
        <>
          <div>
            <Title as="h1" className="text-left text-2xl font-bold">
              서비스 설정
            </Title>
          </div>

          <div className="flex-1 space-y-6 py-[42px]">
            <Card>
              <Card.Body className="space-y-4 p-6">
                <div className="flex items-center justify-between">
                  <Title
                    as="h2"
                    className="text-lg font-semibold text-fg-muted"
                  >
                    상담사 정보
                  </Title>
                  <Button
                    variant="outline"
                    tone="neutral"
                    size="sm"
                    onClick={onEditInfo}
                    className="text-fg-muted"
                  >
                    정보 수정
                  </Button>
                </div>

                <div className="flex items-end justify-between">
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
                        {userEmail || '이메일 없음'}
                      </Text>
                    </div>
                    <div className="flex items-center gap-3">
                      <MapPinIcon size={20} className="text-fg-muted" />
                      <Text className="text-lg font-semibold">
                        {organization || '소속 기관 없음'}
                      </Text>
                    </div>{' '}
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
                            className="transition-transform hover:scale-105"
                            aria-label={`${badge.name} 뱃지 상세 보기`}
                          >
                            <Icon size={60} />
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              </Card.Body>
            </Card>

            <CardInfo
              cardType={cardInfo?.type}
              cardNumber={cardInfo?.number}
              company={cardInfo?.company}
              onAdd={onOpenCardRegistration}
            />

            <Card>
              <Card.Body className="p-6">
                <div className="flex items-center justify-between">
                  <Title
                    as="h2"
                    className="text-lg font-semibold text-fg-muted"
                  >
                    사용 정보
                  </Title>
                  <div className="flex gap-4">
                    <Button
                      variant="outline"
                      tone="neutral"
                      size="sm"
                      onClick={onOpenCouponModal}
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
                      onClick={onCreditUsageLog}
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
                                {formatRenewalDate(
                                  creditInfo.subscription.end_at
                                )}{' '}
                                해지 예정
                              </span>
                            ) : (
                              <>
                                {formatRenewalDate(
                                  creditInfo.subscription.end_at
                                )}{' '}
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
                          onClick={onUpgradePlan}
                        >
                          {isPaidPlan ? '플랜 변경하기' : '플랜 업그레이드'}
                        </Button>
                        {isPaidPlan && !hasCancellationScheduled && (
                          <Button
                            variant="ghost"
                            tone="neutral"
                            size="sm"
                            onClick={onCancelSubscription}
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
                            onClick={onUndoCancellation}
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
                                ? () => onSetRenewalModalOpen(true)
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
              onButtonClick={onGuide}
              className="text-left"
            />
          </div>

          <div className="border-t border-border px-8 py-6">
            <div className="flex items-center justify-center gap-4 text-sm">
              <button
                type="button"
                onClick={onOpenNoticeList}
                className="inline-flex items-center justify-center rounded-md px-3 py-1.5 text-sm font-medium text-muted transition-colors hover:text-fg"
              >
                공지사항
              </button>
              <span className="text-border">|</span>
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
                onClick={onLogoutClick}
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
                    onClick={onDeleteAccount}
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
              onOpenChange={onSetCancelModalOpen}
              currentPlanType={creditInfo.plan.type}
              currentPlanCredit={creditInfo.plan.total}
              effectiveAt={creditInfo.subscription.end_at}
              onConfirm={onConfirmCancelSubscription}
            />
          )}

          <LogoutModal
            open={isLogoutModalOpen}
            onOpenChange={onSetLogoutModalOpen}
            onConfirm={onConfirmLogout}
          />

          <DeleteAccountModal
            open={isDeleteModalOpen}
            onOpenChange={onSetDeleteModalOpen}
            onConfirm={onConfirmDelete}
            isDeleting={isDeleting}
            error={deleteError}
          />

          <CardRegistrationModal
            isOpen={isCardModalOpen}
            onClose={onCardRegistrationClose}
            customerKey={customerKey}
            onSuccess={onCardRegistrationSuccess}
          />
          <CreditUsageModal
            open={isCreditUsageModalOpen}
            onOpenChange={onSetCreditUsageModalOpen}
          />
          <CreditRenewalModal
            open={isRenewalModalOpen}
            onOpenChange={onSetRenewalModalOpen}
          />
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
      )}
    </div>
  );
};

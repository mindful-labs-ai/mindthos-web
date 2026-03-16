import React from 'react';

import { Link } from 'react-router-dom';

import { BADGE_ICON_MAP } from '@/shared/constants/badgeIcons';
import { useUserAccesses } from '@/shared/hooks/useFeatureAccess';
import type { UserAccess } from '@/shared/hooks/useFeatureAccess';
import { Button } from '@/shared/ui/atoms/Button';
import { Title } from '@/shared/ui/atoms/Title';
import { Card } from '@/shared/ui/composites/Card';
import { BadgeDetailModal } from '@/widgets/settings/BadgeDetailModal';

export interface SettingsViewProps {
  view: 'settings' | 'noticeList' | 'noticeDetail';
  termsTo: { pathname: string; search: string };
  isOAuthUser: boolean;
  onOpenNoticeList: () => void;
  onLogoutClick: () => void;
  onDeleteAccount: () => void;
  onEditInfo: () => void;
  noticeContent: React.ReactNode;
  userInfoContent: React.ReactNode;
  cardInfoSection: React.ReactNode;
  usageInfoCard: React.ReactNode;
  welcomeBanner: React.ReactNode;
  cancelModal: React.ReactNode;
  logoutModal: React.ReactNode;
  deleteModal: React.ReactNode;
  cardRegistrationModal: React.ReactNode;
  creditUsageModal: React.ReactNode;
  creditRenewalModal: React.ReactNode;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  view,
  termsTo,
  isOAuthUser,
  onOpenNoticeList,
  onLogoutClick,
  onDeleteAccount,
  onEditInfo,
  noticeContent,
  userInfoContent,
  cardInfoSection,
  usageInfoCard,
  welcomeBanner,
  cancelModal,
  logoutModal,
  deleteModal,
  cardRegistrationModal,
  creditUsageModal,
  creditRenewalModal,
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
          <div className="flex-1 py-[42px]">{noticeContent}</div>
        </>
      )}

      {view === 'noticeDetail' && noticeContent}

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
                  {userInfoContent}

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

            {cardInfoSection}

            {usageInfoCard}

            {welcomeBanner}
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
      )}
    </div>
  );
};

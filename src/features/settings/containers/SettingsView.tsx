import React from 'react';

export interface SettingsViewProps {
  view: 'settings' | 'noticeList' | 'noticeDetail';
  className?: string;
  // 설정 페이지 slots
  title: React.ReactNode;
  userInfoSection: React.ReactNode;
  cardInfoSection: React.ReactNode;
  usageInfoCard: React.ReactNode;
  welcomeBanner: React.ReactNode;
  // 공지사항
  noticeContent: React.ReactNode;
  // 푸터
  footer: React.ReactNode;
  // 모달들
  modals: React.ReactNode;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  view,
  className,
  title,
  userInfoSection,
  cardInfoSection,
  usageInfoCard,
  welcomeBanner,
  noticeContent,
  footer,
  modals,
}) => {
  return (
    <div className={className}>
      {view === 'noticeList' && (
        <>
          {title}
          {noticeContent}
        </>
      )}

      {view === 'noticeDetail' && noticeContent}

      {view === 'settings' && (
        <>
          {title}
          {userInfoSection}
          {cardInfoSection}
          {usageInfoCard}
          {welcomeBanner}
          {footer}
          {modals}
        </>
      )}
    </div>
  );
};

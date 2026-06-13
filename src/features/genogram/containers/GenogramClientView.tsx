import type { FC, ReactNode } from 'react';

import { MobileModalHeader } from '@/shared/ui';

export interface GenogramClientViewProps {
  /** 데스크탑 좌측 내담자 사이드바 (모바일은 null) */
  sidebar?: ReactNode;
  header: ReactNode;
  content: ReactNode;
  addClientModal: ReactNode;
  resetModal: ReactNode;
  exportModal: ReactNode;
  guideModal: ReactNode;
  reportModal: ReactNode;
  isMobileView?: boolean;
  hideMobileHeader?: boolean;
  mobileHeaderTitle?: string;
  mobileHeaderRight?: ReactNode;
  onBack?: () => void;
}

export const GenogramClientView: FC<GenogramClientViewProps> = ({
  sidebar,
  header,
  content,
  addClientModal,
  resetModal,
  exportModal,
  guideModal,
  reportModal,
  isMobileView = false,
  hideMobileHeader = false,
  mobileHeaderTitle,
  mobileHeaderRight,
  onBack,
}) => {
  return (
    <div className="relative flex h-full flex-col">
      {isMobileView ? (
        <>
          {!hideMobileHeader && (
            <MobileModalHeader
              title={mobileHeaderTitle || '가계도'}
              onBack={onBack ?? undefined}
              right={mobileHeaderRight}
            />
          )}
          <div className="relative flex-1 overflow-hidden">
            {header}
            {content}
          </div>
        </>
      ) : sidebar ? (
        <div className="flex min-h-0 flex-1">
          {sidebar}
          <div className="relative min-w-0 flex-1">
            {header}
            {content}
          </div>
        </div>
      ) : (
        <>
          {header}
          {content}
        </>
      )}

      {addClientModal}
      {resetModal}
      {exportModal}
      {guideModal}
      {reportModal}
    </div>
  );
};

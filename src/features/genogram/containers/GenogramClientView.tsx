import type { FC, ReactNode } from 'react';

import { BackButton } from '@/shared/ui/atoms/BackButton';

export interface GenogramClientViewProps {
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
            <div className="flex h-[67px] flex-shrink-0 items-center justify-between border-b border-grey-30 bg-white px-4">
              <div className="flex items-center gap-3">
                {onBack && <BackButton onClick={onBack} />}
                <p className="text-m font-medium text-grey-100">
                  {mobileHeaderTitle || '가계도'}
                </p>
              </div>
              {mobileHeaderRight}
            </div>
          )}
          <div className="relative flex-1 overflow-hidden">
            {header}
            {content}
          </div>
        </>
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

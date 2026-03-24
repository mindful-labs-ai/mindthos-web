import React from 'react';

import { useLocation, useSearchParams } from 'react-router-dom';

import { useClientList } from '@/features/client/hooks/useClientList';
import { useNavigateWithUtm } from '@/shared/hooks/useNavigateWithUtm';
import { GenogramIcon, MenuIcon, PlusIcon } from '@/shared/icons';
import { BackButton } from '@/shared/ui/atoms/BackButton';
import { Button } from '@/shared/ui/atoms/Button';
import { Modal } from '@/shared/ui/composites/Modal';
import { useModalStore } from '@/stores/modalStore';

import { getRouteLabel } from '../navigationConfig';

interface MobileHeaderProps {
  onMenuOpen: () => void;
  onNewSession: () => void;
}

export const MobileHeader: React.FC<MobileHeaderProps> = ({
  onMenuOpen,
  onNewSession,
}) => {
  const location = useLocation();
  const isGenogram = location.pathname === '/genogram';

  const pageTitle = React.useMemo(() => {
    const pathname = location.pathname;
    if (pathname === '/') return '홈';
    const basePath = '/' + pathname.split('/').filter(Boolean)[0];
    return getRouteLabel(basePath);
  }, [location.pathname]);

  // 가계도 라우트: 클라이언트 드롭다운
  const genogramRightSlot = isGenogram ? (
    <GenogramClientButton />
  ) : null;

  const rightSlot = (() => {
    if (genogramRightSlot) return genogramRightSlot;
    if (location.pathname === '/clients') {
      return (
        <Button
          tone="primary"
          variant="solid"
          size="md"
          onClick={() => useModalStore.getState().openModal('addClient')}
          className="truncate"
        >
          클라이언트 추가하기
        </Button>
      );
    }
    return (
      <Button
        tone="primary"
        variant="outline"
        size="md"
        icon={<PlusIcon size={16} />}
        onClick={onNewSession}
        className="truncate"
      >
        새 상담 기록
      </Button>
    );
  })();

  return (
    <header className="sticky top-0 z-header flex h-header items-center justify-between border-b border-header-border bg-header-bg px-4 md:px-6">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onMenuOpen}
          className="transition-default flex size-8 items-center justify-center rounded-md border border-border p-1.5 text-fg-muted"
          aria-label="메뉴 열기"
        >
          <MenuIcon size={24} />
        </button>
        <span className="typo-m text-fg">{pageTitle}</span>
      </div>

      {rightSlot}
    </header>
  );
};

/** 가계도 MobileHeader 우측 클라이언트 선택 버튼 */
function GenogramClientButton() {
  const [searchParams] = useSearchParams();
  const clientId = searchParams.get('clientId');
  const { clients } = useClientList();
  const { setSearchParamsWithUtm } = useNavigateWithUtm();

  const activeClients = React.useMemo(
    () => clients.filter((c) => !c.counsel_done),
    [clients]
  );
  const selectedClient = activeClients.find((c) => c.id === clientId) ?? null;

  const [isOpen, setIsOpen] = React.useState(false);

  return (
    <>
      <Button
        variant="outline"
        className="gap-2 bg-surface"
        onClick={() => setIsOpen(true)}
      >
        <GenogramIcon size={18} />
        <span>{selectedClient?.name || '선택 안됨'}</span>
      </Button>

      <Modal
        open={isOpen}
        onOpenChange={setIsOpen}
        mobileVariant="fullScreen"
        hideCloseButton
        className="flex flex-col"
      >
        <div className="flex h-[67px] flex-shrink-0 items-center gap-3 border-b border-grey-30 px-4">
          <BackButton onClick={() => setIsOpen(false)} />
          <p className="text-l font-medium text-grey-80">클라이언트 선택</p>
        </div>
        <div className="flex-1 overflow-y-auto px-4 py-4">
          {activeClients.length === 0 ? (
            <p className="py-8 text-center text-sm text-grey-60">
              클라이언트가 없습니다
            </p>
          ) : (
            <div className="space-y-2">
              {activeClients.map((client) => (
                <button
                  key={client.id}
                  onClick={() => {
                    const id = client.id;
                    setIsOpen(false);
                    // fullScreen history.back() 완료 후 URL 변경
                    const onPop = () => {
                      window.removeEventListener('popstate', onPop);
                      setTimeout(() => setSearchParamsWithUtm({ clientId: id }), 50);
                    };
                    window.addEventListener('popstate', onPop);
                  }}
                  className={`flex w-full items-center justify-between rounded-xl border px-4 py-4 text-left transition-colors ${
                    selectedClient?.id === client.id
                      ? 'border-green-80 bg-green-10'
                      : 'border-grey-30 bg-white hover:bg-grey-10'
                  }`}
                >
                  <span className="text-m font-medium text-grey-100">{client.name}</span>
                  {selectedClient?.id === client.id && (
                    <span className="text-sm font-medium text-green-80">선택됨</span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      </Modal>
    </>
  );
}

import { useMemo, useState } from 'react';

import { useSearchParams } from 'react-router-dom';

import { useClientsList } from '@/features/client/hooks/useClientsList';
import type { Client } from '@/features/client/types';
import type { ClientsPageItem } from '@/shared/api/supabase/clientQueries';
import { useDevice } from '@/shared/hooks/useDevice';
import { useNavigateWithUtm } from '@/shared/hooks/useNavigateWithUtm';
import { useAuthStore } from '@/stores/authStore';
import { ClientSidebar } from '@/widgets/client/ClientSidebar';

import { PsychologyAssessmentsMain } from '../components/PsychologyAssessmentsMain';

const toClient = (item: ClientsPageItem, counselorId: string): Client => ({
  id: item.id,
  counselor_id: counselorId,
  name: item.name,
  phone_number: item.phone_number || '',
  email: item.email,
  counsel_theme: item.counsel_theme,
  counsel_number: Number(item.counsel_number) || 0,
  counsel_done: item.counsel_done ?? false,
  memo: item.memo,
  pin: item.pin ?? false,
  created_at: item.created_at,
  updated_at: item.created_at,
  session_count: item.session_count,
});

export function PsychologyAssessmentsContainer() {
  const { isMobile, isTablet } = useDevice();
  const isMobileView = isMobile || isTablet;

  const [searchParams] = useSearchParams();
  const { setSearchParamsWithUtm } = useNavigateWithUtm();
  const clientId = searchParams.get('clientId');

  const userId = useAuthStore((state) => state.userId);
  // ClientSidebar와 동일 queryKey 사용 → react-query 캐시 공유
  const { items } = useClientsList({
    counselorId: parseInt(userId || '0'),
    sortOrder: 'asc',
    enabled: !!userId,
  });

  const selectedClient = useMemo<Client | null>(() => {
    if (!clientId) return null;
    const item = items.find((i) => i.id === clientId);
    return item ? toClient(item, userId || '') : null;
  }, [items, clientId, userId]);

  const handleSelectClient = (client: Client) => {
    setSearchParamsWithUtm({ clientId: client.id });
  };

  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  return (
    <div className="flex h-full w-full">
      {!isMobileView && (
        <ClientSidebar
          selectedClientId={clientId}
          onSelectClient={handleSelectClient}
          collapsed={isSidebarCollapsed}
          onToggleCollapsed={() => setIsSidebarCollapsed((prev) => !prev)}
        />
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        {/* 내담자별로 디테일 상태(mode·대화·선택 등)를 격리 — client.id로 remount해
            전환 시 이전 내담자 상태가 남지 않고 새 내담자 서버 데이터로 재파생된다. */}
        <PsychologyAssessmentsMain
          key={selectedClient?.id ?? 'no-client'}
          client={selectedClient}
        />
      </div>
    </div>
  );
}

export default PsychologyAssessmentsContainer;

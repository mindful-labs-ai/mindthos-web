import React from 'react';

import { ChevronDown, User, SortDesc } from 'lucide-react';

import { Button } from '@/components/ui/atoms/Button';
import { Title } from '@/components/ui/atoms/Title';
import { SessionRecordCard } from '@/feature/session/components/SessionRecordCard';
import { buildSessionRecords } from '@/feature/session/data/mockData';
import type { SessionRecord } from '@/feature/session/types';

export const SessionHistoryPage: React.FC = () => {
  const [records] = React.useState<SessionRecord[]>(buildSessionRecords());

  const handleCardClick = (record: SessionRecord) => {
    console.log('Card clicked:', record);
  };

  const handleMenuClick = (record: SessionRecord) => {
    console.log('Menu clicked:', record);
  };

  return (
    <div className="flex min-h-screen flex-col bg-surface-contrast p-12">
      <div className="px-8">
        <div className="flex items-center justify-between px-2">
          <Title as="h1" className="text-2xl font-bold">
            상담 기록
          </Title>
        </div>

        <div className="mt-6 flex gap-3">
          <Button
            variant="solid"
            tone="surface"
            size="sm"
            icon={<User size={16} />}
            iconRight={<ChevronDown size={16} />}
          >
            모든 고객
          </Button>
          <Button
            variant="solid"
            tone="surface"
            size="sm"
            icon={<SortDesc size={16} />}
            iconRight={<ChevronDown size={16} />}
          >
            최신 날짜 순
          </Button>
        </div>
      </div>

      <div className="flex-1 px-8 py-6">
        <div className="space-y-4">
          {records.map((record) => (
            <SessionRecordCard
              key={record.session_id}
              record={record}
              onClick={handleCardClick}
              onMenuClick={handleMenuClick}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default SessionHistoryPage;

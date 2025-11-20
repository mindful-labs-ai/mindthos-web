import React from 'react';

import { ChevronDown, User, SortDesc } from 'lucide-react';
import { useNavigate, Outlet, useParams } from 'react-router-dom';

import { Button } from '@/components/ui/atoms/Button';
import { Title } from '@/components/ui/atoms/Title';
import { useClientList } from '@/feature/client/hooks/useClientList';
import { SessionRecordCard } from '@/feature/session/components/SessionRecordCard';
import type { SessionRecord } from '@/feature/session/types';
import { getSpeakerDisplayName } from '@/feature/session/utils/speakerUtils';
import { getSessionDetailRoute } from '@/router/constants';
import { useSessionStore } from '@/stores/sessionStore';

export const SessionHistoryPage: React.FC = () => {
  const navigate = useNavigate();
  const { sessionId } = useParams<{ sessionId: string }>();

  const sessions = useSessionStore((state) => state.sessions);
  const transcribes = useSessionStore((state) => state.transcribes);
  const { clients } = useClientList();

  const sessionsWithTranscribes = React.useMemo(() => {
    return sessions.map((session) => ({
      session,
      transcribe: transcribes[session.id] || null,
    }));
  }, [sessions, transcribes]);

  const records: SessionRecord[] = React.useMemo(() => {
    return sessionsWithTranscribes.map(({ session, transcribe }) => {
      const client = clients.find((c) => c.id === String(session.group_id));

      const speakers = transcribe?.contents?.result?.speakers || [];
      const content =
        transcribe?.contents?.result?.segments
          ?.slice(0, 3)
          .map((seg) => {
            const speakerName = getSpeakerDisplayName(seg.speaker, speakers);
            return `${speakerName}: ${seg.text}`;
          })
          .join(' ') || '전사 내용이 없습니다.';

      return {
        session_id: session.id,
        transcribe_id: transcribe?.id || null,
        client_id: String(session.group_id || ''),
        client_name: client?.name || '고객 없음',
        session_number: 1,
        content,
        note_types: [],
        created_at: session.created_at,
      };
    });
  }, [sessionsWithTranscribes, clients]);

  const handleCardClick = (record: SessionRecord) => {
    navigate(getSessionDetailRoute(record.session_id));
  };

  const handleMenuClick = (_record: SessionRecord) => {
    // TODO: 메뉴 액션 구현
  };

  return (
    <div className="flex h-full bg-surface-contrast">
      {/* 왼쪽: 세션 목록 */}
      <div
        className={`flex flex-shrink-0 flex-col border-r border-border bg-bg transition-all duration-300 ${
          sessionId ? 'w-96' : 'w-full'
        }`}
      >
        <div className="flex-shrink-0 p-6">
          <Title as="h1" className="text-2xl font-bold">
            상담 기록
          </Title>

          <div className="mt-6 flex justify-end gap-3">
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

        <div className="flex-1 overflow-y-auto px-6 py-4">
          <div className="space-y-3">
            {records.length > 0 ? (
              records.map((record) => (
                <SessionRecordCard
                  key={record.session_id}
                  record={record}
                  onClick={handleCardClick}
                  onMenuClick={handleMenuClick}
                  isActive={record.session_id === sessionId}
                />
              ))
            ) : (
              <div className="flex min-h-[200px] items-center justify-center rounded-lg border border-border bg-surface p-6">
                <div className="text-center">
                  <p className="text-sm text-fg-muted">
                    아직 상담 기록이 없습니다.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 오른쪽: 선택된 세션 상세 - sessionId가 있을 때만 렌더링 */}
      {sessionId && (
        <div
          key={sessionId}
          className="flex-1"
          style={{
            animation: 'slideInFromRight 300ms ease-out',
          }}
        >
          <Outlet />
        </div>
      )}

      <style>{`
        @keyframes slideInFromRight {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
};

export default SessionHistoryPage;

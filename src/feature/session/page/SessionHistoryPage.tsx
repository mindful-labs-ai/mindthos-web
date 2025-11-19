import React from 'react';

import { ChevronDown, User, SortDesc } from 'lucide-react';

import { Button } from '@/components/ui/atoms/Button';
import { Title } from '@/components/ui/atoms/Title';
import { useClientList } from '@/feature/client/hooks/useClientList';
import { SessionRecordCard } from '@/feature/session/components/SessionRecordCard';
import type { SessionRecord } from '@/feature/session/types';
import { useSessionStore } from '@/stores/sessionStore';

export const SessionHistoryPage: React.FC = () => {
  // sessionStore와 clients 가져오기
  const sessions = useSessionStore((state) => state.sessions);
  const transcribes = useSessionStore((state) => state.transcribes);
  const { clients } = useClientList();

  // sessions + transcribes 결합 (useMemo로 캐싱)
  const sessionsWithTranscribes = React.useMemo(() => {
    return sessions.map((session) => ({
      session,
      transcribe: transcribes[session.id] || null,
    }));
  }, [sessions, transcribes]);

  // Session + Transcribe → SessionRecord 변환
  const records: SessionRecord[] = React.useMemo(() => {
    return sessionsWithTranscribes.map(({ session, transcribe }) => {
      // client 정보 찾기
      const client = clients.find((c) => c.id === String(session.group_id));

      // transcribe content를 텍스트로 변환
      const content =
        transcribe?.contents?.result?.segments
          ?.slice(0, 3)
          .map((seg) => {
            const speaker = transcribe.contents?.result.speakers.find(
              (s) => s.id === seg.speaker,
            );
            const roleName =
              speaker?.role === 'counselor'
                ? '상담사'
                : speaker?.role === 'client1'
                  ? '내담자'
                  : '내담자2';
            return `${roleName}: ${seg.text}`;
          })
          .join(' ') || '전사 내용이 없습니다.';

      return {
        session_id: session.id,
        transcribe_id: transcribe?.id || null,
        client_id: String(session.group_id || ''),
        client_name: client?.name || '고객 없음',
        session_number: 1, // TODO: 실제 회기 수 계산 필요
        content,
        note_types: [], // TODO: 실제 노트 타입 추가 필요
        created_at: session.created_at,
      };
    });
  }, [sessionsWithTranscribes, clients]);

  const handleCardClick = (_record: SessionRecord) => {
    // TODO: 세션 상세 페이지로 이동
  };

  const handleMenuClick = (_record: SessionRecord) => {
    // TODO: 메뉴 액션 구현
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
          {records.length > 0 ? (
            records.map((record) => (
              <SessionRecordCard
                key={record.session_id}
                record={record}
                onClick={handleCardClick}
                onMenuClick={handleMenuClick}
              />
            ))
          ) : (
            <div className="flex min-h-[400px] items-center justify-center rounded-lg border border-surface-strong bg-surface p-8">
              <div className="text-center">
                <p className="text-lg text-fg-muted">
                  아직 상담 기록이 없습니다.
                </p>
                <p className="mt-2 text-sm text-fg-muted">
                  녹음 파일을 업로드하여 첫 상담 기록을 만들어보세요.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SessionHistoryPage;

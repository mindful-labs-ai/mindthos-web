import React from 'react';

import { useNavigate, Outlet, useParams } from 'react-router-dom';

import { Button } from '@/components/ui/atoms/Button';
import { Title } from '@/components/ui/atoms/Title';
import { useClientList } from '@/feature/client/hooks/useClientList';
import { SessionRecordCard } from '@/feature/session/components/SessionRecordCard';
import { SessionSideList } from '@/feature/session/components/SessionSideList';
import type { SessionRecord } from '@/feature/session/types';
import { getSpeakerDisplayName } from '@/feature/session/utils/speakerUtils';
import { getSessionDetailRoute } from '@/router/constants';
import { ChevronDownIcon, UserIcon, SortDescIcon } from '@/shared/icons';
import { useSessionStore } from '@/stores/sessionStore';

export const SessionHistoryPage: React.FC = () => {
  const navigate = useNavigate();
  const { sessionId } = useParams<{ sessionId: string }>();

  const sessions = useSessionStore((state) => state.sessions);
  const transcribes = useSessionStore((state) => state.transcribes);
  const progressNotes = useSessionStore((state) => state.progressNotes);
  const removeSession = useSessionStore((state) => state.removeSession);
  const { clients } = useClientList();

  const sessionsWithTranscribes = React.useMemo(() => {
    return sessions.map((session) => ({
      session,
      transcribe: transcribes[session.id] || null,
    }));
  }, [sessions, transcribes]);

  const records: SessionRecord[] = React.useMemo(() => {
    return sessionsWithTranscribes.map(({ session, transcribe }) => {
      const client = clients.find((c) => c.id === session.client_id);

      const speakers = transcribe?.contents?.result?.speakers || [];
      const content =
        transcribe?.contents?.result?.segments
          ?.slice(0, 3)
          .map((seg) => {
            const speakerName = getSpeakerDisplayName(seg.speaker, speakers);
            return `${speakerName}: ${seg.text}`;
          })
          .join(' ') || '전사 내용이 없습니다.';

      // 해당 세션의 progress notes에서 note_types 추출
      const sessionProgressNotes = progressNotes[session.id] || [];
      const note_types = sessionProgressNotes
        .map((note) => {
          if (note.title?.includes('SOAP')) return 'SOAP';
          if (note.title?.includes('마음토스')) return 'mindthos';
          return null;
        })
        .filter((type): type is 'SOAP' | 'mindthos' => type !== null);

      // 해당 클라이언트의 세션들을 날짜순으로 정렬하여 회기 번호 계산
      const clientSessions = sessions
        .filter((s) => s.client_id === session.client_id)
        .sort(
          (a, b) =>
            new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        );
      const session_number =
        clientSessions.findIndex((s) => s.id === session.id) + 1;

      return {
        session_id: session.id,
        transcribe_id: transcribe?.id || null,
        client_id: session.client_id || '',
        client_name: client?.name || '고객 없음',
        session_number,
        content,
        note_types,
        created_at: session.created_at,
      };
    });
  }, [sessionsWithTranscribes, clients, progressNotes, sessions]);

  // 간소화된 세션 리스트용 데이터
  const sessionListData = React.useMemo(() => {
    return sessions.map((s) => {
      const client = clients.find((c) => c.id === s.client_id);
      const audioDuration = (s.audio_meta_data as { duration?: number })
        ?.duration;

      // 해당 클라이언트의 세션들을 날짜순으로 정렬하여 회기 번호 계산
      const clientSessions = sessions
        .filter((session) => session.client_id === s.client_id)
        .sort(
          (a, b) =>
            new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        );
      const sessionNumber =
        clientSessions.findIndex((session) => session.id === s.id) + 1;

      return {
        sessionId: s.id,
        clientName: client?.name || '고객 없음',
        sessionNumber,
        duration: audioDuration,
        hasAudio: !!s.audio_url,
        createdAt: s.created_at,
      };
    });
  }, [sessions, clients]);

  const handleCardClick = (record: SessionRecord) => {
    navigate(getSessionDetailRoute(record.session_id));
  };

  const handleChangeClient = (_record: SessionRecord) => {
    // TODO: 내담자 변경 기능 구현
  };

  const handleDeleteSession = (record: SessionRecord) => {
    if (confirm('정말로 이 상담 기록을 삭제하시겠습니까?')) {
      removeSession(record.session_id);
      // 현재 선택된 세션이 삭제되는 경우 목록 페이지로 이동
      if (sessionId === record.session_id) {
        navigate('/history');
      }
    }
  };

  const handleSessionClick = (selectedSessionId: string) => {
    navigate(getSessionDetailRoute(selectedSessionId));
  };

  return (
    <div className="flex h-full bg-surface-contrast">
      {/* 왼쪽: 세션 목록 - sessionId 유무에 따라 다른 UI */}
      {sessionId ? (
        // 간소화된 세션 리스트
        <SessionSideList
          sessions={sessionListData}
          activeSessionId={sessionId}
          onSessionClick={handleSessionClick}
        />
      ) : (
        // 전체 카드 리스트
        <div className="flex w-full flex-shrink-0 flex-col bg-surface-contrast p-8 transition-all duration-300">
          <div className="flex-shrink-0 p-6">
            <Title as="h1" className="px-4 text-start text-2xl font-bold">
              상담 기록
            </Title>

            <div className="mt-6 flex justify-start gap-3 px-4">
              <Button
                variant="solid"
                tone="surface"
                size="sm"
                icon={<UserIcon size={16} />}
                iconRight={<ChevronDownIcon size={16} />}
              >
                모든 고객
              </Button>
              <Button
                variant="solid"
                tone="surface"
                size="sm"
                icon={<SortDescIcon size={16} />}
                iconRight={<ChevronDownIcon size={16} />}
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
                    onChangeClient={handleChangeClient}
                    onDelete={handleDeleteSession}
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
      )}

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

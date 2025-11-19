import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import type { Session, Transcribe } from '@/feature/session/types';

/**
 * 세션 임시 생성 저장소
 *
 * 세션 생성 플로우:
 * 1. 파일 업로드 → Session + Transcribe 생성
 * 2. 스토어에 저장
 * 3. 상담 기록 목록/디테일에서 렌더링
 */

interface SessionStoreState {
  // 세션 목록 (최신순)
  sessions: Session[];

  // 전사 데이터 (session_id를 key로 매핑)
  transcribes: Record<string, Transcribe>;

  // 세션 추가 (파일 업로드 완료 시)
  addSession: (session: Session, transcribe: Transcribe) => void;

  // 특정 세션 조회
  getSessionById: (sessionId: string) => Session | undefined;

  // 세션과 전사 데이터 함께 조회
  getSessionWithTranscribe: (sessionId: string) => {
    session: Session;
    transcribe: Transcribe;
  } | null;

  // 세션 목록 전체 조회 (전사 데이터 포함)
  getSessionsWithTranscribes: () => Array<{
    session: Session;
    transcribe: Transcribe | null;
  }>;

  // 세션 삭제
  removeSession: (sessionId: string) => void;

  // 전체 초기화 (테스트용)
  reset: () => void;
}

export const useSessionStore = create<SessionStoreState>()(
  persist(
    (set, get) => ({
      sessions: [],
      transcribes: {},

      addSession: (session, transcribe) => {
        set((state) => ({
          // 최신 세션을 앞에 추가
          sessions: [session, ...state.sessions],
          transcribes: {
            ...state.transcribes,
            [session.id]: transcribe,
          },
        }));
      },

      getSessionById: (sessionId) => {
        return get().sessions.find((s) => s.id === sessionId);
      },

      getSessionWithTranscribe: (sessionId) => {
        const session = get().getSessionById(sessionId);
        const transcribe = get().transcribes[sessionId];

        if (!session) return null;

        return {
          session,
          transcribe,
        };
      },

      getSessionsWithTranscribes: () => {
        const { sessions, transcribes } = get();

        return sessions.map((session) => ({
          session,
          transcribe: transcribes[session.id] || null,
        }));
      },

      removeSession: (sessionId) => {
        set((state) => {
          const newTranscribes = { ...state.transcribes };
          delete newTranscribes[sessionId];

          return {
            sessions: state.sessions.filter((s) => s.id !== sessionId),
            transcribes: newTranscribes,
          };
        });
      },

      reset: () => {
        set({
          sessions: [],
          transcribes: {},
        });
      },
    }),
    {
      name: 'mindthos-session-storage', // localStorage key
    },
  ),
);

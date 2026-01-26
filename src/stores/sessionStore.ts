import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import type {
  Session,
  Transcribe,
  ProgressNote,
} from '@/feature/session/types';

interface SessionStoreState {
  sessions: Session[];
  transcribes: Record<string, Transcribe>;
  progressNotes: Record<string, ProgressNote[]>;
  // 타임라인-세그먼트 자동 스크롤 활성화 여부
  autoScrollEnabled: boolean;
  setAutoScrollEnabled: (enabled: boolean) => void;
  // 편집 상태 관리 (세션 이동 시 확인 모달용)
  isEditing: boolean;
  setIsEditing: (editing: boolean) => void;
  // 편집 취소 핸들러 (세션 이동 확인 시 호출)
  cancelEditHandler: (() => void) | null;
  setCancelEditHandler: (handler: (() => void) | null) => void;
  addSession: (
    session: Session,
    transcribe: Transcribe,
    progressNotes?: ProgressNote[]
  ) => void;
  getSessionById: (sessionId: string) => Session | undefined;
  getSessionWithTranscribe: (sessionId: string) => {
    session: Session;
    transcribe: Transcribe;
  } | null;
  getSessionsWithTranscribes: () => Array<{
    session: Session;
    transcribe: Transcribe | null;
  }>;
  updateSegmentText: (
    sessionId: string,
    segmentId: number,
    newText: string
  ) => void;
  updateSegmentSpeaker: (
    sessionId: string,
    segmentId: number,
    newSpeakerId: number
  ) => void;
  removeSession: (sessionId: string) => void;
  reset: () => void;
}

export const useSessionStore = create<SessionStoreState>()(
  persist(
    (set, get) => ({
      sessions: [],
      transcribes: {},
      progressNotes: {},
      autoScrollEnabled: true, // 기본값: 활성화
      isEditing: false,
      cancelEditHandler: null,

      setAutoScrollEnabled: (enabled) => {
        set({ autoScrollEnabled: enabled });
      },

      setIsEditing: (editing) => {
        set({ isEditing: editing });
      },

      setCancelEditHandler: (handler) => {
        set({ cancelEditHandler: handler });
      },

      addSession: (session, transcribe, progressNotes = []) => {
        set((state) => ({
          sessions: [session, ...state.sessions],
          transcribes: {
            ...state.transcribes,
            [session.id]: transcribe,
          },
          progressNotes: {
            ...state.progressNotes,
            [session.id]: progressNotes,
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

      updateSegmentText: (sessionId, segmentId, newText) => {
        set((state) => {
          const transcribe = state.transcribes[sessionId];
          if (!transcribe?.contents) return state;

          const contents = transcribe.contents;

          // New format: TranscriptJson (segments 직접 존재)
          if ('segments' in contents && Array.isArray(contents.segments)) {
            const updatedSegments = contents.segments.map((segment) =>
              segment.id === segmentId ? { ...segment, text: newText } : segment
            );

            return {
              ...state,
              transcribes: {
                ...state.transcribes,
                [sessionId]: {
                  ...transcribe,
                  contents: {
                    ...contents,
                    segments: updatedSegments,
                  },
                },
              },
            };
          }

          // Legacy format: TranscribeContents (result.segments)
          if ('result' in contents && contents.result?.segments) {
            const updatedSegments = contents.result.segments.map((segment) =>
              segment.id === segmentId ? { ...segment, text: newText } : segment
            );

            return {
              ...state,
              transcribes: {
                ...state.transcribes,
                [sessionId]: {
                  ...transcribe,
                  contents: {
                    ...contents,
                    result: {
                      ...contents.result,
                      segments: updatedSegments,
                    },
                  },
                },
              },
            };
          }

          return state;
        });
      },

      updateSegmentSpeaker: (sessionId, segmentId, newSpeakerId) => {
        set((state) => {
          const transcribe = state.transcribes[sessionId];
          if (!transcribe?.contents) return state;

          const contents = transcribe.contents;

          // New format: TranscriptJson (segments 직접 존재)
          if ('segments' in contents && Array.isArray(contents.segments)) {
            const updatedSegments = contents.segments.map((segment) =>
              segment.id === segmentId
                ? { ...segment, speaker: newSpeakerId }
                : segment
            );

            return {
              ...state,
              transcribes: {
                ...state.transcribes,
                [sessionId]: {
                  ...transcribe,
                  contents: {
                    ...contents,
                    segments: updatedSegments,
                  },
                },
              },
            };
          }

          // Legacy format: TranscribeContents (result.segments)
          if ('result' in contents && contents.result?.segments) {
            const updatedSegments = contents.result.segments.map((segment) =>
              segment.id === segmentId
                ? { ...segment, speaker: newSpeakerId }
                : segment
            );

            return {
              ...state,
              transcribes: {
                ...state.transcribes,
                [sessionId]: {
                  ...transcribe,
                  contents: {
                    ...contents,
                    result: {
                      ...contents.result,
                      segments: updatedSegments,
                    },
                  },
                },
              },
            };
          }

          return state;
        });
      },

      removeSession: (sessionId) => {
        set((state) => {
          const newTranscribes = { ...state.transcribes };
          const newProgressNotes = { ...state.progressNotes };
          delete newTranscribes[sessionId];
          delete newProgressNotes[sessionId];

          return {
            sessions: state.sessions.filter((s) => s.id !== sessionId),
            transcribes: newTranscribes,
            progressNotes: newProgressNotes,
          };
        });
      },

      reset: () => {
        set({
          sessions: [],
          transcribes: {},
          progressNotes: {},
        });
      },
    }),
    {
      name: 'mindthos-session-storage',
    }
  )
);

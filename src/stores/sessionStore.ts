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
          if (!transcribe?.contents?.result?.segments) return state;

          const updatedSegments = transcribe.contents.result.segments.map(
            (segment) =>
              segment.id === segmentId ? { ...segment, text: newText } : segment
          );

          return {
            ...state,
            transcribes: {
              ...state.transcribes,
              [sessionId]: {
                ...transcribe,
                contents: {
                  ...transcribe.contents,
                  result: {
                    ...transcribe.contents.result,
                    segments: updatedSegments,
                  },
                },
              },
            },
          };
        });
      },

      updateSegmentSpeaker: (sessionId, segmentId, newSpeakerId) => {
        set((state) => {
          const transcribe = state.transcribes[sessionId];
          if (!transcribe?.contents?.result?.segments) return state;

          const updatedSegments = transcribe.contents.result.segments.map(
            (segment) =>
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
                  ...transcribe.contents,
                  result: {
                    ...transcribe.contents.result,
                    segments: updatedSegments,
                  },
                },
              },
            },
          };
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

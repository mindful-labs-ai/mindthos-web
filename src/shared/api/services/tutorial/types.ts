import type { TutorialStep } from '@/features/onboarding/constants/tutorialStep';

export type TutorialStatus =
  | 'NOT_STARTED'
  | 'IN_PROGRESS'
  | 'EXPIRED'
  | 'COMPLETED';

export interface TutorialState {
  tutorial_step: TutorialStep | null;
  status: TutorialStatus;
  started_at: string | null;
  expires_at: string | null;
  completed_at: string | null;
  reward_claimed_at: string | null;
}

export interface TutorialProgressRequest {
  tutorial_step: TutorialStep;
}

export interface TutorialProgressResponse extends TutorialState {
  advanced: boolean;
}

export type TutorialVirtualClientKey = 'LEE_YOUNGSUK' | 'JUNG_SUA';

export interface TutorialVirtualSession {
  id: string;
  title: string | null;
  session_number: number | null;
  processing_status:
    | 'pending'
    | 'transcribing'
    | 'generating_note'
    | 'succeeded'
    | 'failed'
    | 'downloading_audio'
    | 'uploading_to_gemini'
    | 'processing_transcription'
    | null;
  has_prepared_transcript: boolean;
  audio_url: string | null;
}

export interface TutorialVirtualClient {
  key: TutorialVirtualClientKey;
  client: {
    id: string;
    name: string;
  };
  sessions: TutorialVirtualSession[];
}

export interface TutorialVirtualClientsResponse {
  virtual_clients: TutorialVirtualClient[];
}

export interface TutorialDirectVirtualSessionUploadResponse {
  client_key: TutorialVirtualClientKey;
  session: TutorialVirtualSession;
  credit_charged: false;
  ai_requested: boolean;
}

export interface Session {
  id: string;
  user_id: string;
  group_id: number | null;
  title: string | null;
  description: string | null;
  audio_meta_data: Record<string, unknown> | null;
  created_at: string;
}

export interface Transcribe {
  id: string;
  session_id: string;
  user_id: string;
  title: string | null;
  counsel_date: string | null;
  contents: string | null;
  created_at: string;
}

export interface CounselNote {
  id: string;
  session_id: string;
  user_id: string;
  title: string | null;
  template_id: string | null;
  summary: string | null;
  created_at: string;
}

export type NoteType = 'SOAP' | 'mindthos';

export interface SessionRecord {
  session_id: string;
  transcribe_id: string | null;
  client_id: string;
  client_name: string;
  session_number: number;
  content: string;
  note_types: NoteType[];
  created_at: string;
}

export interface CreateSessionRequest {
  client_id: string;
  title?: string;
  description?: string;
  transcribe_contents?: string;
  counsel_date?: string;
}

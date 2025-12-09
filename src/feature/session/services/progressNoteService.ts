const SUPABASE_URL = import.meta.env.VITE_WEBAPP_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_WEBAPP_SUPABASE_ANON_KEY;

interface CreateProgressNoteParams {
  sessionId: string;
  userId: number;
  templateId: number;
  transcribedText: string;
}

interface CreateProgressNoteResponse {
  success: boolean;
  progress_note_id: string;
  summary: string;
  message?: string;
}

interface AddProgressNoteParams {
  sessionId: string;
  userId: number;
  templateId: number;
}

interface AddProgressNoteResponse {
  success: boolean;
  progress_note_id: string;
  message?: string;
}

/**
 * 상담 노트 생성 API 호출 (세션 플로우용)
 */
export async function createProgressNote(
  params: CreateProgressNoteParams
): Promise<CreateProgressNoteResponse> {
  const response = await fetch(`${SUPABASE_URL}/functions/v1/progress-note`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
    },
    body: JSON.stringify({
      session_id: params.sessionId,
      user_id: params.userId,
      template_id: params.templateId,
      transcribed_text: params.transcribedText,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      errorData.message || `상담 노트 생성 실패: ${response.statusText}`
    );
  }

  const data: CreateProgressNoteResponse = await response.json();

  if (!data.success) {
    throw new Error(data.message || '상담 노트 생성 중 오류가 발생했습니다.');
  }

  return data;
}

/**
 * 상담 노트 추가 API 호출 (세션 상세 페이지용, 백그라운드 처리)
 */
export async function addProgressNote(
  params: AddProgressNoteParams
): Promise<AddProgressNoteResponse> {
  const response = await fetch(
    `${SUPABASE_URL}/functions/v1/add-progress-note`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify({
        session_id: params.sessionId,
        user_id: params.userId,
        template_id: params.templateId,
      }),
    }
  );

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      errorData.message || `상담 노트 추가 실패: ${response.statusText}`
    );
  }

  const data: AddProgressNoteResponse = await response.json();

  if (!data.success) {
    throw new Error(data.message || '상담 노트 추가 중 오류가 발생했습니다.');
  }

  return data;
}

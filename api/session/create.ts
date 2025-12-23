import type { VercelRequest, VercelResponse } from '@vercel/node';

// 요청 타입 정의
interface CreateSessionRequest {
  user_id: number;
  title: string;
  s3_key: string;
  file_size_mb: number;
  duration_seconds: number;
  upload_type: 'pdf' | 'direct' | 'audio';
  client_id?: string | null;
  stt_model: 'whisper' | 'gemini-3';
  template_id: number;
}

// 응답 타입 정의
interface CreateSessionResponse {
  session_id: string;
  status: 'accepted' | 'failed';
  stt_model: 'whisper' | 'gemini-3';
  message: string;
}

const SESSION_API = process.env.VITE_SESSION_API_URL;

/**
 * 세션 생성 API 라우트
 * Vercel 서버리스 함수로 실행되어 CORS 문제를 우회
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS 헤더 설정
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader(
    'Access-Control-Allow-Methods',
    'GET,OPTIONS,PATCH,DELETE,POST,PUT'
  );
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization'
  );

  console.log('요청 detacted');

  // OPTIONS 요청 처리 (CORS preflight)
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // POST 요청만 허용
  if (req.method !== 'POST') {
    return res.status(405).json({
      status: 'failed',
      message: 'Method Not Allowed',
    });
  }

  try {
    const requestData: CreateSessionRequest = req.body;

    // 필수 필드 검증
    if (
      !requestData.user_id ||
      !requestData.s3_key ||
      !requestData.stt_model ||
      !requestData.template_id
    ) {
      return res.status(400).json({
        status: 'failed',
        message: '필수 필드가 누락되었습니다.',
      });
    }

    // 환경 변수 확인
    const supabaseUrl = process.env.VITE_WEBAPP_SUPABASE_URL;
    const supabaseAnonKey = process.env.VITE_WEBAPP_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      console.error('Supabase 환경 변수가 설정되지 않았습니다.');
      return res.status(500).json({
        status: 'failed',
        message: '서버 설정 오류',
      });
    }

    const response = await fetch(`${SESSION_API}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${supabaseAnonKey}`,
      },
      body: JSON.stringify(requestData),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('Supabase Edge Function 오류:', errorData);

      return res.status(response.status).json({
        status: 'failed',
        message: errorData.message || `세션 생성 실패: ${response.statusText}`,
      });
    }

    const data: CreateSessionResponse = await response.json();

    if (data.status !== 'accepted') {
      return res.status(400).json(data);
    }

    // 성공 응답
    return res.status(200).json(data);
  } catch (error) {
    console.error('[API /session/create] 오류:', error);

    return res.status(500).json({
      status: 'failed',
      message:
        error instanceof Error
          ? error.message
          : '알 수 없는 오류가 발생했습니다.',
    });
  }
}

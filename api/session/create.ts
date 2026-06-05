import type { VercelRequest, VercelResponse } from '@vercel/node';

// 요청 타입 정의
interface CreateSessionRequest {
  user_id: number;
  title: string;
  s3_key: string;
  file_size_mb: number;
  duration_seconds: number;
  client_id?: string | null;
  stt_model: 'basic' | 'advanced';
  template_id: number;
}

// 응답 타입 정의
interface CreateSessionResponse {
  session_id: string;
  status: 'accepted' | 'failed';
  stt_model: 'basic' | 'advanced';
  message: string;
}

const SESSION_API =
  process.env.SESSION_API_URL ?? process.env.VITE_SESSION_API_URL;
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
        message: '필수 데이터가 누락되었습니다.',
      });
    }

    // 사용자 JWT 포워딩 — mavo-api requireAuthAndUserMatch 가 JWT → users.id 매칭
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({
        status: 'failed',
        message: '인증 정보가 없어요. 새로고침 해주세요.',
      });
    }

    const response = await fetch(`${SESSION_API}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: authHeader,
      },
      body: JSON.stringify(requestData),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('상담기록 생성 오류:', {
        status: response.status,
        errorData,
      });

      const message =
        errorData.message ??
        errorData.error ??
        (Array.isArray(errorData.details)
          ? errorData.details.join(', ')
          : undefined) ??
        `상담기록 생성 실패: ${response.statusText}`;

      return res.status(response.status).json({
        status: 'failed',
        message,
        // 잔액 부족 등 분기에 필요한 원본 필드 보존
        ...(errorData.error ? { error: errorData.error } : {}),
        ...(errorData.details ? { details: errorData.details } : {}),
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
          : '알 수 없는 오류가 발생했습니다. 마음토스에 문의해주세요!',
    });
  }
}

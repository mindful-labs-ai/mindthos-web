import type { Session, Transcribe, TranscribeContents } from '../types';

/**
 * Mock 세션 데이터 생성 헬퍼
 *
 * 실제로는 서버에서 전사 처리 후 데이터를 받겠지만,
 * 지금은 목데이터를 사용하여 즉시 세션을 생성합니다.
 */

interface AudioFileInfo {
  name: string;
  size: number;
  duration: number;
  file: File;
}

interface CreateMockSessionDataParams {
  file: AudioFileInfo;
  clientId: string | null;
  userId: string;
}

interface MockSessionData {
  session: Session;
  transcribe: Transcribe;
}

// UUID 간단 생성 (실제로는 서버에서 생성)
const generateId = () => {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
};

// Mock 전사 컨텐츠 (실제로는 서버에서 STT 처리)
const createMockTranscribeContents = (): TranscribeContents => {
  return {
    audio_uuid: generateId(),
    status: 'completed',
    result: {
      segments: [
        {
          id: 0,
          start: 0,
          end: 1.08,
          text: '문을 안 닫고',
          speaker: 2,
          speaker_diarized: null,
        },
        {
          id: 1,
          start: 1.08,
          end: 2.66,
          text: '아 잠시만 기다려주세요',
          speaker: 0,
          speaker_diarized: null,
        },
        {
          id: 2,
          start: 11.62,
          end: 13.96,
          text: '이거 오랜만에 오는 것 같다 그치',
          speaker: 1,
          speaker_diarized: null,
        },
        {
          id: 3,
          start: 14.86,
          end: 17.12,
          text: '11년까지 있었어 그치',
          speaker: 2,
          speaker_diarized: null,
        },
        {
          id: 4,
          start: 23.18,
          end: 25.64,
          text: '오늘은 어디서 만나셔서 오시는 거예요',
          speaker: 0,
          speaker_diarized: null,
        },
        {
          id: 5,
          start: 26.16,
          end: 26.78,
          text: '그냥 집에서',
          speaker: 1,
          speaker_diarized: null,
        },
        {
          id: 6,
          start: 26.78,
          end: 36.8,
          text: '왔어요 아 그러셨어요\n네 네 지난번에는 일정이 뭐가 있으셨어요',
          speaker: 0,
          speaker_diarized: null,
        },
        {
          id: 7,
          start: 37.44,
          end: 40.14,
          text: '저희가 이제 애들 일정이 좀 있어서요',
          speaker: 1,
          speaker_diarized: null,
        },
      ],
      speakers: [
        { id: 0, role: 'counselor' },
        { id: 1, role: 'client1' },
        { id: 2, role: 'client2' },
      ],
      text: '', // 전체 텍스트 (필요시 segments에서 생성)
    },
  };
};

/**
 * Mock 세션 데이터 생성
 */
export const createMockSessionData = ({
  file,
  clientId,
  userId,
}: CreateMockSessionDataParams): MockSessionData => {
  const sessionId = generateId();
  const now = new Date().toISOString();

  // ObjectURL 생성 (브라우저에서 파일 재생용)
  const audioUrl = URL.createObjectURL(file.file);

  // 1. Session 생성
  const session: Session = {
    id: sessionId,
    user_id: userId,
    group_id: clientId ? parseInt(clientId, 10) : null,
    title: file.name,
    description: `${file.name} 상담 세션`,
    audio_meta_data: {
      file_name: file.name,
      file_size: file.size,
      duration: file.duration,
      mime_type: file.file.type,
      uploaded_at: now,
    },
    audio_url: audioUrl, // ObjectURL로 설정
    created_at: now,
  };

  // 2. Transcribe 생성 (전사 완료된 상태로 시뮬레이션)
  const transcribe: Transcribe = {
    id: generateId(),
    session_id: sessionId,
    user_id: userId,
    title: file.name,
    counsel_date: new Date().toISOString().split('T')[0], // YYYY-MM-DD
    contents: createMockTranscribeContents(),
    created_at: now,
  };

  return {
    session,
    transcribe,
  };
};

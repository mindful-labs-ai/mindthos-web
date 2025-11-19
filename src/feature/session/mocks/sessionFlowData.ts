import type {
  Session,
  Transcribe,
  CounselNote,
  TranscribeContents,
} from '../types';

/**
 * 세션 생성 플로우 목데이터
 *
 * 플로우:
 * 1. 사용자가 녹음 파일 선택 및 업로드
 * 2. session 테이블에 저장 (client_id = null, 고객 선택 안함)
 * 3. 서버에서 전사 처리 후 transcribes 테이블에 저장
 * 4. AI 요약 후 progress_notes 테이블에 저장
 */

// ============================================
// 1. Session 데이터 (녹음 파일 업로드 직후)
// ============================================

export const mockUploadedSession: Session = {
  id: 'session-001',
  user_id: 'counselor-1',
  group_id: null, // 고객 선택 안함
  title: 'child_counseling_session.m4a', // 업로드된 파일명
  description: '아동 상담 세션 녹음',
  audio_meta_data: {
    file_name: 'child_counseling_session.m4a',
    file_size: 8500000, // 8.5MB
    duration: 352, // 약 6분 (352초)
    mime_type: 'audio/m4a',
    uploaded_at: '2025-01-19T14:30:00Z',
  },
  audio_url: '/audio/마음토스 모의 상담 사례.mp3',
  created_at: '2025-01-19T14:30:00Z',
};

// ============================================
// 2. Transcribe 데이터 (전사 완료 후)
// ============================================

// 전사 내용 (실제 제공받은 데이터)
const transcribeContents: TranscribeContents = {
  audio_uuid: '2c0153c3679f-c0a4840c',
  status: 'completing',
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
      // ... 실제로는 전체 104개 세그먼트 포함
      // 여기서는 샘플만 표시
    ],
    speakers: [
      { id: 0, role: 'counselor' },
      { id: 1, role: 'client1' },
      { id: 2, role: 'client2' },
    ],
    text: '',
  },
};

export const mockTranscribeRecord: Transcribe = {
  id: 'transcribe-001',
  session_id: 'session-001',
  user_id: 'counselor-1',
  title: 'couple_counseling_session.m4a', // 파일명
  counsel_date: '2025-01-19',
  contents: transcribeContents, // JSON 객체
  created_at: '2025-01-19T14:35:00Z', // 세션 생성 5분 후 전사 완료
};

// ============================================
// 3. Progress Note 데이터 (AI 요약 완료 후)
// ============================================

export const mockProgressNote: CounselNote = {
  id: 'note-001',
  session_id: 'session-001',
  user_id: 'counselor-1',
  title: '부부 상담 경과 기록',
  template_id: 'template-001', // 선택한 템플릿
  summary: `## 주호소 문제
부부 관계에서의 의사소통 단절 및 정서적 거리감을 호소함.
- 남편(client2)은 아내(client1)와 함께 시간을 보내고 싶어하나 아내가 문을 닫아놓은 느낌을 받음
- 아내(client1)는 최근 다운되어 있는 상태이며, 설 연휴 때 집에 혼자 있었음
- 이혼서류를 제출한 상태이나, 관계 회복을 위해 노력 중

## 관계 역동
- 남편: 여행, 방탈출 등 함께 활동하자고 제안하나 거절당함. 아내의 반응에 좌절감을 느낌
- 아내: 여행은 부담스럽고, 평소 소소한 대화와 시간이 더 의미있다고 생각함
- 서로의 기대와 욕구가 다르며, 이를 표현하고 이해하는 데 어려움

## 상담 내용
- 남편의 노력: 떡국 가져다줌, 여행 제안, 방탈출 제안 등
- 아내의 상태: 부모님과의 문제, 다운된 감정 상태, 대화 에너지 부족
- 의사소통 패턴: 아내가 원하는 것을 말해도 남편이 넘어가는 패턴 존재

## 향후 계획
- 서로의 욕구와 기대를 명확히 표현하고 경청하는 연습 필요
- 부담스럽지 않은 수준에서 소소한 시간 함께 보내기
- 정서적 안전감 형성 후 점진적인 관계 개선`,
  created_at: '2025-01-19T14:40:00Z', // 전사 완료 5분 후 요약 완료
};

// ============================================
// 전체 세션 데이터 (통합)
// ============================================

export interface SessionFlowData {
  session: Session;
  transcribe: Transcribe;
  progressNote: CounselNote;
}

export const mockSessionFlowData: SessionFlowData = {
  session: mockUploadedSession,
  transcribe: mockTranscribeRecord,
  progressNote: mockProgressNote,
};

// ============================================
// Helper: 특정 화자의 발화만 필터링
// ============================================

export const getSegmentsBySpeaker = (speakerId: number) => {
  return (
    transcribeContents.result.segments?.filter(
      (seg) => seg.speaker === speakerId,
    ) || []
  );
};

// ============================================
// Helper: 전사 내용을 텍스트로 변환
// ============================================

export const convertSegmentsToText = (): string => {
  const segments = transcribeContents.result.segments || [];
  const speakers = transcribeContents.result.speakers || [];

  return segments
    .map((seg) => {
      const speaker = speakers.find((s) => s.id === seg.speaker);
      const roleName =
        speaker?.role === 'counselor'
          ? '상담사'
          : speaker?.role === 'client1'
            ? '내담자1'
            : '내담자2';
      return `[${roleName}] ${seg.text}`;
    })
    .join('\n');
};

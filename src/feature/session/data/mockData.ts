import type {
  Session,
  Transcribe,
  CounselNote,
  SessionRecord,
} from '@/feature/session/types';

export const mockSessions: Session[] = [
  {
    id: 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d',
    user_id: 'counselor-1',
    group_id: null,
    title: '직장 스트레스 상담',
    description: '상사와의 관계 문제',
    audio_meta_data: null,
    created_at: '2024-02-15T14:30:00',
  },
  {
    id: 'b2c3d4e5-f6a7-4b8c-9d0e-1f2a3b4c5d6e',
    user_id: 'counselor-1',
    group_id: null,
    title: '이혼 후 심리 상담',
    description: '이혼 트라우마 극복',
    audio_meta_data: null,
    created_at: '2024-02-14T10:00:00',
  },
  {
    id: 'c3d4e5f6-a7b8-4c9d-0e1f-2a3b4c5d6e7f',
    user_id: 'counselor-1',
    group_id: null,
    title: '감사 일기 실천',
    description: null,
    audio_meta_data: null,
    created_at: '2024-02-13T15:00:00',
  },
  {
    id: 'd4e5f6a7-b8c9-4d0e-1f2a-3b4c5d6e7f8a',
    user_id: 'counselor-1',
    group_id: 1,
    title: '부부 관계 상담',
    description: '부부 간 의사소통 문제',
    audio_meta_data: null,
    created_at: '2024-02-12T16:30:00',
  },
  {
    id: 'e5f6a7b8-c9d0-4e1f-2a3b-4c5d6e7f8a9b',
    user_id: 'counselor-1',
    group_id: null,
    title: '불안장애 초기 상담',
    description: null,
    audio_meta_data: null,
    created_at: '2024-02-11T11:00:00',
  },
  {
    id: 'f6a7b8c9-d0e1-4f2a-3b4c-5d6e7f8a9b0c',
    user_id: 'counselor-1',
    group_id: null,
    title: '우울증 상담',
    description: '장기 우울증 치료',
    audio_meta_data: null,
    created_at: '2024-02-10T14:00:00',
  },
  {
    id: 'a7b8c9d0-e1f2-4a3b-4c5d-6e7f8a9b0c1d',
    user_id: 'counselor-1',
    group_id: null,
    title: '수면 장애 상담',
    description: null,
    audio_meta_data: null,
    created_at: '2024-02-09T10:30:00',
  },
  {
    id: 'b8c9d0e1-f2a3-4b4c-5d6e-7f8a9b0c1d2e',
    user_id: 'counselor-1',
    group_id: null,
    title: '자녀 관계 상담',
    description: '사춘기 자녀와의 소통',
    audio_meta_data: null,
    created_at: '2024-02-08T13:00:00',
  },
  {
    id: 'c9d0e1f2-a3b4-4c5d-6e7f-8a9b0c1d2e3f',
    user_id: 'counselor-1',
    group_id: null,
    title: '진로 상담',
    description: '퇴사 후 진로 고민',
    audio_meta_data: null,
    created_at: '2024-02-01T09:00:00',
  },
  {
    id: 'd0e1f2a3-b4c5-4d6e-7f8a-9b0c1d2e3f4a',
    user_id: 'counselor-1',
    group_id: null,
    title: '운동 습관 형성',
    description: null,
    audio_meta_data: null,
    created_at: '2024-01-28T15:30:00',
  },
];

export const mockTranscribes: Transcribe[] = [
  {
    id: 't1a2b3c4-d5e6-4f7a-8b9c-0d1e2f3a4b5c',
    session_id: 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d',
    user_id: 'counselor-1',
    title: '김성곤 3회기',
    counsel_date: '2024-02-15',
    contents:
      '상담사: 오늘은 어떤 이야기를 나누고 싶으신가요? 내담자: 요즘 직장에서 스트레스가 심해서요. 상사와의 관계가 좀 어렵습니다. 상담사: 구체적으로 어떤 부분이 어려우신가요? 내담자: 제 의견을 말하려고 하면 항상 무시당하는 느낌이에요.',
    created_at: '2024-02-15T14:30:00',
  },
  {
    id: 't2b3c4d5-e6f7-4a8b-9c0d-1e2f3a4b5c6d',
    session_id: 'b2c3d4e5-f6a7-4b8c-9d0e-1f2a3b4c5d6e',
    user_id: 'counselor-1',
    title: '이지은 1회기',
    counsel_date: '2024-02-14',
    contents:
      '상담사: 처음 뵙겠습니다. 오늘 상담을 신청하신 계기가 있으신가요? 내담자: 네, 최근에 이혼을 하게 되면서 많이 힘들어서 도움이 필요할 것 같아요. 상담사: 많이 힘드셨겠어요. 천천히 이야기 나눠보도록 하겠습니다.',
    created_at: '2024-02-14T10:00:00',
  },
  {
    id: 't3c4d5e6-f7a8-4b9c-0d1e-2f3a4b5c6d7e',
    session_id: 'c3d4e5f6-a7b8-4c9d-0e1f-2a3b4c5d6e7f',
    user_id: 'counselor-1',
    title: '김성곤 2회기',
    counsel_date: '2024-02-13',
    contents:
      '상담사: 지난주에 이야기했던 목표에 대해 실천해보셨나요? 내담자: 네, 매일 아침 감사 일기를 쓰려고 노력했어요. 상담사: 좋습니다. 어떤 변화가 있으셨나요? 내담자: 작은 것에도 감사함을 느끼게 되더라고요.',
    created_at: '2024-02-13T15:00:00',
  },
  {
    id: 't5e6f7a8-b9c0-4d1e-2f3a-4b5c6d7e8f9a',
    session_id: 'e5f6a7b8-c9d0-4e1f-2a3b-4c5d6e7f8a9b',
    user_id: 'counselor-1',
    title: '최유진 1회기',
    counsel_date: '2024-02-11',
    contents:
      '상담사: 안녕하세요. 오늘 처음 상담이시네요. 편하게 이야기해주세요. 내담자: 제가 불안장애가 있는 것 같아서요. 항상 무언가 잘못될 것 같은 생각이 들어요. 상담사: 그런 생각이 언제부터 시작되셨나요?',
    created_at: '2024-02-11T11:00:00',
  },
  {
    id: 't6f7a8b9-c0d1-4e2f-3a4b-5c6d7e8f9a0b',
    session_id: 'f6a7b8c9-d0e1-4f2a-3b4c-5d6e7f8a9b0c',
    user_id: 'counselor-1',
    title: '정수현 8회기',
    counsel_date: '2024-02-10',
    contents:
      '상담사: 오늘로 8회기가 되었네요. 그동안 많은 변화가 있으셨어요. 내담자: 네, 처음 왔을 때보다 많이 나아진 것 같아요. 우울한 기분도 많이 줄었고요. 상담사: 정말 다행입니다. 스스로 노력하신 결과예요.',
    created_at: '2024-02-10T14:00:00',
  },
  {
    id: 't7a8b9c0-d1e2-4f3a-4b5c-6d7e8f9a0b1c',
    session_id: 'a7b8c9d0-e1f2-4a3b-4c5d-6e7f8a9b0c1d',
    user_id: 'counselor-1',
    title: '이지은 2회기',
    counsel_date: '2024-02-09',
    contents:
      '상담사: 지난번 상담 이후 어떠셨나요? 내담자: 조금 나아진 것 같기도 하고, 여전히 힘들기도 해요. 밤에 잠을 잘 못 자겠어요. 상담사: 수면 패턴이 불규칙하신가요? 구체적으로 말씀해주시겠어요?',
    created_at: '2024-02-09T10:30:00',
  },
  {
    id: 't9c0d1e2-f3a4-4b5c-6d7e-8f9a0b1c2d3e',
    session_id: 'c9d0e1f2-a3b4-4c5d-6e7f-8a9b0c1d2e3f',
    user_id: 'counselor-1',
    title: '김성곤 1회기',
    counsel_date: '2024-02-01',
    contents:
      '상담사: 처음 오신 것을 환영합니다. 오늘은 어떤 이야기를 나누고 싶으신가요? 내담자: 최근에 퇴사를 하게 되어서 진로에 대한 고민이 있습니다. 상담사: 퇴사를 결정하신 이유가 있으신가요?',
    created_at: '2024-02-01T09:00:00',
  },
  {
    id: 't0d1e2f3-a4b5-4c6d-7e8f-9a0b1c2d3e4f',
    session_id: 'd0e1f2a3-b4c5-4d6e-7f8a-9b0c1d2e3f4a',
    user_id: 'counselor-1',
    title: '윤서아 4회기',
    counsel_date: '2024-01-28',
    contents:
      '상담사: 지난 회기에서 과제로 드렸던 것 실천해보셨나요? 내담자: 네, 매일 운동을 30분씩 하려고 노력했어요. 확실히 기분이 좀 나아지는 것 같아요. 상담사: 정말 잘하셨어요. 규칙적인 운동이 도움이 되셨네요.',
    created_at: '2024-01-28T15:30:00',
  },
];

export const mockCounselNotes: CounselNote[] = [
  {
    id: 'n1a2b3c4-d5e6-4f7a-8b9c-0d1e2f3a4b5c',
    session_id: 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d',
    user_id: 'counselor-1',
    title: 'SOAP 노트',
    template_id: 'template-soap',
    summary:
      'S: 직장 상사와의 관계 문제\nO: 의견 표현 시 무시당하는 느낌\nA: 자존감 저하\nP: 의사소통 기술 훈련',
    created_at: '2024-02-15T15:00:00',
  },
  {
    id: 'n2a3b4c5-d6e7-4f8a-9b0c-1d2e3f4a5b6c',
    session_id: 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d',
    user_id: 'counselor-1',
    title: '마음토스 상담 노트',
    template_id: 'template-mindthos',
    summary:
      '내담자는 직장에서의 스트레스를 호소함. 특히 상사와의 관계에서 자신의 의견이 무시당한다고 느끼고 있음.',
    created_at: '2024-02-15T15:10:00',
  },
  {
    id: 'n3b4c5d6-e7f8-4a9b-0c1d-2e3f4a5b6c7d',
    session_id: 'b2c3d4e5-f6a7-4b8c-9d0e-1f2a3b4c5d6e',
    user_id: 'counselor-1',
    title: 'SOAP 노트',
    template_id: 'template-soap',
    summary:
      'S: 이혼 후 심리적 어려움\nO: 우울감, 무기력\nA: 적응장애 가능성\nP: 심리 지지 및 감정 표현 훈련',
    created_at: '2024-02-14T10:30:00',
  },
  {
    id: 'n4c5d6e7-f8a9-4b0c-1d2e-3f4a5b6c7d8e',
    session_id: 'c3d4e5f6-a7b8-4c9d-0e1f-2a3b4c5d6e7f',
    user_id: 'counselor-1',
    title: '마음토스 상담 노트',
    template_id: 'template-mindthos',
    summary:
      '감사 일기 실천을 통해 긍정적인 변화를 경험하고 있음. 작은 것에도 감사함을 느끼게 됨.',
    created_at: '2024-02-13T15:30:00',
  },
  {
    id: 'n5d6e7f8-a9b0-4c1d-2e3f-4a5b6c7d8e9f',
    session_id: 'd4e5f6a7-b8c9-4d0e-1f2a-3b4c5d6e7f8a',
    user_id: 'counselor-1',
    title: 'SOAP 노트',
    template_id: 'template-soap',
    summary:
      'S: 부부 간 대화 단절\nO: 서로 피곤해서 짜증만 남\nA: 의사소통 패턴 개선 필요\nP: 부부 대화법 교육',
    created_at: '2024-02-12T17:00:00',
  },
  {
    id: 'n6e7f8a9-b0c1-4d2e-3f4a-5b6c7d8e9f0a',
    session_id: 'd4e5f6a7-b8c9-4d0e-1f2a-3b4c5d6e7f8a',
    user_id: 'counselor-1',
    title: '마음토스 상담 노트',
    template_id: 'template-mindthos',
    summary: '부부 관계 개선을 위한 상담 시작. 의사소통 문제가 주요 이슈.',
    created_at: '2024-02-12T17:10:00',
  },
  {
    id: 'n7f8a9b0-c1d2-4e3f-4a5b-6c7d8e9f0a1b',
    session_id: 'e5f6a7b8-c9d0-4e1f-2a3b-4c5d6e7f8a9b',
    user_id: 'counselor-1',
    title: 'SOAP 노트',
    template_id: 'template-soap',
    summary:
      'S: 불안장애 증상\nO: 지속적인 걱정\nA: 불안장애 의심\nP: 인지행동치료 시작',
    created_at: '2024-02-11T11:30:00',
  },
  {
    id: 'n8a9b0c1-d2e3-4f4a-5b6c-7d8e9f0a1b2c',
    session_id: 'f6a7b8c9-d0e1-4f2a-3b4c-5d6e7f8a9b0c',
    user_id: 'counselor-1',
    title: '마음토스 상담 노트',
    template_id: 'template-mindthos',
    summary:
      '8회기 완료. 우울증 증상 많이 개선됨. 긍정적인 변화를 스스로 인식하고 있음.',
    created_at: '2024-02-10T14:30:00',
  },
  {
    id: 'n9b0c1d2-e3f4-4a5b-6c7d-8e9f0a1b2c3d',
    session_id: 'a7b8c9d0-e1f2-4a3b-4c5d-6e7f8a9b0c1d',
    user_id: 'counselor-1',
    title: 'SOAP 노트',
    template_id: 'template-soap',
    summary: 'S: 수면 장애\nO: 밤에 잠을 잘 못 잠\nA: 불면증\nP: 수면위생 교육',
    created_at: '2024-02-09T11:00:00',
  },
  {
    id: 'n0c1d2e3-f4a5-4b6c-7d8e-9f0a1b2c3d4e',
    session_id: 'a7b8c9d0-e1f2-4a3b-4c5d-6e7f8a9b0c1d',
    user_id: 'counselor-1',
    title: '마음토스 상담 노트',
    template_id: 'template-mindthos',
    summary: '이혼 후 수면 문제가 지속되고 있음. 수면 패턴 개선 필요.',
    created_at: '2024-02-09T11:10:00',
  },
  {
    id: 'n1d2e3f4-a5b6-4c7d-8e9f-0a1b2c3d4e5f',
    session_id: 'c9d0e1f2-a3b4-4c5d-6e7f-8a9b0c1d2e3f',
    user_id: 'counselor-1',
    title: 'SOAP 노트',
    template_id: 'template-soap',
    summary:
      'S: 진로 고민\nO: 퇴사 후 방향성 상실\nA: 진로 불안\nP: 진로 탐색 및 자기이해',
    created_at: '2024-02-01T09:30:00',
  },
  {
    id: 'n2e3f4a5-b6c7-4d8e-9f0a-1b2c3d4e5f6a',
    session_id: 'c9d0e1f2-a3b4-4c5d-6e7f-8a9b0c1d2e3f',
    user_id: 'counselor-1',
    title: '마음토스 상담 노트',
    template_id: 'template-mindthos',
    summary: '퇴사 후 진로에 대한 고민. 자신의 강점과 가치관 탐색 필요.',
    created_at: '2024-02-01T09:40:00',
  },
  {
    id: 'n3f4a5b6-c7d8-4e9f-0a1b-2c3d4e5f6a7b',
    session_id: 'd0e1f2a3-b4c5-4d6e-7f8a-9b0c1d2e3f4a',
    user_id: 'counselor-1',
    title: '마음토스 상담 노트',
    template_id: 'template-mindthos',
    summary: '운동 습관 형성 과제 성공적으로 수행. 기분 개선 효과 확인.',
    created_at: '2024-01-28T16:00:00',
  },
];

export const mockClients = {
  '1': { id: '1', name: '김성곤' },
  '2': { id: '2', name: '이지은' },
  '3': { id: '3', name: '박민수' },
  '4': { id: '4', name: '최유진' },
  '5': { id: '5', name: '정수현' },
  '6': { id: '6', name: '강민지' },
  '7': { id: '7', name: '윤서아' },
};

export const mockSessionClientMapping: Record<string, string> = {
  'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d': '1',
  'b2c3d4e5-f6a7-4b8c-9d0e-1f2a3b4c5d6e': '2',
  'c3d4e5f6-a7b8-4c9d-0e1f-2a3b4c5d6e7f': '1',
  'd4e5f6a7-b8c9-4d0e-1f2a-3b4c5d6e7f8a': '3',
  'e5f6a7b8-c9d0-4e1f-2a3b-4c5d6e7f8a9b': '4',
  'f6a7b8c9-d0e1-4f2a-3b4c-5d6e7f8a9b0c': '5',
  'a7b8c9d0-e1f2-4a3b-4c5d-6e7f8a9b0c1d': '2',
  'b8c9d0e1-f2a3-4b4c-5d6e-7f8a9b0c1d2e': '6',
  'c9d0e1f2-a3b4-4c5d-6e7f-8a9b0c1d2e3f': '1',
  'd0e1f2a3-b4c5-4d6e-7f8a-9b0c1d2e3f4a': '7',
};

export const mockSessionNumbers: Record<string, number> = {
  'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d': 3,
  'b2c3d4e5-f6a7-4b8c-9d0e-1f2a3b4c5d6e': 1,
  'c3d4e5f6-a7b8-4c9d-0e1f-2a3b4c5d6e7f': 2,
  'd4e5f6a7-b8c9-4d0e-1f2a-3b4c5d6e7f8a': 5,
  'e5f6a7b8-c9d0-4e1f-2a3b-4c5d6e7f8a9b': 1,
  'f6a7b8c9-d0e1-4f2a-3b4c-5d6e7f8a9b0c': 8,
  'a7b8c9d0-e1f2-4a3b-4c5d-6e7f8a9b0c1d': 2,
  'b8c9d0e1-f2a3-4b4c-5d6e-7f8a9b0c1d2e': 3,
  'c9d0e1f2-a3b4-4c5d-6e7f-8a9b0c1d2e3f': 1,
  'd0e1f2a3-b4c5-4d6e-7f8a-9b0c1d2e3f4a': 4,
};

export const buildSessionRecords = (): SessionRecord[] => {
  return mockSessions.map((session) => {
    const clientId = mockSessionClientMapping[session.id];
    const client = mockClients[clientId as keyof typeof mockClients];
    const transcribe = mockTranscribes.find((t) => t.session_id === session.id);
    const counselNotes = mockCounselNotes.filter(
      (n) => n.session_id === session.id
    );

    const noteTypes: Array<'SOAP' | 'mindthos'> = [];
    counselNotes.forEach((note) => {
      if (note.template_id === 'template-soap' && !noteTypes.includes('SOAP')) {
        noteTypes.push('SOAP');
      }
      if (
        note.template_id === 'template-mindthos' &&
        !noteTypes.includes('mindthos')
      ) {
        noteTypes.push('mindthos');
      }
    });

    return {
      session_id: session.id,
      transcribe_id: transcribe?.id || null,
      client_id: clientId,
      client_name: client?.name || 'Unknown',
      session_number: mockSessionNumbers[session.id] || 1,
      content: transcribe?.contents || '녹취록이 없습니다.',
      note_types: noteTypes,
      created_at: session.created_at,
    };
  });
};

import { create } from 'zustand';

/**
 * 문서 관리 임시 백엔드 (zustand).
 * 내담자 탭 등 다른 화면과 한 세션 안에서 공유돼야 해서 전역 스토어로 둔다.
 * 새로고침 시 초기화 — 백엔드 연결 시 이 스토어의 액션 내부만 API 호출로 교체.
 */

export type DocumentCategory = 'ethics' | 'preparation' | 'assessment';

export interface CounselDocument {
  id: string;
  title: string;
  /** 카드 설명 (예: "내담자 서명", "10개 문항 질문") */
  description: string;
  category: DocumentCategory;
  /** 문서 본문 — 기본 문서는 추후 채움, 내 문서는 커스텀 작업 예정 */
  content: string | null;
}

/** 마음토스 기본 문서 — 고정 목록 (추가/삭제 불가) */
export const DEFAULT_DOCUMENTS: CounselDocument[] = [
  {
    id: 'default-consent-counseling',
    title: '심리상담 동의서',
    description: '내담자 서명',
    category: 'ethics',
    content: null,
  },
  {
    id: 'default-consent-recording',
    title: '축어록 녹음 동의서',
    description: '내담자 서명',
    category: 'ethics',
    content: null,
  },
  {
    id: 'default-pledge-life',
    title: '생명존중 서약서',
    description: '내담자 서명',
    category: 'ethics',
    content: null,
  },
  {
    id: 'default-application',
    title: '상담 신청서',
    description: '10개 문항 질문',
    category: 'preparation',
    content: null,
  },
  {
    id: 'default-intake-interview',
    title: '심화 면접지',
    description: '24개 문항 질문',
    category: 'preparation',
    content: null,
  },
  {
    id: 'default-phq9',
    title: 'PHQ-9',
    description: '9개 문항 질문',
    category: 'assessment',
    content: null,
  },
  {
    id: 'default-gad7',
    title: 'GAD-7',
    description: '7개 문항 질문',
    category: 'assessment',
    content: null,
  },
  {
    id: 'default-sct',
    title: 'SCT(문장 완성 검사)',
    description: '52개 문항 질문',
    category: 'assessment',
    content: null,
  },
];

/** 내 문서 양식 종류 — 카드 desc와 (추후) 내부 편집 UI를 결정 */
export type MyDocumentKind = 'consent' | 'qna';

/** 내 문서 — 기본 문서와 카드 구성이 달라 별도 모델 */
export interface MyDocument {
  id: string;
  title: string;
  kind: MyDocumentKind;
  /** 등록일 (ISO) */
  createdAt: string;
  /** 문서 본문 — 내부 상세는 후속 작업 */
  content: string | null;
}

interface DocumentState {
  /** 내 문서 — 세션 내 추가/삭제 가능 */
  myDocuments: MyDocument[];
  addMyDocument: (doc: {
    title: string;
    kind: MyDocumentKind;
    /** 동의서=HTML 문자열, 질문·응답=질문 배열 JSON 문자열 */
    content?: string | null;
  }) => void;
  /** 편집 저장 — 제목·본문만 갱신 (kind·등록일 유지) */
  updateMyDocument: (
    id: string,
    patch: { title: string; content: string | null }
  ) => void;
  removeMyDocument: (id: string) => void;
}

export const useDocumentStore = create<DocumentState>((set) => ({
  myDocuments: [],
  addMyDocument: ({ title, kind, content = null }) =>
    set((state) => ({
      myDocuments: [
        ...state.myDocuments,
        {
          id: `my-doc-${Date.now()}`,
          title,
          kind,
          createdAt: new Date().toISOString(),
          content,
        },
      ],
    })),
  updateMyDocument: (id, patch) =>
    set((state) => ({
      myDocuments: state.myDocuments.map((d) =>
        d.id === id ? { ...d, ...patch } : d
      ),
    })),
  removeMyDocument: (id) =>
    set((state) => ({
      myDocuments: state.myDocuments.filter((d) => d.id !== id),
    })),
}));

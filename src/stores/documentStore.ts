import { create } from 'zustand';

import { documentDataSource } from '@/features/document/adapters';

/**
 * 문서 관리 스토어 (zustand).
 * 내담자 탭 등 다른 화면과 한 세션 안에서 공유돼야 해서 전역 스토어로 둔다.
 * 데이터는 documentDataSource 어댑터(real ↔ mock) 경유로 서버와 연결된다.
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
  /** 마음토스 기본 문서(템플릿) — 서버 목록에서 로드 */
  templates: CounselDocument[];
  /** 내 문서 — 추가/수정/삭제 가능 */
  myDocuments: MyDocument[];
  /** 목록 로딩 여부 */
  loading: boolean;
  /** 문서 목록 조회 (templates + myDocuments) */
  loadDocuments: () => Promise<void>;
  /** 내 문서 단건 조회 (content 포함) — 편집/뷰에서 사용 */
  getMyDocument: (id: string) => Promise<MyDocument>;
  /** 기본 문서(템플릿) 단건 조회 (content 포함) */
  getTemplate: (id: string) => Promise<CounselDocument>;
  addMyDocument: (doc: {
    title: string;
    kind: MyDocumentKind;
    /** 동의서=HTML 문자열, 질문·응답=질문 배열 JSON 문자열 */
    content?: string | null;
  }) => Promise<MyDocument>;
  /** 편집 저장 — 제목·본문만 갱신 (kind·등록일 유지) */
  updateMyDocument: (
    id: string,
    patch: { title: string; content: string | null }
  ) => Promise<void>;
  removeMyDocument: (id: string) => Promise<void>;
}

export const useDocumentStore = create<DocumentState>((set, get) => ({
  templates: [],
  myDocuments: [],
  loading: false,
  loadDocuments: async () => {
    set({ loading: true });
    try {
      const { templates, myDocuments } =
        await documentDataSource.listDocuments();
      set({ templates, myDocuments });
    } finally {
      set({ loading: false });
    }
  },
  getMyDocument: (id) => documentDataSource.getMyDocument(id),
  getTemplate: (id) => documentDataSource.getTemplate(id),
  addMyDocument: async ({ title, kind, content = null }) => {
    const created = await documentDataSource.createMyDocument({
      title,
      kind,
      content,
    });
    set((state) => ({ myDocuments: [...state.myDocuments, created] }));
    return created;
  },
  updateMyDocument: async (id, patch) => {
    // content 봉투 매핑에 kind가 필요 — 현재 상태에서 읽는다.
    const kind =
      get().myDocuments.find((d) => d.id === id)?.kind ?? 'consent';
    const updated = await documentDataSource.updateMyDocument(id, patch, kind);
    set((state) => ({
      myDocuments: state.myDocuments.map((d) => (d.id === id ? updated : d)),
    }));
  },
  removeMyDocument: async (id) => {
    await documentDataSource.deleteMyDocument(id);
    set((state) => ({
      myDocuments: state.myDocuments.filter((d) => d.id !== id),
    }));
  },
}));

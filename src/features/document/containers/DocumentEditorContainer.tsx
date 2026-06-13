import { useState } from 'react';

import { ChevronLeft } from 'lucide-react';
import { useParams, useSearchParams } from 'react-router-dom';

import { getDocumentViewRoute, ROUTES } from '@/app/router/constants';
import { useDevice } from '@/shared/hooks/useDevice';
import { useNavigateWithUtm } from '@/shared/hooks/useNavigateWithUtm';
import { useDocumentStore, type MyDocumentKind } from '@/stores/documentStore';

import { ConsentEditor } from '../components/editor/ConsentEditor';
import { QnaEditor } from '../components/editor/QnaEditor';
import { MY_DOCUMENT_KIND_LABEL } from '../constants/myDocument';
import {
  createQnaQuestion,
  hasEmptyQnaOption,
  parseQnaQuestions,
} from '../constants/qnaQuestion';
import type { QnaQuestion } from '../types';

/** ?kind= 쿼리 파싱 (미지정/오류 시 동의서) */
function parseKind(value: string | null): MyDocumentKind {
  return value === 'qna' ? 'qna' : 'consent';
}

/**
 * 내 문서 제작/편집 뷰.
 * 생성: 팝오버에서 종류 선택 후 /documents/new?kind= 진입, 저장 시 내 문서 생성.
 * 편집: 뷰 페이지에서 /documents/:documentId/edit 진입 — 저장된 상태 그대로
 * 로드하고, 저장 시 해당 문서 갱신 후 뷰 페이지로 복귀.
 * 동의서: 텍스트 본문 + 글자 스타일 / 질문·응답: 질문 객체 목록.
 */
export function DocumentEditorContainer() {
  const [searchParams] = useSearchParams();
  const { documentId } = useParams();
  const { navigateWithUtm } = useNavigateWithUtm();
  const { isMobile, isTablet } = useDevice();
  const isMobileView = isMobile || isTablet;
  const addMyDocument = useDocumentStore((state) => state.addMyDocument);
  const updateMyDocument = useDocumentStore((state) => state.updateMyDocument);
  // 편집 모드 — :documentId가 있으면 해당 문서를 로드
  const editingDocument = useDocumentStore((state) =>
    documentId ? state.myDocuments.find((d) => d.id === documentId) : undefined
  );

  const kind = editingDocument?.kind ?? parseKind(searchParams.get('kind'));

  const [title, setTitle] = useState(editingDocument?.title ?? '');
  // 동의서 본문 (HTML 문자열)
  const [consentHtml, setConsentHtml] = useState(
    editingDocument?.kind === 'consent' ? (editingDocument.content ?? '') : ''
  );
  // 질문·응답 질문 목록 — 생성 시 기본 단일 선택 질문 1개, 편집 시 저장본 로드
  const [questions, setQuestions] = useState<QnaQuestion[]>(() =>
    editingDocument?.kind === 'qna'
      ? parseQnaQuestions(editingDocument.content)
      : [createQnaQuestion()]
  );

  // 뒤로가기/취소 — 편집은 뷰 페이지로, 생성은 목록으로
  const goBack = () => {
    navigateWithUtm(
      editingDocument
        ? getDocumentViewRoute(editingDocument.id)
        : ROUTES.DOCUMENTS
    );
  };

  // 질문·응답은 항목 1개 이상 + 선택형 항목에 빈 옵션이 없어야 저장 가능
  const canSave =
    title.trim().length > 0 &&
    (kind === 'consent' ||
      (questions.length > 0 && !questions.some(hasEmptyQnaOption)));

  const handleSave = () => {
    if (!canSave) return;
    const content =
      kind === 'consent'
        ? consentHtml.trim() || null
        : JSON.stringify(questions);
    if (editingDocument) {
      updateMyDocument(editingDocument.id, { title: title.trim(), content });
    } else {
      addMyDocument({ title: title.trim(), kind, content });
    }
    goBack();
  };

  // 편집 URL로 직접 진입했는데 문서가 없는 경우 (스토어는 새로고침 시 초기화)
  if (documentId && !editingDocument) {
    return (
      <div className="mx-auto w-full max-w-[1364px] px-4 py-6 md:px-10 lg:px-16 lg:py-[42px]">
        <div className="flex items-center gap-6">
          <button
            type="button"
            aria-label="문서 관리로 돌아가기"
            onClick={() => navigateWithUtm(ROUTES.DOCUMENTS)}
            className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg border border-grey-40 bg-grey-10 text-grey-70 transition-colors lg:hover:bg-grey-20"
          >
            <ChevronLeft size={22} />
          </button>
          <h1 className="text-2xl font-headline text-grey-100">문서 편집</h1>
        </div>
        <p className="mt-10 text-m font-medium text-grey-80">
          문서를 찾을 수 없습니다.
        </p>
      </div>
    );
  }

  return (
    <div
      className={
        isMobileView
          ? 'w-full'
          : 'mx-auto w-full max-w-[1364px] px-4 py-4 md:px-10 lg:px-16 lg:py-[42px]'
      }
    >
      {/* 헤더: 뒤로가기 + 빈 문서(생성)/양식 종류(편집) — 모바일은 브라우저 뒤로가기 사용 */}
      {!isMobileView && (
        <div className="flex items-center gap-6">
          <button
            type="button"
            aria-label="뒤로가기"
            onClick={goBack}
            className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg border border-grey-40 bg-grey-10 text-grey-70 transition-colors lg:hover:bg-grey-20"
          >
            <ChevronLeft size={22} />
          </button>
          <h1 className="text-2xl font-headline text-grey-100">
            {editingDocument ? MY_DOCUMENT_KIND_LABEL[kind] : '빈 문서'}
          </h1>
        </div>
      )}

      {/* 제작 캔버스 카드 */}
      <div
        className={
          isMobileView
            ? 'relative min-h-[calc(100dvh-64px)] bg-white px-4 pb-10 pt-4'
            : 'relative mt-8 min-h-[700px] rounded-2xl border border-grey-40 bg-white px-6 pb-10 pt-8 lg:px-12'
        }
      >
        {/* 취소 / 저장 — 데스크탑은 우상단 고정, 모바일은 상단 행 */}
        <div
          className={
            isMobileView
              ? 'flex items-center justify-end gap-3'
              : 'absolute right-9 top-8 flex items-center gap-3'
          }
        >
          <button
            type="button"
            onClick={goBack}
            className="h-[31px] rounded-lg border border-grey-30 bg-white px-3.5 text-m font-medium text-grey-70 transition-colors lg:hover:bg-grey-10"
          >
            취소
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={!canSave}
            className={`h-[31px] rounded-lg px-3.5 text-m font-medium text-white transition-opacity ${
              canSave
                ? 'bg-green-80 lg:hover:opacity-90'
                : 'cursor-not-allowed bg-grey-40'
            }`}
          >
            저장
          </button>
        </div>

        {/* 제목 */}
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="제목을 입력해주세요"
          aria-label="문서 제목"
          className={`mx-auto block w-full max-w-[851px] bg-transparent text-center font-emphasize text-grey-100 placeholder:text-grey-60 focus:outline-none ${
            isMobileView
              ? 'mt-4 text-xl leading-[29px]'
              : 'mt-12 text-[32px] leading-[38px]'
          }`}
        />
        <div
          className={`mx-auto w-full max-w-[851px] border-b border-grey-40 ${isMobileView ? 'mt-6' : 'mt-12'}`}
        />

        {/* 종류별 본문 에디터 */}
        {kind === 'consent' ? (
          <ConsentEditor
            initialHtml={consentHtml || undefined}
            onContentChange={setConsentHtml}
          />
        ) : (
          <QnaEditor questions={questions} onQuestionsChange={setQuestions} />
        )}
      </div>
    </div>
  );
}

export default DocumentEditorContainer;

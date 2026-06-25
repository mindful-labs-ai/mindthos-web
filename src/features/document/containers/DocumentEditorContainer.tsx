import { useEffect, useState } from 'react';

import { ChevronLeft } from 'lucide-react';
import { useParams, useSearchParams } from 'react-router-dom';

import { getDocumentViewRoute, ROUTES } from '@/app/router/constants';
import { useDevice } from '@/shared/hooks/useDevice';
import { useNavigateWithUtm } from '@/shared/hooks/useNavigateWithUtm';
import {
  useDocumentStore,
  type MyDocument,
  type MyDocumentKind,
} from '@/stores/documentStore';

import { QnaEditor } from '../components/editor/QnaEditor';
import {
  buildContent,
  createField,
  parseFields,
  validateFields,
} from '../constants/formField';
import { MY_DOCUMENT_KIND_LABEL } from '../constants/myDocument';
import type { FormField } from '../types';

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
  const getMyDocument = useDocumentStore((state) => state.getMyDocument);

  // 편집 모드 — :documentId가 있으면 단건 조회로 content까지 로드 (목록엔 content 없음)
  const [editingDocument, setEditingDocument] = useState<MyDocument | null>(
    null
  );
  // 편집 모드 로딩/없음 판정 (생성 모드는 즉시 준비됨)
  const [editLoading, setEditLoading] = useState(!!documentId);
  const [editNotFound, setEditNotFound] = useState(false);

  const kind = editingDocument?.kind ?? parseKind(searchParams.get('kind'));

  const [title, setTitle] = useState('');
  // 통합 필드 목록 — kind 무관 단일 모델. 생성 시 기본 필드 1개, 편집 시 저장본 로드.
  const [fields, setFields] = useState<FormField[]>(() => [createField()]);

  // 편집 모드: 단건 조회 후 에디터 상태(제목·필드) 채우기
  useEffect(() => {
    if (!documentId) return;
    let active = true;
    getMyDocument(documentId)
      .then((doc) => {
        if (!active) return;
        setEditingDocument(doc);
        setTitle(doc.title);
        // content(DocumentContent 문자열) → 필드. 구/빈 content면 빈 목록으로 시작.
        const loaded = parseFields(doc.content);
        setFields(loaded.length > 0 ? loaded : [createField()]);
      })
      .catch(() => {
        if (active) setEditNotFound(true);
      })
      .finally(() => {
        if (active) setEditLoading(false);
      });
    return () => {
      active = false;
    };
  }, [documentId, getMyDocument]);

  // 뒤로가기/취소 — 편집은 뷰 페이지로, 생성은 목록으로
  const goBack = () => {
    navigateWithUtm(
      editingDocument
        ? getDocumentViewRoute(editingDocument.id)
        : ROUTES.DOCUMENTS
    );
  };

  // 임시 QA 정책: 저장 버튼은 서버 전송 가능 상태(COMPLETED)로 저장한다.
  const canSave = title.trim().length > 0 && validateFields(fields);

  const handleSave = async () => {
    if (!canSave) return;
    const content = buildContent(fields);
    if (editingDocument) {
      await updateMyDocument(editingDocument.id, {
        title: title.trim(),
        content,
        status: 'completed',
      });
    } else {
      await addMyDocument({
        title: title.trim(),
        kind,
        content,
        status: 'completed',
      });
    }
    goBack();
  };

  // 편집 모드 단건 조회 중 — 에디터가 빈 상태로 깜빡이지 않도록 로딩 표시
  if (documentId && editLoading) {
    return (
      <div className="mx-auto w-full max-w-[1364px] px-4 py-6 md:px-10 lg:px-16 lg:py-[42px]">
        <p className="mt-10 text-m font-medium text-grey-80">
          문서를 불러오는 중입니다...
        </p>
      </div>
    );
  }

  // 편집 URL로 직접 진입했는데 문서가 없는 경우
  if (documentId && (editNotFound || !editingDocument)) {
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

        {/* 통합 필드 에디터 — kind 무관 단일 모델(9개 필드 유형 모두 사용 가능) */}
        <QnaEditor fields={fields} onFieldsChange={setFields} />
      </div>
    </div>
  );
}

export default DocumentEditorContainer;

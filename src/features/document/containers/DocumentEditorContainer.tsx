import { useEffect, useState } from 'react';

import { ChevronLeft } from 'lucide-react';
import { useParams, useSearchParams } from 'react-router-dom';

import { getDocumentViewRoute, ROUTES } from '@/app/router/constants';
import { ServerApiError } from '@/shared/api/server/serverClient';
import { useDevice } from '@/shared/hooks/useDevice';
import { useNavigateWithUtm } from '@/shared/hooks/useNavigateWithUtm';
import { Modal } from '@/shared/ui/composites/Modal';
import { useToast } from '@/shared/ui/composites/Toast';
import {
  useDocumentStore,
  type MyDocument,
  type MyDocumentKind,
  type MyDocumentStatus,
} from '@/stores/documentStore';

import { QnaEditor } from '../components/editor/QnaEditor';
import { RichTextEditor } from '../components/editor/RichTextEditor';
import {
  buildConsentContent,
  buildContent,
  createField,
  extractConsentHtml,
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
  const { toast } = useToast();

  // 편집 모드 — :documentId가 있으면 단건 조회로 content까지 로드 (목록엔 content 없음)
  const [editingDocument, setEditingDocument] = useState<MyDocument | null>(
    null
  );
  // 편집 모드 로딩/없음 판정 (생성 모드는 즉시 준비됨)
  const [editLoading, setEditLoading] = useState(!!documentId);
  const [editNotFound, setEditNotFound] = useState(false);

  const kind = editingDocument?.kind ?? parseKind(searchParams.get('kind'));

  const [title, setTitle] = useState('');
  // 질문·응답(qna) 필드 목록. 생성 시 기본 필드 1개, 편집 시 저장본 로드.
  const [fields, setFields] = useState<FormField[]>(() => [createField()]);
  // 동의서(consent) 본문 — 텍스트+도구모음 에디터의 HTML 문자열.
  const [consentHtml, setConsentHtml] = useState('');
  // 필수 미충족 저장 시도 후 하이라이트 노출 여부 (한번 켜지면 유지 — 채우면 필드별 자동 해제)
  const [showValidation, setShowValidation] = useState(false);
  // 발송 불가(편집 중) 상태로 저장할지 확인하는 모달
  const [incompleteOpen, setIncompleteOpen] = useState(false);

  // 편집 모드: 단건 조회 후 에디터 상태(제목·본문) 채우기
  useEffect(() => {
    if (!documentId) return;
    let active = true;
    getMyDocument(documentId)
      .then((doc) => {
        if (!active) return;
        setEditingDocument(doc);
        setTitle(doc.title);
        if (doc.kind === 'consent') {
          // 동의서는 본문 richtext 필드의 HTML만 에디터로 로드한다.
          setConsentHtml(extractConsentHtml(doc.content));
        } else {
          // qna: content → 필드. 구/빈 content면 빈 목록으로 시작.
          const loaded = parseFields(doc.content);
          setFields(loaded.length > 0 ? loaded : [createField()]);
        }
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

  // 발송 가능(모든 필수 충족) 여부 — 저장 상태(completed/draft)와 하이라이트를 가른다.
  // 제목 + 본문(동의서=본문 HTML / qna=필드 유효성).
  const isTitleValid = title.trim().length > 0;
  const isBodyValid =
    kind === 'consent' ? consentHtml.trim().length > 0 : validateFields(fields);
  const isSendable = isTitleValid && isBodyValid;

  // 실제 저장 — 발송 가능이면 completed, 아니면 draft(편집 중)로 보관. 항상 저장은 되고,
  // draft는 발송 대상 목록에서 제외되고 카드에 '편집 중' 칩으로 표시된다.
  const commitSave = async () => {
    const content =
      kind === 'consent'
        ? buildConsentContent(consentHtml.trim())
        : buildContent(fields);
    const status: MyDocumentStatus = isSendable ? 'completed' : 'draft';
    try {
      if (editingDocument) {
        await updateMyDocument(editingDocument.id, {
          title: title.trim(),
          content,
          status,
        });
      } else {
        await addMyDocument({ title: title.trim(), kind, content, status });
      }
      goBack();
    } catch (error) {
      // 서버가 사유를 준 경우(예: 발송 가능 저장 400) 그 메시지를 그대로 안내, 아니면 일반 문구.
      toast({
        title: '문서 저장 실패',
        description:
          error instanceof ServerApiError
            ? error.message
            : '잠시 후 다시 시도해 주세요.',
      });
    }
  };

  // 저장 버튼 — 상시 활성. 발송 가능이면 즉시 저장, 아니면 하이라이트 + 확인 모달.
  const handleSave = () => {
    if (isSendable) {
      void commitSave();
      return;
    }
    setShowValidation(true);
    setIncompleteOpen(true);
  };

  // 확인 모달에서 '이대로 저장' — 발송 불가(편집 중) 상태로 저장하고 목록/뷰로 복귀.
  const handleSaveIncomplete = () => {
    setIncompleteOpen(false);
    void commitSave();
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
            className="h-[31px] rounded-lg bg-green-80 px-3.5 text-m font-medium text-white transition-opacity lg:hover:opacity-90"
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
          className={`mx-auto block w-full max-w-[851px] bg-transparent text-center font-emphasize text-grey-100 focus:outline-none ${
            showValidation && !isTitleValid
              ? 'placeholder:text-red-80'
              : 'placeholder:text-grey-60'
          } ${
            isMobileView
              ? 'mt-4 text-xl leading-[29px]'
              : 'mt-12 text-[32px] leading-[38px]'
          }`}
        />
        <div
          className={`mx-auto w-full max-w-[851px] border-b ${
            showValidation && !isTitleValid ? 'border-red-80' : 'border-grey-40'
          } ${isMobileView ? 'mt-6' : 'mt-12'}`}
        />

        {/* 동의서: 텍스트+도구모음 본문 에디터 / 질문·응답: 필드 에디터 */}
        {kind === 'consent' ? (
          <RichTextEditor
            initialHtml={consentHtml || undefined}
            onContentChange={setConsentHtml}
            invalid={showValidation && !isBodyValid}
          />
        ) : (
          <QnaEditor
            fields={fields}
            onFieldsChange={setFields}
            showInvalid={showValidation}
          />
        )}
      </div>

      {/* 발송 불가(편집 중) 저장 확인 모달 — 필수 미충족 저장 시 */}
      <Modal
        open={incompleteOpen}
        onOpenChange={setIncompleteOpen}
        className="lg:w-[400px] lg:max-w-[400px]"
      >
        <div className="flex flex-col items-center py-2 text-center">
          <h2 className="text-l font-headline text-grey-100">
            이대로 저장하면 발송할 수 없어요
          </h2>
          <p className="mt-3 text-m font-medium leading-[150%] text-grey-70">
            필수 항목이 비어 있어 내담자에게 보낼 수 없어요. 지금은 &lsquo;편집
            중&rsquo;으로 저장되고, 빨갛게 표시된 항목을 채워 다시 저장하면
            발송할 수 있어요.
          </p>
          <div className="mt-7 flex w-full gap-3">
            <button
              type="button"
              onClick={() => setIncompleteOpen(false)}
              className="h-[44px] flex-1 rounded-lg border border-grey-40 bg-white text-m font-medium text-grey-100 transition-colors lg:hover:bg-grey-10"
            >
              돌아가서 채우기
            </button>
            <button
              type="button"
              onClick={handleSaveIncomplete}
              className="h-[44px] flex-1 rounded-lg bg-green-80 text-m font-emphasize text-white transition-opacity lg:hover:opacity-90"
            >
              이대로 저장
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

export default DocumentEditorContainer;

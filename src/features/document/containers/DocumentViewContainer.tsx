import { useEffect, useState } from 'react';

import { ChevronLeft, Printer } from 'lucide-react';
import { useParams } from 'react-router-dom';

import { getDocumentEditRoute, ROUTES } from '@/app/router/constants';
import { useDevice } from '@/shared/hooks/useDevice';
import { useNavigateWithUtm } from '@/shared/hooks/useNavigateWithUtm';
import { Spinner } from '@/shared/ui';
import { useDocumentStore, type MyDocumentKind } from '@/stores/documentStore';

import { FieldContent } from '../components/FieldContent';
import { parseFields } from '../constants/formField';
import { MY_DOCUMENT_KIND_LABEL } from '../constants/myDocument';
import type { DocumentContent, FieldAnswer } from '../types';

/** 뷰에서 쓰는 통합 표현 — 내 문서(content+kind) / 템플릿(category→kind 파생) 공용 */
interface ViewDocument {
  id: string;
  title: string;
  kind: MyDocumentKind;
  content: DocumentContent | null;
  /** 템플릿(기본 문서)이면 편집 불가 */
  editable: boolean;
}

/**
 * 내 문서 뷰 페이지 — 제작 뷰와 같은 캔버스 레이아웃에 저장된 내용을 렌더링.
 * 동의서=HTML, 질문·응답=항목을 카드 박스 없이 나열 (section 외 질문엔 Q번호).
 * 질문·응답은 화면에서 직접 응답을 채워 출력 가능 — 응답은 저장하지 않는다.
 * 출력하기=브라우저 인쇄(.print-area만 인쇄), 편집=제작 뷰 재사용(/edit).
 */
export function DocumentViewContainer() {
  const { documentId } = useParams();
  const { navigateWithUtm } = useNavigateWithUtm();
  const { isMobile, isTablet } = useDevice();
  const isMobileView = isMobile || isTablet;
  const getMyDocument = useDocumentStore((state) => state.getMyDocument);
  const getTemplate = useDocumentStore((state) => state.getTemplate);

  // 목록엔 content가 없으므로 단건 조회로 로드. 내 문서 우선, 없으면 템플릿 폴백.
  const [document, setDocument] = useState<ViewDocument | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!documentId) return;
    let active = true;
    const load = async (): Promise<ViewDocument | null> => {
      try {
        const my = await getMyDocument(documentId);
        return {
          id: my.id,
          title: my.title,
          kind: my.kind,
          content: my.content,
          editable: true,
        };
      } catch {
        // 내 문서가 아니면 기본 문서(템플릿)로 폴백
        const template = await getTemplate(documentId);
        return {
          id: template.id,
          title: template.title,
          // 템플릿은 kind가 없어 category에서 파생 (윤리=동의서, 그 외=질문·응답)
          kind: template.category === 'ethics' ? 'consent' : 'qna',
          content: template.content,
          editable: false,
        };
      }
    };
    load()
      .then((doc) => {
        if (active) setDocument(doc);
      })
      .catch(() => {
        if (active) setDocument(null);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [documentId, getMyDocument, getTemplate]);

  // 필드 key → 응답 값 — 화면 표시·출력용 임시 상태 (저장 안 함)
  const [answers, setAnswers] = useState<Record<string, FieldAnswer>>({});

  const updateAnswer = (fieldKey: string, answer: FieldAnswer) => {
    setAnswers((prev) => ({ ...prev, [fieldKey]: answer }));
  };

  const goBackToList = () => {
    navigateWithUtm(ROUTES.DOCUMENTS);
  };

  const fields = parseFields(document?.content ?? null);
  // 필드 번호 — section/richtext는 번호를 매기지 않는다
  let fieldNumber = 0;

  return (
    <div className="mx-auto w-full max-w-[1364px] px-4 py-6 md:px-10 lg:px-16 lg:py-[42px]">
      {/* 헤더: 뒤로가기 + 양식 종류 */}
      <div className="flex items-center gap-6">
        <button
          type="button"
          aria-label="문서 관리로 돌아가기"
          onClick={goBackToList}
          className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg border border-grey-40 bg-grey-10 text-grey-70 transition-colors lg:hover:bg-grey-20"
        >
          <ChevronLeft size={22} />
        </button>
        <h1 className="text-2xl font-headline text-grey-100">
          {document ? MY_DOCUMENT_KIND_LABEL[document.kind] : '문서 보기'}
        </h1>
      </div>

      {loading ? (
        <div className="mt-10 flex justify-center">
          <Spinner size="lg" />
        </div>
      ) : !document ? (
        <p className="mt-10 text-m font-medium text-grey-80">
          문서를 찾을 수 없습니다.
        </p>
      ) : (
        <div
          className={`print-area relative rounded-2xl border border-grey-40 bg-white print:border-none ${
            isMobileView
              ? 'mt-4 min-h-[60dvh] px-4 pb-8 pt-4'
              : 'mt-8 min-h-[700px] px-6 pb-10 pt-8 lg:px-12'
          }`}
        >
          {/* 출력하기(데스크탑만) / 편집 — 인쇄 시 숨김 */}
          <div
            className={`flex items-center justify-end gap-3 print:hidden ${
              isMobileView ? '' : 'absolute right-9 top-8'
            }`}
          >
            {!isMobileView && (
              <button
                type="button"
                onClick={() => window.print()}
                className="flex h-8 items-center gap-1 rounded-lg border border-grey-30 bg-white px-3.5 text-m font-medium text-grey-70 transition-colors lg:hover:bg-grey-10"
              >
                <Printer size={20} />
                출력하기
              </button>
            )}
            {document.editable && (
              <button
                type="button"
                onClick={() =>
                  navigateWithUtm(getDocumentEditRoute(document.id))
                }
                className="h-[31px] rounded-lg border border-grey-30 bg-white px-3.5 text-m font-medium text-grey-70 transition-colors lg:hover:bg-grey-10"
              >
                편집
              </button>
            )}
          </div>

          {/* 제목 */}
          <h2
            className={`mx-auto w-full max-w-[851px] text-center font-emphasize text-grey-100 ${
              isMobileView
                ? 'mt-4 text-xl leading-[29px]'
                : 'mt-12 text-[32px] leading-[38px]'
            }`}
          >
            {document.title}
          </h2>
          <div
            className={`mx-auto w-full max-w-[851px] border-b border-grey-40 ${isMobileView ? 'mt-6' : 'mt-12'}`}
          />

          {/* 통합 본문 — 필드를 카드 박스 없이 나열 (section/richtext 외엔 Q번호) */}
          <div
            className={`mx-auto flex w-full max-w-[851px] flex-col pb-6 ${
              isMobileView ? 'mt-6 gap-6' : 'mt-10 gap-10'
            }`}
          >
            {fields.map((field) => {
              const number =
                field.type === 'section' || field.type === 'richtext'
                  ? undefined
                  : ++fieldNumber;
              return (
                <FieldContent
                  key={field.key}
                  field={field}
                  number={number}
                  answer={answers[field.key]}
                  onAnswerChange={(answer) => updateAnswer(field.key, answer)}
                />
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

export default DocumentViewContainer;

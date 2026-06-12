import { useState } from 'react';

import { ChevronLeft, Printer } from 'lucide-react';
import { useParams } from 'react-router-dom';

import { getDocumentEditRoute, ROUTES } from '@/app/router/constants';
import { useNavigateWithUtm } from '@/shared/hooks/useNavigateWithUtm';
import { useDocumentStore } from '@/stores/documentStore';

import { QnaQuestionContent } from '../components/QnaQuestionContent';
import { MY_DOCUMENT_KIND_LABEL } from '../constants/myDocument';
import { parseQnaQuestions } from '../constants/qnaQuestion';
import type { QnaAnswer } from '../types';

/**
 * 내 문서 뷰 페이지 — 제작 뷰와 같은 캔버스 레이아웃에 저장된 내용을 렌더링.
 * 동의서=HTML, 질문·응답=항목을 카드 박스 없이 나열 (section 외 질문엔 Q번호).
 * 질문·응답은 화면에서 직접 응답을 채워 출력 가능 — 응답은 저장하지 않는다.
 * 출력하기=브라우저 인쇄(.print-area만 인쇄), 편집=제작 뷰 재사용(/edit).
 */
export function DocumentViewContainer() {
  const { documentId } = useParams();
  const { navigateWithUtm } = useNavigateWithUtm();
  const document = useDocumentStore((state) =>
    state.myDocuments.find((d) => d.id === documentId)
  );

  // 질문 id → 응답 값 — 화면 표시·출력용 임시 상태 (저장 안 함)
  const [answers, setAnswers] = useState<Record<string, QnaAnswer>>({});

  const updateAnswer = (questionId: string, patch: Partial<QnaAnswer>) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: { ...prev[questionId], ...patch },
    }));
  };

  const goBackToList = () => {
    navigateWithUtm(ROUTES.DOCUMENTS);
  };

  const questions = parseQnaQuestions(document?.content ?? null);
  // 질문 번호 — 제목 및 설명(section)은 번호를 매기지 않는다
  let questionNumber = 0;

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

      {!document ? (
        // 스토어가 세션 임시(새로고침 시 초기화)라 직접 진입하면 문서가 없을 수 있다
        <p className="mt-10 text-m font-medium text-grey-80">
          문서를 찾을 수 없습니다.
        </p>
      ) : (
        <div className="print-area relative mt-8 min-h-[700px] rounded-2xl border border-grey-40 bg-white px-6 pb-10 pt-8 lg:px-12 print:border-none">
          {/* 우상단: 출력하기 / 편집 — 인쇄 시 숨김 */}
          <div className="absolute right-9 top-8 flex items-center gap-3 print:hidden">
            <button
              type="button"
              onClick={() => window.print()}
              className="flex h-8 items-center gap-1 rounded-lg border border-grey-30 bg-white px-3.5 text-m font-medium text-grey-70 transition-colors lg:hover:bg-grey-10"
            >
              <Printer size={20} />
              출력하기
            </button>
            <button
              type="button"
              onClick={() => navigateWithUtm(getDocumentEditRoute(document.id))}
              className="h-[31px] rounded-lg border border-grey-30 bg-white px-3.5 text-m font-medium text-grey-70 transition-colors lg:hover:bg-grey-10"
            >
              편집
            </button>
          </div>

          {/* 제목 */}
          <h2 className="mx-auto mt-12 w-full max-w-[851px] text-center text-[32px] font-emphasize leading-[38px] text-grey-100">
            {document.title}
          </h2>
          <div className="mx-auto mt-12 w-full max-w-[851px] border-b border-grey-40" />

          {/* 종류별 본문 */}
          {document.kind === 'consent' ? (
            <div
              className="mx-auto mt-10 w-full max-w-[851px] text-xl font-medium leading-[150%] text-grey-100 [&_h1]:text-[28px] [&_h1]:font-headline [&_h2]:text-2xl [&_h2]:font-headline"
              // 본인이 제작 뷰에서 작성한 HTML — 백엔드 연결 시 서버 측 sanitize 전제
              dangerouslySetInnerHTML={{ __html: document.content ?? '' }}
            />
          ) : (
            <div className="mx-auto mt-10 flex w-full max-w-[851px] flex-col gap-10 pb-6">
              {questions.map((question) => {
                const number =
                  question.type === 'section' ? undefined : ++questionNumber;
                return (
                  <QnaQuestionContent
                    key={question.id}
                    question={question}
                    number={number}
                    answer={answers[question.id]}
                    onAnswerChange={(patch) => updateAnswer(question.id, patch)}
                  />
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default DocumentViewContainer;

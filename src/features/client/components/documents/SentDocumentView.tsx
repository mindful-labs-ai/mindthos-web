import { ChevronLeft, Printer } from 'lucide-react';

import { QnaQuestionContent } from '@/features/document/components/QnaQuestionContent';
import { parseQnaQuestions } from '@/features/document/constants/qnaQuestion';
import type { SentDocument } from '@/stores/sentDocumentStore';

import { formatSentDate } from './ClientDocumentsTab';

interface SentDocumentViewProps {
  document: SentDocument;
  onBack: () => void;
  /** 모바일 — 뒤로가기/출력 버튼 없이 제목·이력 두 줄 헤더 (닫기는 브라우저 뒤로가기) */
  isMobileView?: boolean;
}

/**
 * 내담자 탭 내부 발송 문서 뷰 — 발송 시점 스냅샷을 읽기 전용으로 렌더링.
 * 헤더(뒤로가기 + 문서 제목 + 발송 이력)와 캔버스(출력하기 포함)로 구성,
 * 출력은 .print-area 규칙을 재사용해 문서 영역만 인쇄된다.
 */
export function SentDocumentView({
  document,
  onBack,
  isMobileView = false,
}: SentDocumentViewProps) {
  const questions =
    document.kind === 'qna' ? parseQnaQuestions(document.content) : [];
  // 질문 번호 — 제목 및 설명(section)은 번호를 매기지 않는다
  let questionNumber = 0;

  const historyParts = [
    `${document.clientName} 내담자`,
    `${formatSentDate(document.sentAt)} 발송됨`,
  ];
  if (document.status === 'completed' && document.completedAt) {
    historyParts.push(`${formatSentDate(document.completedAt)} 완료`);
  }
  if (document.status === 'canceled' && document.canceledAt) {
    historyParts.push(`${formatSentDate(document.canceledAt)} 취소됨`);
  }

  return (
    <div>
      {/* 헤더 — 데스크탑: 뒤로가기+제목+이력 한 줄 / 모바일: 제목·이력 두 줄 */}
      {isMobileView ? (
        <div>
          <h1 className="truncate text-l font-headline text-grey-100">
            {document.title}
          </h1>
          <p className="mt-1.5 text-xs text-grey-70">
            {historyParts.join('  |  ')}
          </p>
        </div>
      ) : (
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex min-w-0 items-center gap-6">
            <button
              type="button"
              aria-label="문서 관리로 돌아가기"
              onClick={onBack}
              className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg border border-grey-40 bg-grey-10 text-grey-70 transition-colors lg:hover:bg-grey-20"
            >
              <ChevronLeft size={22} />
            </button>
            <h1 className="truncate text-2xl font-headline text-grey-100">
              {document.title}
            </h1>
          </div>
          <p className="flex-shrink-0 text-sm text-grey-70">
            {historyParts.join('  |  ')}
          </p>
        </div>
      )}

      {/* 문서 캔버스 */}
      <div
        className={`print-area relative rounded-2xl border border-grey-40 bg-white print:border-none ${
          isMobileView
            ? 'mt-4 min-h-[60dvh] px-4 pb-8 pt-6'
            : 'mt-8 min-h-[700px] px-6 pb-10 pt-8 lg:px-12'
        }`}
      >
        {/* 우상단: 출력하기 — 모바일 제외, 인쇄 시 숨김 */}
        {!isMobileView && (
          <div className="absolute right-9 top-8 print:hidden">
            <button
              type="button"
              onClick={() => window.print()}
              className="flex h-8 items-center gap-1 rounded-lg border border-grey-30 bg-white px-3.5 text-m font-medium text-grey-70 transition-colors lg:hover:bg-grey-10"
            >
              <Printer size={20} />
              출력하기
            </button>
          </div>
        )}

        {/* 제목 */}
        <h2
          className={`mx-auto w-full max-w-[851px] text-center font-emphasize text-grey-100 ${
            isMobileView
              ? 'text-xl leading-[29px]'
              : 'mt-12 text-[32px] leading-[38px]'
          }`}
        >
          {document.title}
        </h2>
        <div
          className={`mx-auto w-full max-w-[851px] border-b border-grey-40 ${isMobileView ? 'mt-6' : 'mt-12'}`}
        />

        {/* 종류별 본문 — 발송 시점 스냅샷 */}
        {document.kind === 'consent' ? (
          <div
            className={`mx-auto w-full max-w-[851px] font-medium leading-[150%] text-grey-100 [&_h1]:font-headline [&_h2]:font-headline ${
              isMobileView
                ? 'mt-6 text-m [&_h1]:text-xl [&_h2]:text-l'
                : 'mt-10 text-xl [&_h1]:text-[28px] [&_h2]:text-2xl'
            }`}
            // 상담사가 제작 뷰에서 작성한 HTML 스냅샷 — 백엔드 연결 시 서버 측 sanitize 전제
            dangerouslySetInnerHTML={{ __html: document.content ?? '' }}
          />
        ) : (
          <div
            className={`mx-auto flex w-full max-w-[851px] flex-col pb-6 ${
              isMobileView ? 'mt-6 gap-6' : 'mt-10 gap-10'
            }`}
          >
            {questions.map((question) => {
              const number =
                question.type === 'section' ? undefined : ++questionNumber;
              return (
                <QnaQuestionContent
                  key={question.id}
                  question={question}
                  number={number}
                />
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

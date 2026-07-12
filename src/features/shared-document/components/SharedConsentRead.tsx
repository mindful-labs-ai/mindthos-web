import { useEffect, useRef, useState } from 'react';

import DOMPurify from 'dompurify';

import {
  DocumentSignatureFooter,
  koreanDateLabel,
} from '@/features/document/components/DocumentSignatureFooter';
import type { FormField } from '@/features/document/types';
import { cn } from '@/lib/cn';

import type { SharedDocument } from '../api/sharedDocumentApi';

import { SharedHeader } from './SharedHeader';

interface SharedConsentReadProps {
  doc: SharedDocument;
  /** 통합 본문 필드 — richtext/section을 본문으로 렌더 */
  fields: FormField[];
  /** 서명 완료 시 dataURL — 푸터에 표시 + CTA를 제출하기로 전환 */
  signatureDataUrl: string | null;
  submitting: boolean;
  onBack: () => void;
  /** "서명하기" — 서명 바텀시트 오픈 */
  onSign: () => void;
  /** "제출하기" — 서명 포함 제출 */
  onSubmit: () => void;
}

/**
 * 동의서 문서 열람(모바일). 본문(richtext/section) 스크롤 + 하단 고정 CTA가 상태에 따라 변신:
 * 바닥 미도달 "아래로 내리기"(스크롤) → 바닥 도달 "서명하기"(바텀시트) → 서명 후 "동의하기".
 */
export function SharedConsentRead({
  doc,
  fields,
  signatureDataUrl,
  submitting,
  onBack,
  onSign,
  onSubmit,
}: SharedConsentReadProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [atBottom, setAtBottom] = useState(false);

  // 본문은 richtext/section만 — 동의(consent) 필드는 CTA로, 최종 서명은 문서 레벨로 처리.
  const bodyFields = fields.filter(
    (f) => f.type === 'richtext' || f.type === 'section'
  );

  const checkBottom = () => {
    const el = scrollRef.current;
    if (!el) return;
    setAtBottom(el.scrollHeight - el.scrollTop - el.clientHeight < 24);
  };

  // 최초 측정 — 내용이 화면보다 짧으면 바로 바닥 처리.
  useEffect(() => {
    checkBottom();
  }, []);

  const scrollDown = () => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollBy({
      top: Math.round(el.clientHeight * 0.85),
      behavior: 'smooth',
    });
  };

  const signed = !!signatureDataUrl;
  const ctaLabel = signed
    ? submitting
      ? '제출 중...'
      : '동의하기'
    : atBottom
      ? '서명하기'
      : '아래로 내리기';
  const onCta = signed ? onSubmit : atBottom ? onSign : scrollDown;

  return (
    <div className="flex h-dvh flex-col bg-white">
      <SharedHeader title={doc.documentTitle} onBack={onBack} />

      <div
        ref={scrollRef}
        onScroll={checkBottom}
        className="flex-1 overflow-y-auto px-5 pb-10 pt-6"
      >
        <h2 className="text-center text-xl font-headline leading-[150%] text-grey-100">
          {doc.documentTitle}
        </h2>
        <div className="mx-auto mt-3 border-b border-grey-40" />

        {/* 본문 — richtext(HTML)·section(제목·설명) */}
        <div className="mt-6 flex flex-col gap-6">
          {bodyFields.map((field) =>
            field.type === 'richtext' ? (
              <div
                key={field.key}
                className="whitespace-pre-line text-sm font-medium leading-[150%] text-grey-100 [&_h1]:text-lg [&_h1]:font-headline [&_h2]:text-m [&_h2]:font-headline"
                // 상담사가 작성한 HTML 스냅샷 — 클라이언트에서 DOMPurify로 sanitize.
                dangerouslySetInnerHTML={{
                  __html: DOMPurify.sanitize(field.html),
                }}
              />
            ) : (
              <div key={field.key}>
                <p className="text-m font-headline leading-[150%] text-grey-100">
                  {field.title}
                </p>
                {field.description && (
                  <p className="mt-2 whitespace-pre-line text-sm font-medium leading-[150%] text-grey-100">
                    {field.description}
                  </p>
                )}
              </div>
            )
          )}
        </div>

        {/* 서명란 — 문서 레벨 최종 서명(날짜/내담자 이름/서명란). 상담사 미리보기와 동일 렌더. */}
        <div className="mt-12">
          <DocumentSignatureFooter
            signatureDataUrl={signatureDataUrl}
            clientName={doc.clientName}
            dateLabel={koreanDateLabel(new Date())}
            counselorName={doc.counselorName}
            counselorOrganization={doc.counselorOrganization ?? undefined}
          />
        </div>
      </div>

      {/* 하단 CTA — 위쪽 그라데이션 페이드 */}
      <div className="relative flex-shrink-0">
        <div className="pointer-events-none absolute -top-[58px] left-0 right-0 h-[58px] bg-gradient-to-t from-white to-transparent" />
        <div className="bg-white px-5 pb-7 pt-2">
          <button
            type="button"
            disabled={submitting}
            onClick={onCta}
            className={cn(
              'h-[50px] w-full rounded-lg bg-green-80 text-m font-medium text-white transition-opacity active:opacity-90',
              submitting && 'opacity-70'
            )}
          >
            {ctaLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

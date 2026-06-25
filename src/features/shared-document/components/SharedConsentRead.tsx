import { useEffect, useRef, useState } from 'react';

import DOMPurify from 'dompurify';

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

/** 오늘 날짜 "YYYY년 M월 D일". */
function todayLabel(): string {
  const d = new Date();
  return `${d.getFullYear()}년 ${d.getMonth() + 1}월 ${d.getDate()}일`;
}

/**
 * 동의서 문서 열람(모바일). 본문(richtext/section) 스크롤 + 하단 고정 CTA가 상태에 따라 변신:
 * 바닥 미도달 "아래로 내리기"(스크롤) → 바닥 도달 "서명하기"(바텀시트) → 서명 후 "제출하기".
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

  // 본문은 richtext/section만 — 응답 필드(consent/signature 등)는 CTA·서명란으로 처리.
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
        <h2 className="text-center text-xl font-bold leading-[150%] text-grey-100">
          {doc.documentTitle}
        </h2>
        <div className="mx-auto mt-3 border-b border-grey-40" />

        {/* 본문 — richtext(HTML)·section(제목·설명) */}
        <div className="mt-6 flex flex-col gap-6">
          {bodyFields.map((field) =>
            field.type === 'richtext' ? (
              <div
                key={field.key}
                className="whitespace-pre-line text-sm font-medium leading-[150%] text-grey-100 [&_h1]:text-lg [&_h1]:font-headline [&_h2]:text-base [&_h2]:font-headline"
                // 상담사가 작성한 HTML 스냅샷 — 클라이언트에서 DOMPurify로 sanitize.
                dangerouslySetInnerHTML={{
                  __html: DOMPurify.sanitize(field.html),
                }}
              />
            ) : (
              <div key={field.key}>
                <p className="text-base font-bold leading-[150%] text-grey-100">
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

        {/* 서명란 — 상담사 사인오프 + 내담자 서명. 서명 이미지는 서명란 위로 겹쳐(종이 서명처럼). */}
        <div className="mt-12 flex flex-col items-end gap-2 text-sm text-grey-100">
          <p className="font-bold">{doc.counselorName} 상담사</p>
          <p>{todayLabel()}</p>
          <div className="mt-1 flex items-center gap-9">
            <span>{doc.clientName}</span>
            <span className="relative">
              (본인 또는 법정 대리인 서명)
              {signed && (
                <img
                  src={signatureDataUrl}
                  alt="서명"
                  className="pointer-events-none absolute left-1/2 top-1/2 h-14 w-auto -translate-x-1/2 -translate-y-1/2 object-contain"
                />
              )}
            </span>
          </div>
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
              'h-[50px] w-full rounded-lg bg-green-80 text-base font-medium text-white transition-opacity active:opacity-90',
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

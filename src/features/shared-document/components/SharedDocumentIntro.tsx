import { Check, ChevronRight, FileText } from 'lucide-react';

import { cn } from '@/lib/cn';

import type { SharedDocument } from '../api/sharedDocumentApi';
import { objectParticle } from '../utils/josa';

import { SharedHeader } from './SharedHeader';

interface SharedDocumentIntroProps {
  doc: SharedDocument;
  /** 민감정보 수집·이용 동의 체크 상태 */
  consent: boolean;
  onConsentChange: (v: boolean) => void;
  /** "[필수] 민감정보수집 및 이용 동의" 상세 보기 */
  onOpenDetail: () => void;
  /** 하단 CTA "문서 보기" — 다음 단계로 */
  onNext: () => void;
  onBack: () => void;
}

/**
 * 공유 문서 진입 화면(모바일 우선). 상담사/내담자 안내 + 민감정보 동의 게이트.
 * 동의 체크 시 "문서 보기" CTA 활성 → 동의서=문서 열람, 질문응답=문항 퍼널로 진행.
 */
export function SharedDocumentIntro({
  doc,
  consent,
  onConsentChange,
  onOpenDetail,
  onNext,
  onBack,
}: SharedDocumentIntroProps) {
  const isConsent = doc.kind === 'CONSENT';
  const title = doc.documentTitle;
  const particle = objectParticle(title);
  // 동의서=서명 / 질문응답=응답
  const needWord = isConsent ? '서명' : '응답';

  return (
    <div className="flex min-h-dvh flex-col bg-grey-20">
      <SharedHeader title={title} onBack={onBack} />

      {/* 히어로 — 상담사가 요청한 문서 안내 + 흐린 문서 아이콘 */}
      <div className="relative px-6 pb-6 pt-8">
        <h2 className="max-w-[260px] text-2xl font-bold leading-[150%] text-grey-100">
          {doc.counselorName} 상담사님이 요청한 {title}
          {particle} 확인해주세요.
        </h2>
        <FileText
          aria-hidden
          strokeWidth={1.5}
          className="pointer-events-none absolute right-6 top-[72px] h-[86px] w-[86px] text-green-80 opacity-20"
        />
      </div>

      {/* 흰 패널 — 안내 문구 + 동의 + CTA */}
      <div className="flex flex-1 flex-col bg-white px-6 pb-7 pt-6">
        <div className="flex flex-col gap-5">
          <p className="whitespace-pre-line text-base font-medium leading-[150%] text-grey-100">
            {`${doc.clientName}님, 안녕하세요.\n${doc.counselorName} 상담사입니다.\n상담 진행을 위해서 ${doc.clientName}님의 ${needWord}이 필요합니다.`}
          </p>
          <p className="whitespace-pre-line text-base font-medium leading-[150%] text-grey-100">
            {`문서 내용을 확인한 뒤에\n${title}${particle} 작성해주세요.`}
          </p>
        </div>

        <div className="flex-1" />

        {/* 민감정보 수집·이용 동의 — 체크박스(토글) + 라벨·화살표(상세 보기) */}
        <div className="flex items-center gap-3 py-2">
          <button
            type="button"
            role="checkbox"
            aria-checked={consent}
            aria-label="민감정보 수집 및 이용 동의"
            onClick={() => onConsentChange(!consent)}
            className={cn(
              'flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-[4px] border-2 transition-colors',
              consent
                ? 'border-green-80 bg-green-80 text-white'
                : 'border-grey-70 bg-white'
            )}
          >
            {consent && <Check size={16} strokeWidth={3} />}
          </button>
          <button
            type="button"
            onClick={onOpenDetail}
            className="flex flex-1 items-center justify-between text-left"
          >
            <span className="text-base font-medium text-grey-80">
              [필수] 민감정보수집 및 이용 동의
            </span>
            <ChevronRight
              size={24}
              strokeWidth={2}
              className="flex-shrink-0 text-grey-80"
            />
          </button>
        </div>

        {/* 문서 보기 — 동의 전 비활성 */}
        <button
          type="button"
          disabled={!consent}
          onClick={onNext}
          className={cn(
            'mt-4 h-[50px] w-full rounded-lg text-base font-medium transition-colors',
            consent
              ? 'bg-green-80 text-white'
              : 'cursor-not-allowed bg-grey-20 text-grey-70'
          )}
        >
          문서 보기
        </button>
      </div>
    </div>
  );
}

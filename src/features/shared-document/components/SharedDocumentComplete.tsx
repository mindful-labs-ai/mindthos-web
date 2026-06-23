import { Check } from 'lucide-react';

import type { SharedDocument } from '../api/sharedDocumentApi';
import { objectParticle } from '../utils/josa';

interface SharedDocumentCompleteProps {
  doc: SharedDocument;
}

/**
 * 제출 완료 화면 — 마음토스 로고 + 흰 카드(초록 체크 + "문서 작성 완료" + 전달 안내).
 * 동의서/질문지 공통: "{문서명}{을/를} {상담사}님에게 전달했어요."
 */
export function SharedDocumentComplete({ doc }: SharedDocumentCompleteProps) {
  const particle = objectParticle(doc.documentTitle);

  return (
    <div className="flex min-h-dvh flex-col items-center bg-grey-20 px-7">
      <img
        src="/logo_mindthos_kr.webp"
        alt="마음토스"
        className="mt-11 h-[34px] w-auto"
      />

      <div className="flex w-full flex-1 items-center justify-center">
        <div className="w-full max-w-[319px] rounded-xl bg-white px-6 py-7 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-20">
            <Check size={26} strokeWidth={3} className="text-green-80" />
          </div>
          <p className="mt-4 text-xl font-bold text-grey-100">문서 작성 완료</p>
          <p className="mt-3 whitespace-pre-line text-base font-medium leading-[150%] text-grey-100">
            {`${doc.documentTitle}${particle}\n${doc.counselorName} 상담사님에게 전달했어요.`}
          </p>
        </div>
      </div>
    </div>
  );
}

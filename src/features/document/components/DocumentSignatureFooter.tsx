interface DocumentSignatureFooterProps {
  /** 문서 레벨 최종 서명(data:image/ URL). null이면 빈 서명란(서명 전 / 양식 미리보기). */
  signatureDataUrl: string | null;
  /** 서명자(내담자) 이름. 빈 값이면 양식(미리보기)으로 보고 "OOO" 자리표시. */
  clientName: string;
  /** 작성/제출일 라벨 — 예: "2026년 6월 30일". */
  dateLabel: string;
  /** 상담사 이름 — 날짜 위에 "{이름} 상담사"로 표기(없으면 숨김). */
  counselorName?: string;
  /** 상담사 소속 — 있으면 이름 앞에 "{소속} / {이름} 상담사"로 표기. 빈 값이면 이름만. */
  counselorOrganization?: string;
}

/** 날짜 → "YYYY년 M월 D일". 내담자 뷰·상담사 미리보기·발송문서 확인 뷰가 같은 포맷을 쓰도록 공유. */
export function koreanDateLabel(date: Date): string {
  return `${date.getFullYear()}년 ${date.getMonth() + 1}월 ${date.getDate()}일`;
}

/**
 * 문서 최종 서명 푸터 — requireSignature 동의서 하단의 문서 레벨 서명란.
 * 서명은 더 이상 필드가 아니라 문서 레벨(response.signatureDataUrl)이며 내담자가 제출 직전 1회
 * 서명하면 모든 동의에 적용된다. 구성: "[{소속} ]{상담사} 상담사" / 날짜 / "{이름}" / 서명란(서명
 * 이미지 또는 빈 서명선). 소속은 상담사 user info에 있을 때만 이름 앞에 공백으로 붙는다(없으면 이름만).
 * 이름은 실제 발송/제출에선 내담자명, 양식(미리보기)에선 "OOO"로 표시한다.
 * 내담자가 보는 화면과 상담사 미리보기가 동일하게 렌더된다(데이터만 다름).
 */
export function DocumentSignatureFooter({
  signatureDataUrl,
  clientName,
  dateLabel,
  counselorName,
  counselorOrganization,
}: DocumentSignatureFooterProps) {
  // 소속이 있으면 "{소속} {이름}"(공백 구분), 없으면 이름만. (앞뒤 공백만인 소속은 없는 것으로 취급)
  const organization = counselorOrganization?.trim();
  const counselorLabel = organization
    ? `${organization} ${counselorName}`
    : counselorName;
  return (
    <div className="flex flex-col items-end gap-3 text-sm text-grey-100">
      {counselorName && <p className="font-bold">{counselorLabel} 상담사</p>}
      {dateLabel && <p>{dateLabel}</p>}
      <div className="flex items-end gap-3">
        <span>{clientName || 'OOO'}</span>
        {signatureDataUrl ? (
          <img
            src={signatureDataUrl}
            alt="서명"
            className="h-14 w-auto object-contain"
          />
        ) : (
          <span
            className="inline-block h-12 w-32 border-b border-grey-40"
            aria-hidden="true"
          />
        )}
      </div>
    </div>
  );
}

import { SharedHeader } from './SharedHeader';

interface SharedConsentDetailProps {
  /** "확인" — 민감정보 동의 처리 후 진입 화면으로 복귀 */
  onConfirm: () => void;
  onBack: () => void;
}

/**
 * 민감정보 수집·이용 동의 상세(공통 정적 문구). 진입 화면의 "[필수] …" 행에서 진입.
 * 표 없이 단순 리스팅. 본문 스크롤 + 하단 고정 "확인"(페이드). 확인 시 동의 처리 후 복귀.
 */
export function SharedConsentDetail({
  onConfirm,
  onBack,
}: SharedConsentDetailProps) {
  return (
    <div className="flex h-dvh flex-col bg-white">
      <SharedHeader title="민감정보수집 및 이용 동의" onBack={onBack} />

      <div className="flex-1 overflow-y-auto px-5 pb-10 pt-6 text-sm font-medium leading-[150%] text-grey-100">
        <p className="font-headline">민감정보수집 및 이용동의</p>

        <p className="mt-5 font-headline">1. 비회원 이용자의 개인정보처리</p>
        <p className="mt-3">
          1) 비회원 이용자도 상담사의 요청으로 심리검사 및 상담서비스에 응할 수
          있으나, 비회원 이용자 자신의 심리검사 및 상담서비스 내용 확인할 수
          없는 등 일부 서비스 이용의 제한이 있을 수 있습니다.
        </p>
        <p className="mt-3">① 비회원의 개인정보 수집/이용 목적 및 항목</p>

        <ul className="mt-3 flex flex-col gap-3">
          <li>
            <span className="font-emphasize">
              · 서비스제공 / 심리검사 실시 필수(심리검사 실시시)
            </span>
            <br />각 검사에서 요구하는 개인정보(이름, 생년월일, 성별, 연령 등),
            심리검사 문항에 대한 이용자의 응답값
          </li>
          <li>
            <span className="font-emphasize">
              · 상담서비스 이용 필수(상담사 요청시)
            </span>
            <br />
            상담자가 이용자에게 발송한 상담신청서 및 심화면접지 등
            상담관련문서에 대한 이용자의 응답 내용
          </li>
        </ul>

        <p className="mt-3">
          2) 비회원으로 서비스를 이용할 때에는 회원에게만 적용되는 사항을 제외한
          나머지 부분은 대하여는 회원과 동일하게 개인정보처리방침이 적용되며,
          해당 용도 외에는 다른 어떠한 용도로도 사용되지 않습니다.
        </p>
        <p className="mt-3">
          3) 회사는 비회원의 개인정보도 회원과 동등한 수준으로 보호합니다.
        </p>
      </div>

      {/* 하단 확인 — 위쪽 그라데이션 페이드 */}
      <div className="relative flex-shrink-0">
        <div className="pointer-events-none absolute -top-[58px] left-0 right-0 h-[58px] bg-gradient-to-t from-white to-transparent" />
        <div className="bg-white px-5 pb-7 pt-2">
          <button
            type="button"
            onClick={onConfirm}
            className="h-[50px] w-full rounded-lg bg-green-80 text-m font-medium text-white transition-opacity active:opacity-90"
          >
            확인
          </button>
        </div>
      </div>
    </div>
  );
}

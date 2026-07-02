import { GoogleCalendarIcon } from '../../icons';

interface GoogleConnectButtonProps {
  /** 구글 캘린더 연동 트리거 (연결 사이드탭 오픈) */
  onConnect?: () => void;
}

/**
 * '캘린더 연결하기' 컴팩트 버튼 — 연동 카드(GoogleConnectCard)를 닫았을 때
 * '일정 표시' 아래에 대신 노출되는 연결 진입점.
 * 스펙: 풀폭(컨테이너 px-4로 좌우 16px)·높이 39px 고정·아이콘 20px·텍스트 14px/500.
 * mt-2 = 컨테이너 gap-6(24px)과 합쳐 '일정 표시'와 32px 간격.
 */
export function GoogleConnectButton({ onConnect }: GoogleConnectButtonProps) {
  return (
    <button
      type="button"
      onClick={onConnect}
      className="mt-2 flex h-[39px] w-full items-center justify-center gap-2 rounded-[10px] border border-grey-40 bg-white text-sm font-medium text-grey-100 transition-colors lg:hover:bg-grey-10"
    >
      <GoogleCalendarIcon size={20} />
      캘린더 연결하기
    </button>
  );
}

import type { FC } from 'react';

import type { CalendarProvider } from '../adapters';

/**
 * ============================================================
 * 캘린더 기능 아이콘 중앙 관리 파일
 * ============================================================
 * 캘린더에서 쓰는 "교체 대상" 아이콘을 여기 한 곳에서 정의/수정한다.
 *  - 외부 서비스 캘린더 아이콘: GoogleCalendarIcon / NaverCalendarIcon / AppleCalendarIcon
 *  - 연동 카드의 캘린더 아이콘: ConnectCalendarIcon
 * 현재는 lucide `CalendarDays` 임시 플레이스홀더(브랜드 색만 적용)다.
 *
 * ────────────────────────────────────────────────────────────
 * ■ 실제 로고로 교체하는 방법 (둘 중 택1, 컴포넌트 내용만 바꾸면 됨)
 *
 * (A) 이미지 파일로 교체  ← 가장 쉬움, 권장
 *   1. 로고 파일을 `mindthos-web/public/icons/` 에 넣는다.
 *        예) public/icons/google-calendar.svg  (또는 .png)
 *   2. 해당 컴포넌트를 <img> 로 바꾼다:
 *        export const GoogleCalendarIcon: FC = () => (
 *          <img
 *            src="/icons/google-calendar.svg"
 *            alt="구글 캘린더"
 *            width={ICON_SIZE}
 *            height={ICON_SIZE}
 *          />
 *        );
 *      (public/ 안의 파일은 루트 경로 `/icons/...` 로 바로 참조된다.)
 *
 * (B) 인라인 SVG 로 교체
 *        export const GoogleCalendarIcon: FC = () => (
 *          <svg width={ICON_SIZE} height={ICON_SIZE} viewBox="0 0 24 24">
 *            ...피그마/사이트에서 복사한 svg 내용...
 *          </svg>
 *        );
 *
 * ※ 크기는 ICON_SIZE(기본 26px) 상수로 통일. 더 키우/줄이려면 이 값만 수정.
 * ※ 좌측 네비게이션의 '일정' 메뉴 아이콘은 이 파일이 아니라
 *    `src/shared/icons/index.tsx` 의 `SideCalendarIcon` 에 있다(앱 공용).
 * ============================================================
 */

/** 아이콘 표시 크기(px). 한 곳에서 통일 관리. */
export const ICON_SIZE = 42;

/* ── 외부 서비스 캘린더 아이콘 ─────────────────────────────── */

export const GoogleCalendarIcon: FC = () => (
  <img
    src="/icons/google-calendar-icon.png"
    alt="구글 캘린더"
    width={26}
    height={26}
  />
);

export const NaverCalendarIcon: FC = () => (
  <img
    src="/icons/naver-calendar-icon.png"
    alt="네이버 캘린더"
    width={36}
    height={36}
  />
);

export const AppleCalendarIcon: FC = () => (
  <img
    src="/icons/apple-calendar-icon.png"
    alt="애플 캘린더"
    width={32}
    height={32}
  />
);

/**
 * provider 키 → 아이콘 컴포넌트 매핑.
 * '캘린더 추가하기' 패널(AddCalendarPanel)이 이 매핑을 사용한다.
 * 새 provider를 추가하면 여기에 한 줄만 추가하면 된다.
 */
export const PROVIDER_ICONS: Record<CalendarProvider, FC> = {
  google: GoogleCalendarIcon,
  naver: NaverCalendarIcon,
  apple: AppleCalendarIcon,
};

/* ── 일정/연동 카드 아이콘 ─────────────────────────────────── */

/** 사이드탭 하단 '구글 캘린더 연동' 카드에 쓰는 캘린더 아이콘 */
export const ConnectCalendarIcon: FC = () => <GoogleCalendarIcon />;

# 웹 컨벤션 정리 (2026-07-02) — 변경 내역 · UI 영향 분석

컨벤션 정밀 리뷰(HIGH 1 / MEDIUM 4 / LOW 3)의 반영 기록.
**결론: 8건 전부 실질 동작 무영향, 시각 변화는 아래 표의 3건(전부 의도된 통일)뿐.**

| # | 변경 | 파일 | UI/동작 영향 | 근거 |
|---|---|---|---|---|
| 1 | 이탈 확인 모달을 시맨틱 토큰 → 팔레트 클래스로 환산 | `DocumentEditorContainer` | **시각 동일** (hover만 파일 관례로 미세 통일) | 토큰 값 대조: `text-fg`=grey-100, `fg-muted`=grey-70, `border`=grey-40, `surface`=white, `primary`=green-80, `primary-fg`=white, `typo-m`=`text-m font-medium`, `typo-sm`=`text-sm font-medium` — 환산 결과가 픽셀 단위 동일. hover만 `bg-primary/90`→`opacity-90`(같은 파일의 다른 모달과 동일 패턴) |
| 2 | 데스크탑/모바일 연동 표시 상태 중복 → `useGoogleConnectState` 훅 추출 | `CalendarSidebar`, `MobileFilterSheet` | **무영향** | 동일 로직의 위치 이동. dismissed 상태는 기존처럼 각 컴포넌트 인스턴스별 유지 |
| 3 | 미사용 아이콘 export 삭제 (`Edit3Icon`, `Edit3IconSolid`, `PenIcon` + `Icons` 맵 키) | `shared/icons/index.tsx` | **무영향** | 삭제 전 전역 검색으로 import 0건 확인(TitleEdit 통일 때 전 사용처 교체 완료). `Icons.` 네임스페이스 사용처는 테스트 1곳(Check 키)뿐 |
| 4 | 말줄임표 `…` → `...` 5곳 | `AddEventPanel` | **시각: 글리프만 변경** | 코드베이스 다수 관례(`중...` 95회 vs `중…` 13회) 통일 |
| 5 | '일정 삭제' 버튼 `disabled:opacity-40` → `60` + `cursor-not-allowed` | `AddEventPanel` | **시각: 비활성 시 덜 흐려짐** | 같은 파일 10개 버튼과 통일(코드베이스 표준 50~60) |
| 6 | `calendarLabel` → `getCalendarLabel` | `MyCalendars` | **무영향** | 내부 함수 rename (verb-first 관례) |
| 7 | 알림 행 조건부 클래스 → `disabled:opacity-60` variant | `NotificationPanel` | **무영향** | `disabled={resolving}`이 이미 걸려 있어 동일 시점에 동일 스타일 적용 |
| 8 | `rounded-[10px]` 2곳 유지 | `GoogleConnectButton`, `AddEventPanel` | 변경 안 함 | 사용자 지정 스펙(JSDoc에 근거 기록) — 리뷰어도 스펙 명시 시 유지 판정 |

## 검증
- `tsc -b` / eslint / prettier / **vitest 전체 38파일 · 288테스트 통과**
- 팔레트↔토큰 값 대조는 `src/styles/tokens.css` 기준 (위 표 #1)

## 보류(후속 제안)
- 시맨틱 토큰 vs 팔레트 클래스의 **피처별 경계 명문화**: 현재 가계도·공용 UI는 토큰, 캘린더·문서는 팔레트 — 신규 피처가 어느 쪽을 따를지 DEVELOPMENT_GUIDE에 한 줄 추가 권장.

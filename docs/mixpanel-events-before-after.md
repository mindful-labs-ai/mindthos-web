# Mixpanel Events: Before / After

> - **Before**: 기존에 존재하던 이벤트
> - **After**: 이번 확장에서 새로 추가된 이벤트
>
> 각 도메인별로 사용자가 경험하는 시간순으로 정렬되어 있습니다.

---

## 1. Auth (인증)

| 순서 | Event Name | Label | Properties | 설명 |
|------|-----------|-------|------------|------|
| 1 | `auth_form_switch` | **After** | `{ from, to }` | 로그인 ↔ 회원가입 폼 전환 |
| 2 | `signup_attempt` | **After** | `{ method }` | 회원가입 시도 (API 호출 전) |
| 3 | `signup_success` | Before | `{ method }` | 회원가입 성공 |
| 3 | `signup_failed` | Before | `{ error }` | 회원가입 실패 |
| 4 | `login_attempt` | Before | `{ method: 'email'\|'google'\|'kakao' }` | 로그인 시도 |
| 5 | `login_oauth_callback` | **After** | `{ method: 'google'\|'kakao' }` | OAuth 콜백 도착 (세션 존재) |
| 6 | `login_success` | Before | `{ method: 'email'\|'google'\|'kakao' }` | 로그인 성공 (이메일 + 소셜) |
| 6 | `login_failed` | Before | `{ method, error }` | 로그인 실패 |
| 7 | `logout_confirm_view` | **After** | — | 로그아웃 확인 모달 열림 |
| 8 | `logout` | Before | — | 로그아웃 실행 |
| 9 | `account_delete_confirm_view` | **After** | — | 계정 삭제 확인 모달 열림 |
| 10 | `account_delete` | Before | — | 계정 삭제 실행 |

**분석 포인트**:
- 이메일: `login_attempt` → `login_success/failed`
- 소셜: `login_attempt` → (리다이렉트) → `login_oauth_callback` → `login_success/failed`
- 회원가입: `auth_form_switch` → `signup_attempt` → `signup_success/failed`

---

## 2. Home (홈 화면)

| 순서 | Event Name | Label | Properties | 설명 |
|------|-----------|-------|------------|------|
| 1 | `welcome_banner_view` | **After** | — | 웰컴 배너 노출 |
| 2 | `welcome_banner_dismiss` | **After** | — | 웰컴 배너 닫기 |
| 3 | `action_card_click` | Before | `{ title }` | 액션 카드(세션생성 등) 클릭 |
| 4 | `session_card_click` | **After** | `{ session_id }` | 최근 세션 카드 클릭 |

---

## 3. Session Creation (세션 생성)

### 3-1. 다중 세션 (오디오 업로드)

| 순서 | Event Name | Label | Properties | 설명 |
|------|-----------|-------|------------|------|
| 1 | `multi_session_create_modal_open` | **After** | — | 다중 세션 모달 열림 |
| 2 | `multi_session_file_add` | **After** | — | 파일 추가 |
| 3 | `multi_session_step_change` | **After** | `{ from, to, file_count }` | 업로드 → 설정 단계 전환 |
| 4 | `multi_session_file_remove` | **After** | — | 설정 단계에서 파일 제거 |
| 5 | `multi_session_create_attempt` | **After** | `{ file_count, total_credit }` | 생성 버튼 클릭 |
| 6 | `multi_session_create_success` | Before | `{ success_count, failed_count, total_count }` | 생성 완료 |
| 7 | `multi_session_create_modal_close` | **After** | — | 모달 닫힘 |

### 3-2. 직접 입력 세션

| 순서 | Event Name | Label | Properties | 설명 |
|------|-----------|-------|------------|------|
| 1 | `hand_written_session_create_modal_open` | **After** | — | 직접 입력 모달 열림 |
| 2 | `hand_written_session_create_attempt` | **After** | `{ has_client, content_length }` | 생성 시도 |
| 3 | `hand_written_session_create_success` | Before | `{ session_id, has_client, content_length }` | 생성 성공 |
| 4 | `hand_written_session_create_modal_close` | **After** | — | 모달 닫힘 |

**분석 포인트**: 모달 오픈 → 생성 시도 → 성공 퍼널로 이탈 지점 파악

---

## 4. Session List (세션 목록)

| 순서 | Event Name | Label | Properties | 설명 |
|------|-----------|-------|------------|------|
| 1 | `session_filter_client` | Before | `{ client_id }` | 내담자 필터 적용 |
| 2 | `session_filter_reset` | Before | — | 필터 초기화 |
| 3 | `session_sort_change` | Before | `{ order }` | 정렬 변경 |

---

## 5. Session Detail (세션 상세)

### 5-1. 탭 전환

| 순서 | Event Name | Label | Properties | 설명 |
|------|-----------|-------|------------|------|
| 1 | `session_tab_change` | **After** | `{ tab }` | 탭 전환 |
| 2 | `session_tab_change_confirm_view` | **After** | — | 미저장 변경사항 경고 모달 |
| 3 | `session_tab_change_confirm` | **After** | — | 탭 전환 확인 |
| 3 | `session_tab_change_cancel` | **After** | — | 탭 전환 취소 |

### 5-2. Audio Player

| 순서 | Event Name | Label | Properties | 설명 |
|------|-----------|-------|------------|------|
| 1 | `audio_play` | Before | — | 재생 |
| 2 | `audio_pause` | Before | — | 일시정지 |
| 3 | `audio_speed_change` | Before | `{ speed }` | 재생 속도 변경 |
| 4 | `audio_seek` | **After** | `{ from, duration }` | 타임라인 탐색 |
| 5 | `audio_forward` | **After** | — | 15초 앞으로 |
| 6 | `audio_backward` | **After** | — | 5초 뒤로 |
| 7 | `audio_complete` | **After** | — | 재생 완료 |

### 5-3. Transcript (축어록)

| 순서 | Event Name | Label | Properties | 설명 |
|------|-----------|-------|------------|------|
| 1 | `transcript_edit_start` | Before | `{ session_id }` | 편집 시작 |
| 2 | `transcript_segment_delete_confirm_view` | **After** | — | 세그먼트 삭제 확인 모달 |
| 3 | `transcript_segment_delete_confirm` | **After** | — | 세그먼트 삭제 확인 |
| 4 | `speaker_edit_apply` | Before | `{ ... }` | 화자 변경 적용 |
| 5 | `transcript_edit_complete` | Before | `{ session_id, ... }` | 편집 완료 |
| 5 | `transcript_edit_cancel` | Before | `{ session_id }` | 편집 취소 |

### 5-4. Progress Note (상담노트)

| 순서 | Event Name | Label | Properties | 설명 |
|------|-----------|-------|------------|------|
| 1 | `progress_note_edit_start` | Before | — | 편집 시작 |
| 2 | `progress_note_edit_complete` | Before | — | 편집 완료 |
| 2 | `progress_note_edit_cancel` | Before | — | 편집 취소 |
| 3 | `progress_note_copy` | Before | `{ section_index }` | 섹션 복사 |
| 4 | `progress_note_copy_all` | Before | — | 전체 복사 |
| 5 | `progress_note_regenerate_modal_open` | **After** | — | 재생성 모달 열림 |
| 6 | `progress_note_regenerate_attempt` | **After** | — | 재생성 시도 |
| 7 | `progress_note_regenerate_success` | **After** | `{ session_id, template_id }` | 재생성 성공 |

---

## 6. Analysis (분석)

| 순서 | Event Name | Label | Properties | 설명 |
|------|-----------|-------|------------|------|
| 1 | `analysis_tab_change` | Before | `{ tab }` | 분석 탭 전환 |
| 2 | `analysis_edit_start` | Before | — | 분석 편집 시작 |
| 3 | `analysis_edit_complete` | Before | — | 분석 편집 완료 |
| 3 | `analysis_edit_cancel` | Before | — | 분석 편집 취소 |
| 4 | `analysis_copy` | Before | `{ tab }` | 분석 내용 복사 |
| 5 | `supervision_retry` | Before | — | 슈퍼비전 재시도 |

---

## 7. Client (내담자 관리)

### 7-1. 생성/수정

| 순서 | Event Name | Label | Properties | 설명 |
|------|-----------|-------|------------|------|
| 1 | `client_create_modal_open` | **After** | — | 내담자 모달 열림 |
| 2 | `client_create_attempt` | **After** | — | 생성 시도 (폼 제출) |
| 2 | `client_update_attempt` | **After** | — | 수정 시도 (폼 제출) |
| 3 | `client_create_success` | Before | `{ client_id }` | 생성 성공 |
| 3 | `client_create_failed` | Before | `{ error }` | 생성 실패 |
| 3 | `client_update_success` | Before | `{ client_id }` | 수정 성공 |
| 3 | `client_update_failed` | Before | `{ error }` | 수정 실패 |
| 4 | `client_create_modal_close` | **After** | — | 모달 닫힘 |

### 7-2. 상세/관리

| 순서 | Event Name | Label | Properties | 설명 |
|------|-----------|-------|------------|------|
| 1 | `client_detail_view` | Before | `{ client_id }` | 내담자 상세 진입 |
| 2 | `client_session_close_confirm_view` | **After** | `{ client_id }` | 상담 종결 확인 모달 |
| 3 | `client_session_close` | Before | `{ client_id }` | 상담 종결 실행 |
| 4 | `client_session_restart_confirm_view` | **After** | `{ client_id }` | 상담 재시작 확인 모달 |
| 5 | `client_session_restart` | Before | `{ client_id }` | 상담 재시작 실행 |
| 6 | `client_delete_confirm_view` | **After** | `{ client_id }` | 삭제 확인 모달 |
| 7 | `client_delete` | Before | `{ client_id }` | 내담자 삭제 |

### 7-3. 다회기 분석

| 순서 | Event Name | Label | Properties | 설명 |
|------|-----------|-------|------------|------|
| 1 | `client_analysis_modal_open` | **After** | — | 다회기 분석 모달 열림 |
| 2 | `client_analysis_session_select` | **After** | — | 세션 선택 |
| 3 | `client_analysis_template_select` | **After** | — | 템플릿 선택 |
| 4 | `client_analysis_create` | Before | `{ ... }` | 분석 생성 |
| 5 | `client_analysis_modal_close` | **After** | — | 모달 닫힘 |

---

## 8. Genogram (가계도)

### 8-1. 생성 플로우

| 순서 | Event Name | Label | Properties | 설명 |
|------|-----------|-------|------------|------|
| 1 | `genogram_empty_state_click` | Before | `{ ... }` | 빈 상태에서 시작 클릭 |
| 2 | `genogram_step_change` | **After** | `{ from, to }` | 단계 전환 |
| 3 | `genogram_family_member_add` | Before | — | 가족 구성원 추가 |
| 4 | `genogram_family_member_edit` | **After** | — | 가족 구성원 편집 |
| 5 | `genogram_family_member_delete` | Before | — | 가족 구성원 삭제 |
| 6 | `genogram_relation_add` | Before | — | 관계 추가 |
| 7 | `genogram_relation_delete` | Before | — | 관계 삭제 |
| 8 | `genogram_undo` | **After** | — | 실행 취소 |
| 9 | `genogram_redo` | **After** | — | 다시 실행 |
| 10 | `genogram_generation_confirm_modal_open` | **After** | — | 생성 확인 모달 열림 |
| 11 | `genogram_generation_confirm_click` | Before | `{ member_count, relation_count }` | 생성 확인 |
| 12 | `genogram_creation_complete_click` | Before | — | 생성 완료 |
| 13 | `genogram_edit_apply_click` | Before | `{ member_count, relation_count }` | 편집 적용 |

### 8-2. 초기화/가이드

| 순서 | Event Name | Label | Properties | 설명 |
|------|-----------|-------|------------|------|
| 1 | `genogram_reset_confirm_view` | **After** | — | 초기화 확인 모달 |
| 2 | `genogram_reset_confirm` | **After** | — | 초기화 확인 |
| 3 | `genogram_guide_modal_open` | **After** | — | 가이드 모달 열림 |
| 4 | `genogram_guide_step_change` | **After** | `{ step }` | 가이드 단계 변경 |
| 5 | `genogram_guide_complete` | **After** | — | 가이드 완료 |

### 8-3. 내보내기

| 순서 | Event Name | Label | Properties | 설명 |
|------|-----------|-------|------------|------|
| 1 | `genogram_export_modal_open` | **After** | — | 내보내기 모달 열림 |
| 2 | `genogram_export_background_change` | **After** | `{ background }` | 배경 변경 |
| 3 | `genogram_export_watermark_toggle` | **After** | `{ enabled }` | 워터마크 토글 |
| 4 | `genogram_export_download` | **After** | — | 다운로드 |

### 8-4. 리포트

| 순서 | Event Name | Label | Properties | 설명 |
|------|-----------|-------|------------|------|
| 1 | `genogram_report_modal_open` | **After** | — | 리포트 모달 열림 |
| 2 | `genogram_report_button_click` | Before | `{ ... }` | 리포트 버튼 클릭 |
| 3 | `genogram_report_verify_complete` | Before | `{ ... }` | 리포트 검증 완료 |
| 4 | `genogram_report_generate_credit_insufficient` | Before | `{ ... }` | 크레딧 부족 |
| 5 | `genogram_report_generate_success` | Before | `{ client_id, report_id }` | 리포트 생성 성공 |
| 6 | `genogram_report_preview_open` | **After** | — | 리포트 미리보기 |
| 7 | `genogram_report_download_click` | Before | `{ ... }` | 리포트 다운로드 |
| 8 | `genogram_report_export_click` | Before | `{ ... }` | 리포트 내보내기 |
| 9 | `genogram_report_seminar_modal_view` | Before | `{ ... }` | 세미나 모달 노출 |
| 10 | `genogram_report_seminar_button_click` | Before | — | 세미나 버튼 클릭 |

---

## 9. Template (템플릿)

| 순서 | Event Name | Label | Properties | 설명 |
|------|-----------|-------|------------|------|
| 1 | `template_pin_toggle` | Before | `{ ... }` | 핀 고정/해제 |
| 2 | `template_set_default` | Before | `{ ... }` | 기본 템플릿 설정 |
| 3 | `template_request_click` | **After** | — | 템플릿 요청 클릭 |

---

## 10. Settings (설정)

| 순서 | Event Name | Label | Properties | 설명 |
|------|-----------|-------|------------|------|
| 1 | `settings_section_change` | **After** | `{ section }` | 설정 섹션 전환 |
| 2 | `notice_list_view` | Before | — | 공지사항 목록 |
| 3 | `notice_detail_view` | Before | `{ notice_id }` | 공지사항 상세 |
| 4 | `user_info_edit_modal_open` | **After** | — | 정보 수정 모달 열림 |
| 5 | `user_info_edit_attempt` | **After** | — | 정보 수정 시도 |
| 6 | `user_info_edit_success` | Before | — | 정보 수정 성공 |
| 7 | `badge_detail_modal_open` | **After** | — | 배지 상세 모달 열림 |

---

## 11. Subscription & Payment (구독/결제)

### 11-1. 플랜 변경

| 순서 | Event Name | Label | Properties | 설명 |
|------|-----------|-------|------------|------|
| 1 | `plan_change_modal_open` | **After** | — | 플랜 변경 모달 열림 |
| 2 | `plan_upgrade_confirm_modal_open` | **After** | — | 업그레이드 확인 모달 |
| 3 | `plan_upgrade_attempt` | Before | `{ ... }` | 업그레이드 시도 |
| 4 | `plan_upgrade_success` | Before | `{ new_plan, amount }` | 업그레이드 성공 |
| 4 | `plan_upgrade_failed` | Before | `{ target_plan, error }` | 업그레이드 실패 |
| 5 | `plan_downgrade_confirm_modal_open` | **After** | — | 다운그레이드 확인 모달 |
| 6 | `plan_downgrade_attempt` | Before | `{ ... }` | 다운그레이드 시도 |
| 7 | `plan_downgrade_scheduled` | Before | `{ new_plan }` | 다운그레이드 예약 |

### 11-2. 카드/크레딧

| 순서 | Event Name | Label | Properties | 설명 |
|------|-----------|-------|------------|------|
| 1 | `card_registration_modal_open` | **After** | — | 카드 등록 모달 열림 |
| 2 | `card_register_attempt` | Before | — | 카드 등록 시도 |
| 3 | `card_register_success` | Before | — | 카드 등록 성공 |
| 3 | `card_register_failed` | Before | `{ error }` | 카드 등록 실패 |
| 4 | `credit_usage_modal_open` | **After** | — | 크레딧 사용 내역 모달 |
| 5 | `credit_renewal_modal_open` | **After** | — | 크레딧 갱신 모달 열림 |
| 6 | `credit_renewal_attempt` | Before | `{ ... }` | 크레딧 갱신 시도 |
| 7 | `credit_renewal_success` | Before | `{ ... }` | 크레딧 갱신 성공 |

### 11-3. 구독 취소

| 순서 | Event Name | Label | Properties | 설명 |
|------|-----------|-------|------------|------|
| 1 | `subscription_cancel_attempt` | Before | `{ ... }` | 구독 취소 시도 |
| 2 | `subscription_cancel` | Before | `{ ... }` | 구독 취소 실행 |
| 3 | `payment_result_modal_view` | **After** | `{ status }` | 결제 결과 모달 |

---

## 12. Onboarding & Quest (온보딩)

| 순서 | Event Name | Label | Properties | 설명 |
|------|-----------|-------|------------|------|
| 1 | `onboarding_funnel_started` | Before | `{ funnel_step }` | 온보딩 퍼널 시작 |
| 2 | `quest_mission_modal_open` | **After** | — | 퀘스트 미션 모달 열림 |
| 3 | `quest_mission_start_click` | **After** | — | 미션 시작 클릭 |
| 4 | `quest_mission_complete_view` | **After** | — | 미션 완료 화면 |
| 5 | `tutorial_guide_modal_open` | **After** | — | 튜토리얼 가이드 열림 |
| 6 | `tutorial_guide_step_change` | **After** | `{ step }` | 튜토리얼 단계 변경 |
| 7 | `tutorial_guide_complete` | **After** | — | 튜토리얼 완료 |

---

## 13. Common (공통)

| 순서 | Event Name | Label | Properties | 설명 |
|------|-----------|-------|------------|------|
| 1 | `coming_soon_modal_opened` | Before | `{ source }` | 준비중 모달 열림 |
| 2 | `locked_feature_modal_open` | **After** | — | 잠금 기능 모달 열림 |

---

## 14. Page Views (페이지 뷰) — 기존 유지

| Event Name | Label | Properties |
|-----------|-------|------------|
| `home_page_view` | Before | `{ from, to }` |
| `client_list_page_view` | Before | `{ from, to }` |
| `client_detail_page_view` | Before | `{ from, to }` |
| `session_history_page_view` | Before | `{ from, to }` |
| `session_detail_page_view` | Before | `{ from, to }` |
| `template_page_view` | Before | `{ from, to }` |
| `genogram_page_view` | Before | `{ from, to }` |
| `settings_page_view` | Before | `{ from, to }` |
| `auth_page_view` | Before | `{ from, to }` |
| `auth_callback_page_view` | Before | `{ from, to }` |
| `email_verification_page_view` | Before | `{ from, to }` |
| `terms_page_view` | Before | `{ from, to }` |
| `payment_success_page_view` | Before | `{ from, to }` |
| `payment_fail_page_view` | Before | `{ from, to }` |

---

## 15. Error Events (에러) — 기존 유지

모든 에러는 `error_occurred` 이벤트로 통합 전송되며, `error_type` 프로퍼티로 구분합니다.

| error_type | 설명 |
|-----------|------|
| `account_delete_error` | 계정 삭제 에러 |
| `audio_presigned_url_error` | 오디오 URL 에러 |
| `cancel_subscription_revert_error` | 구독 취소 복원 에러 |
| `card_registration_error` | 카드 등록 에러 |
| `client_analysis_create_error` | 다회기 분석 생성 에러 |
| `credit_renewal_preview_error` | 크레딧 갱신 미리보기 에러 |
| `genogram_report_generate_fail` | 가계도 리포트 생성 실패 |
| `hand_written_session_create_error` | 직접 입력 세션 에러 |
| `login_failed` | 로그인 에러 |
| `logout_error` | 로그아웃 에러 |
| `markdown_edit_save_error` | 마크다운 편집 저장 에러 |
| `multi_session_create_error` | 다중 세션 생성 에러 |
| `plan_downgrade_error` | 다운그레이드 에러 |
| `plan_upgrade_error` | 업그레이드 에러 |
| `plan_upgrade_failed` | 업그레이드 실패 |
| `progress_note_create_error` | 상담노트 생성 에러 |
| `progress_note_regenerate_error` | 상담노트 재생성 에러 |
| `session_create_error` | 세션 생성 에러 |
| `signup_failed` | 회원가입 에러 |
| `speaker_change_error` | 화자 변경 에러 |
| `subscription_cancel_error` | 구독 취소 에러 |
| `transcript_save_error` | 축어록 저장 에러 |
| `user_info_edit_failed` | 사용자 정보 수정 에러 |

---

## Summary

| 구분 | Before | After | Total |
|------|--------|-------|-------|
| **MixpanelEvent** | 65 | 61 | **126** |
| **MixpanelError** | 23 | 0 | **23** |
| **Page Views** | 14 | 0 | **14** |
| **합계** | **102** | **61** | **163** |

> 기존 대비 약 **60% 이벤트 증가** — 모달 라이프사이클, 시도(attempt) 단계, 세부 인터랙션이 추가되어 사용자 플로우의 시간대별 분석이 가능해졌습니다.
>
> 참고: `CreateSessionModal`(단일 세션)은 `CreateMultiSessionModal`로 대체되어 사용되지 않으므로, 관련 이벤트 7개(`session_create_*`, `session_file_select`, `session_client_select`, `session_stt_model_change`)는 제외했습니다.

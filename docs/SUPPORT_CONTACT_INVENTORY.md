# 문의 유도 지점 전수 목록

사용자를 고객 문의로 보내는 모든 지점과, 오픈채팅 → 카카오톡 채널 전환 범위를 정리한다.

## 무엇이 바뀌었나

| | 이전 | 이후 |
|---|---|---|
| 토스트·에러 화면 링크 | `https://open.kakao.com/me/Mindthos` (오픈채팅) | `https://pf.kakao.com/_GYyxdX/chat` (카카오톡 채널 1:1) |
| 보고서 실패 화면 링크 | `https://open.kakao.com/o/sM96U0oh` (오픈채팅, **다른 방**) | 〃 |
| anchor 텍스트 | `오픈채팅으로 문의하기` | `카카오톡으로 문의하기` |

기존에 **서로 다른 오픈채팅방 두 개**가 쓰이고 있었고, 이번에 카카오톡 채널 하나로 합쳤다.

노출 지점이 모두 상수를 참조하므로, 링크와 문구를 바꾸는 데는 아래 두 파일이면 충분하다.

- `src/shared/constants/support.ts` — `SUPPORT_KAKAO_URL`, `SUPPORT_LINK_LABEL`
- `src/shared/constants/externalUrls.ts` — `KAKAO_SUPPORT_URL`

여기에 더해 문의 경로가 없던 인라인 오류 10곳에 링크를 새로 붙였다(아래 참고).

## 어떻게 노출되나

두 가지 경로가 있다.

**1. 토스트 자동 부착** — `Toast.tsx:138`

```tsx
{toast.description.includes(SUPPORT_TRIGGER_PHRASE) && ( … <a href={SUPPORT_KAKAO_URL}> … )}
```

토스트 `description`에 **`잠시 후 다시 시도해 주세요`** 가 포함되면 문의 anchor가 자동으로 따라붙는다. 개별 호출부는 링크를 알지 못하고, 문구가 트리거 역할을 한다.

**2. 화면에 직접 박힌 anchor** — 아래 5곳은 토스트가 아니라 화면 안에 링크가 있다.

| 위치 | 화면 |
|---|---|
| `src/features/error/page/ErrorPage.tsx:23` | 전역 에러 페이지 |
| `src/widgets/error/ErrorBoundary.tsx:51` | 렌더링 예외 fallback |
| `src/features/auth/page/AuthPage.tsx:105` | 로그인 화면 하단 |
| `src/features/auth/page/UserVerifyPage.tsx:368` | 본인인증 실패 안내 |
| `src/widgets/report/ReportGeneratingView.tsx:384` | 보고서 생성 실패 (`마음토스 오류 문의` 버튼) |

## 문의 anchor가 붙는 토스트 (29건)

이 토스트가 뜨면 사용자는 문의 링크를 볼 수 있다.

### 상담 기록 · 축어록
| 상황 | 토스트 제목 | 위치 |
|---|---|---|
| 상담노트 작성 실패 | 상담노트 작성 실패 | `useProgressNoteCreation.ts:192` |
| 상담노트 재생성 실패 | 상담노트 재생성 실패 | `useProgressNoteCreation.ts:328` |
| 축어록 화자 변경 실패 | 화자 변경 실패 | `useTranscriptEditSession.ts:608` |
| 축어록 저장 실패 | 저장 실패 | `useTranscriptEditSession.ts:1031` |
| 마크다운 편집 저장 실패 | 저장 실패 | `useMarkdownEditSession.ts:172` |
| 상담 기록 제목 수정 실패 | 제목 수정 실패 | `SessionRecordCard.tsx:493` |
| 상담기록 삭제 실패 | 상담기록 삭제 실패 | `SessionRecordCard.tsx:550` |
| 내담자 할당 실패 | 내담자 할당 실패 | `SessionRecordCard.tsx:577` |
| 직접 입력 상담 기록 생성 실패 | 상담 기록 생성 실패 | `CreateHandWrittenSessionModal.tsx:201` |
| 다중 세션 생성 실패 | 상담 기록 생성 실패 | `CreateMultiSessionModal.tsx:424` |

### 결제 · 구독
| 상황 | 토스트 제목 | 위치 |
|---|---|---|
| 구독 해지 실패 | 구독 해지 실패 | `CancelSubscriptionModal.tsx:71` |
| 해지/변경 예약 취소 실패 | 해지 예약 취소 실패 · 변경 예약 취소 실패 | `SettingsContainer.tsx:213` |
| 플랜 다운그레이드 실패 | 플랜 변경 실패 | `DowngradeConfirmModal.tsx:81` |
| 카드 등록 실패 | 카드 등록 실패 | `CardRegistrationModal.tsx:75` |
| 카드 삭제 실패 | 카드 삭제 실패 | `CardInfo.tsx:68` |
| 결제 파라미터 누락 | 결제를 진행할 수 없어요 | `PaymentSuccess.tsx:49` |

### 내담자 · 분석
| 상황 | 토스트 제목 | 위치 |
|---|---|---|
| AI 슈퍼비전 분석 실패 | 분석 실패 | `AiSupervisionContainer.tsx:174` |
| 내담자 분석 PDF 출력 실패 | PDF 출력 실패 | `ClientAnalysisTab.tsx:307` |

### 일정 · 문서
| 상황 | 토스트 제목 | 위치 |
|---|---|---|
| 일정 저장 실패 | 일정 저장 실패 | `useCalendarEventMutations.ts:222` |
| 일정 삭제 실패 | 일정 삭제 실패 | `useCalendarEventMutations.ts:250` |
| 캘린더 카테고리 삭제 실패 | 카테고리 삭제 실패 | `CalendarContainer.tsx:239` |
| 외부 캘린더 연동 실패 | 캘린더 연동 실패 | `CalendarContainer.tsx:263` |
| 문서 저장 실패 | 문서 저장 실패 | `DocumentEditorContainer.tsx:197` |
| 문서 삭제 실패 | 문서 삭제 실패 | `MyDocumentCard.tsx:47` |

### 계정 · 인증
| 상황 | 토스트 제목 | 위치 |
|---|---|---|
| 회원가입 처리 실패 | 회원가입을 처리하지 못했어요. | `UserVerifyPage.tsx:203` |
| 휴대폰 인증번호 발송 실패 | 인증번호 발송 실패 | `PhoneVerificationField.tsx:133` |
| 비밀번호 재설정 요청 과다 | 요청이 너무 자주 들어왔어요 | `PasswordResetForm.tsx:70` |
| 회원정보 수정 실패 | 정보 입력 실패 | `UserEditModal.tsx:258` |
| 온보딩 보상 수령 실패 | 보상 수령 실패 | `CompleteMissionModal.tsx:127` |

## 호출부에 따라 토스트가 되는 메시지 (13건)

문구를 직접 들고 있는 상수·헬퍼다. 이 값이 토스트 `description`으로 전달되면 anchor가 붙고, 인라인으로 렌더되면 붙지 않는다.

| 소스 | 내용 |
|---|---|
| `shared/api/services/auth/constants.ts:20,22,23,24` | `ERROR_MESSAGES`의 요청 과다 · 인증 처리 실패 · 일반 오류 · 알 수 없는 오류. `errorHandlers.ts`를 거쳐 Error로 던져지고 화면마다 다르게 표시된다 |
| `psychology-assessments/utils/userMessages.ts:4,18,21,50` | 심리검사 답변 생성 실패 · 분석 서버 연결 · 분석 시작 실패 · 이전 업로드 정리 실패 |
| `session/hooks/useDeidentification.tsx:67` | 비식별화 확인 실패(422) |
| `shared-document/page/SharedDocumentPage.tsx:41` | 공유 문서 로드 실패 |
| `shared/api/supabase/genogramAIQueries.ts:165` | 가계도 생성 지연(`PIPELINE_ERROR`) |
| `widgets/document/SendDocumentModal.tsx:87` | 문서 발송 실패 fallback |
| `widgets/auth/PasswordResetRequestStep.tsx:48` | 비밀번호 재설정 요청 과다 |

## 인라인 오류에 문의 링크를 추가한 곳 (10개 지점)

토스트가 아니라 `setError`·사이드바 문구로 그리던 오류에는 문의 경로가 없었다. 문의가 가장 필요한 순간(로그인 실패, 비밀번호 재설정 실패, 계정 탈퇴 실패)에도 사용자가 닿을 곳이 없어 `SupportContactHint`를 붙였다.

`src/shared/ui/atoms/SupportContactHint.tsx` — 메시지에 트리거 문구가 있을 때만 링크를 그린다. 판단 기준을 토스트와 같게 둬서, 입력값 오류처럼 사용자가 스스로 고칠 수 있는 오류에는 나타나지 않는다.

| 상황 | 표시 위치 | 파일 |
|---|---|---|
| 구글·카카오 로그인 연결 실패 | 로그인 폼 상단 | `AuthPage.tsx:130` |
| 비밀번호 변경 실패 | 재설정 폼 | `PasswordResetForm.tsx:88` |
| 재설정 메일 발송 실패 | 요청 폼 | `PasswordResetRequestStep.tsx:380` |
| 재설정 메일 재발송 실패 | 발송 완료 화면 | `PasswordResetRequestStep.tsx:221` |
| 인증 메일 재발송 실패 | 이메일 인증 단계 | `EmailVerificationStep.tsx:76` |
| 계정 탈퇴 실패 | 탈퇴 확인 모달 | `DeleteAccountModal.tsx:57` |
| 공유 문서 제출 실패 | 공유 문서 페이지 | `SharedDocumentPage.tsx:289` |
| 내담자 목록 로드 실패 | 내담자 사이드바 | `client/ClientSidebar.tsx:142` |
| 내담자 목록 로드 실패 | 심리검사 사이드바 | `psychology-assessments/…/ClientSidebar.tsx:135` |
| 가계도 렌더 실패 | 생성 단계 Alert | `RenderStep.tsx:107` |

로그인 실패는 구글·카카오 두 경로가 같은 영역에 그려져 지점 하나로 묶인다.

### 링크를 붙이지 않은 인라인 오류

| 위치 | 이유 |
|---|---|
| `ErrorPage.tsx:21` · `ErrorBoundary.tsx:49` · `UserVerifyPage.tsx:366` | 바로 옆에 직접 박힌 anchor가 이미 있다 |

## 주의

- **트리거는 문구 일치다.** `잠시 후 다시 시도해 주세요`를 정확히 포함해야 anchor가 붙는다. `다시 시도해 주세요`만 쓴 메시지(심리검사 `userMessages.ts` 다수, `ChatConversationView.tsx` 등)에는 붙지 않는다. 새 토스트를 만들 때 문의를 노출하려면 문구를 그대로 써야 한다.
- 링크를 다시 바꿀 때는 위 상수 두 개만 고치면 전 지점에 반영된다.
- 인라인 오류에 문의를 노출하려면 `<SupportContactHint message={오류메시지} />`를 메시지 옆에 둔다. 트리거 판단은 컴포넌트가 하므로 조건문을 따로 쓰지 않아도 된다.

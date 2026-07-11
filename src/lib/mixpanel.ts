import mixpanel from 'mixpanel-browser';

// Initialize Mixpanel with the token from environment variables
const MIXPANEL_TOKEN = import.meta.env.VITE_MIXPANEL_TOKEN;

/**
 * 민감 화면 경로 접두사 — 내담자 공유문서(/shared-documents/:clientId/:sentRowId/:accessToken).
 * 공개·미인증이며 이름·민감정보 동의·문서 본문·서명 이미지를 렌더하고, URL에 bearer 토큰을
 * 담으므로 이 경로에서는 Mixpanel 수집(autocapture·세션 리플레이·페이지뷰)을 제외한다.
 */
export const SENSITIVE_PATH_PREFIX = '/shared-documents/';

// 토큰이 없으면 init을 건너뛰는데, 이때 track 등을 호출하면 mixpanel 내부 _flags가
// undefined라 "Cannot read properties of undefined (reading 'disable_all_events')"로 터진다.
// 초기화 여부를 기록해두고, 미초기화 시 모든 트래킹을 no-op 처리한다.
let isInitialized = false;
// 이 세션에서 세션 리플레이가 실제 활성인지 — 민감화면 직접 진입 시 init에서 0%로 꺼지므로,
// 그 경우 resume에서 리플레이를 강제로 다시 켜지 않도록 기억한다.
let sessionRecordingEnabled = false;

if (!MIXPANEL_TOKEN) {
  if (import.meta.env.PROD) {
    console.warn('Mixpanel token is missing in production environment');
  }
} else {
  // 민감 화면(내담자 공유문서)으로 '직접 진입'한 경우 처음부터 autocapture·세션 리플레이를
  // 끈 채로 init한다 — URL의 bearer 토큰과 상담/건강 PII(이름·동의·서명)가 수집되지 않게.
  // (앱 내 이동으로 들어오는 경우는 pauseTrackingForSensitiveScreen이 추가로 막는다.)
  // React Router는 경로를 대소문자 무시로 매칭하므로 가드도 toLowerCase로 정규화한다.
  const onSensitiveScreen =
    typeof window !== 'undefined' &&
    window.location.pathname.toLowerCase().startsWith(SENSITIVE_PATH_PREFIX);
  mixpanel.init(MIXPANEL_TOKEN, {
    debug: import.meta.env.DEV,
    ignore_dnt: true,
    autocapture: !onSensitiveScreen,
    record_sessions_percent: onSensitiveScreen ? 0 : 100,
    api_transport: 'sendBeacon',
  });
  isInitialized = true;
  sessionRecordingEnabled = !onSensitiveScreen;
}

export const trackEvent = (
  eventName: string,
  props?: Record<string, unknown>
) => {
  if (!isInitialized) return;
  mixpanel.track(eventName, props);
};

export const trackPageView = (
  eventName: string,
  props: { from: string; to: string }
) => {
  if (!isInitialized) return;
  mixpanel.track(eventName, props);
};

export const trackError = (
  errorType: string,
  error: unknown,
  context?: Record<string, unknown>
) => {
  const errorMessage =
    error instanceof Error ? error.message : String(error || 'Unknown error');

  if (!isInitialized) return;

  const errorStack =
    import.meta.env.DEV && error instanceof Error ? error.stack : undefined;

  mixpanel.track('error_occurred', {
    error_type: errorType,
    error_message: errorMessage,
    ...(errorStack && { error_stack: errorStack }),
    ...context,
  });
};

type MixpanelJoinUserId = number | string | null | undefined;

type IdentifyUserOptions = {
  joinUserId?: MixpanelJoinUserId;
};

const normalizeJoinUserId = (
  userId: MixpanelJoinUserId
): number | string | undefined => {
  if (typeof userId === 'number') {
    return Number.isFinite(userId) ? userId : undefined;
  }

  if (typeof userId === 'string') {
    const trimmedUserId = userId.trim();
    return trimmedUserId.length > 0 ? trimmedUserId : undefined;
  }

  return undefined;
};

export const identifyUser = (
  userId: string,
  traits?: Record<string, unknown>,
  options?: IdentifyUserOptions
) => {
  if (!isInitialized) return;
  mixpanel.identify(userId);

  const joinUserId = normalizeJoinUserId(options?.joinUserId);
  if (joinUserId !== undefined) {
    mixpanel.register({ user_id: joinUserId });
  }

  if (traits || joinUserId !== undefined) {
    mixpanel.people.set({
      ...traits,
      ...(joinUserId !== undefined ? { user_id: joinUserId } : {}),
    });
  }
};

export const resetMixpanel = () => {
  if (!isInitialized) return;
  mixpanel.reset();
};

/**
 * 민감 화면(내담자 공유문서) 진입 시 호출 — 이벤트·autocapture·세션 리플레이를 모두 멈춰
 * URL 토큰과 상담/건강 PII가 Mixpanel로 수집되지 않게 한다.
 * (직접 로드는 init에서 이미 비활성 — 이 함수는 앱 내 이동으로 진입하는 경우를 막는다.)
 */
export const pauseTrackingForSensitiveScreen = () => {
  if (!isInitialized) return;
  mixpanel.stop_session_recording();
  mixpanel.opt_out_tracking({ delete_user: false });
};

/** 민감 화면 이탈 시 호출 — 트래킹·세션 리플레이 재개(opt-in 이벤트는 보내지 않음). */
export const resumeTrackingAfterSensitiveScreen = () => {
  if (!isInitialized) return;
  mixpanel.opt_in_tracking({ track: () => undefined });
  // 직접 진입(민감화면)으로 시작된 세션은 리플레이가 애초에 꺼져 있었으므로 다시 켜지 않는다.
  if (sessionRecordingEnabled) mixpanel.start_session_recording();
};

export default mixpanel;

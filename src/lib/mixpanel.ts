import mixpanel from 'mixpanel-browser';

// Initialize Mixpanel with the token from environment variables
const MIXPANEL_TOKEN = import.meta.env.VITE_MIXPANEL_TOKEN;

// 토큰이 없으면 init을 건너뛰는데, 이때 track 등을 호출하면 mixpanel 내부 _flags가
// undefined라 "Cannot read properties of undefined (reading 'disable_all_events')"로 터진다.
// 초기화 여부를 기록해두고, 미초기화 시 모든 트래킹을 no-op 처리한다.
let isInitialized = false;

if (!MIXPANEL_TOKEN) {
  if (import.meta.env.PROD) {
    console.warn('Mixpanel token is missing in production environment');
  }
} else {
  mixpanel.init(MIXPANEL_TOKEN, {
    debug: import.meta.env.DEV,
    ignore_dnt: true,
    autocapture: true,
    record_sessions_percent: 100,
    api_transport: 'sendBeacon',
  });
  isInitialized = true;
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

export const identifyUser = (
  userId: string,
  traits?: Record<string, unknown>
) => {
  if (!isInitialized) return;
  mixpanel.identify(userId);
  if (traits) {
    mixpanel.people.set(traits);
  }
};

export const resetMixpanel = () => {
  if (!isInitialized) return;
  mixpanel.reset();
};

export default mixpanel;

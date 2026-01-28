import mixpanel from 'mixpanel-browser';

// Initialize Mixpanel with the token from environment variables
const MIXPANEL_TOKEN = import.meta.env.VITE_MIXPANEL_TOKEN;

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
}

export const trackEvent = (
  eventName: string,
  props?: Record<string, unknown>
) => {
  mixpanel.track(eventName, props);
};

export const trackPageView = (
  eventName: string,
  props: { from: string; to: string }
) => {
  mixpanel.track(eventName, props);
};

export const trackError = (
  errorType: string,
  error: unknown,
  context?: Record<string, unknown>
) => {
  const errorMessage =
    error instanceof Error ? error.message : String(error || 'Unknown error');

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
  mixpanel.identify(userId);
  if (traits) {
    mixpanel.people.set(traits);
  }
};

export const resetMixpanel = () => {
  mixpanel.reset();
};

export default mixpanel;

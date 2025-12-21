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
  });
}

export const trackEvent = (
  eventName: string,
  props?: Record<string, unknown>
) => {
  mixpanel.track(eventName, props);
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

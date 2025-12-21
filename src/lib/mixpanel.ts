import mixpanel from 'mixpanel-browser';

// Initialize Mixpanel with the token from index.html
// This ensures the npm package is synced with the snippet
mixpanel.init('94a210569dced95348737961307ad7e6', {
  debug: import.meta.env.DEV,
  ignore_dnt: true,
});

export const trackEvent = (eventName: string, props?: Record<string, any>) => {
  mixpanel.track(eventName, props);
};

export const identifyUser = (userId: string, traits?: Record<string, any>) => {
  mixpanel.identify(userId);
  if (traits) {
    mixpanel.people.set(traits);
  }
};

export const resetMixpanel = () => {
  mixpanel.reset();
};

export default mixpanel;

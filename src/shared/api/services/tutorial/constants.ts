export const TUTORIAL_ENDPOINTS = {
  CURRENT: '/tutorials/current',
  ENROLL: '/tutorials/enroll',
  PROGRESS: '/tutorials/progress',
  COMPLETE: '/tutorials/complete',
  REWARD: '/tutorials/reward',
  VIRTUAL_CLIENTS: '/tutorials/virtual-clients',
  ENSURE_VIRTUAL_CLIENTS: '/tutorials/virtual-clients/ensure',
  DIRECT_VIRTUAL_SESSION_UPLOAD:
    '/tutorials/virtual-clients/session-4/direct-upload',
} as const;

export const tutorialQueryKeys = {
  all: ['tutorial'] as const,
  current: () => [...tutorialQueryKeys.all, 'current'] as const,
  virtualClients: () => [...tutorialQueryKeys.all, 'virtual-clients'] as const,
};

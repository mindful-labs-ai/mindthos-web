export const templateQueryKeys = {
  all: ['templates'] as const,
  lists: () => [...templateQueryKeys.all, 'list'] as const,
  list: () => [...templateQueryKeys.lists()] as const,
  pins: () => [...templateQueryKeys.all, 'pins'] as const,
  pin: (userId: string) => [...templateQueryKeys.pins(), userId] as const,
};

export const TUTORIAL_HAS_RECORD_STORAGE_KEY =
  'mindthos:tutorial:has-record' as const;

export function readTutorialHasRecord(): boolean | null {
  if (typeof window === 'undefined') return null;

  const value = window.sessionStorage.getItem(TUTORIAL_HAS_RECORD_STORAGE_KEY);
  if (value === 'true') return true;
  if (value === 'false') return false;
  return null;
}

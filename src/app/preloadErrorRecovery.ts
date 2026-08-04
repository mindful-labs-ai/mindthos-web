const RECOVERY_TIMESTAMP_KEY = 'mindthos:preload-recovery-at';
const RECOVERY_COOLDOWN_MS = 30_000;

type RecoveryStorage = Pick<Storage, 'getItem' | 'setItem'>;

export function markPreloadRecovery(
  storage: RecoveryStorage,
  now = Date.now()
): boolean {
  try {
    const previous = Number(storage.getItem(RECOVERY_TIMESTAMP_KEY));
    if (
      Number.isFinite(previous) &&
      previous > 0 &&
      now - previous < RECOVERY_COOLDOWN_MS
    ) {
      return false;
    }

    storage.setItem(RECOVERY_TIMESTAMP_KEY, String(now));
    return true;
  } catch {
    return true;
  }
}

export function installPreloadErrorRecovery(): void {
  if (typeof window === 'undefined') return;

  window.addEventListener('vite:preloadError', (event) => {
    event.preventDefault();
    if (!markPreloadRecovery(window.sessionStorage)) return;

    window.location.reload();
  });
}

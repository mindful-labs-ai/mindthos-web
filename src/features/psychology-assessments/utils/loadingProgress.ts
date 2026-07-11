const LOADING_START_PERCENT = 10;
const LOADING_JITTER_RANGE = 3;

const clamp = (value: number, min: number, max: number) =>
  Math.max(min, Math.min(max, value));

const hashString = (value: string): number => {
  let hash = 0;
  for (let i = 0; i < value.length; i++) {
    hash = (hash * 31 + value.charCodeAt(i)) >>> 0;
  }
  return hash;
};

const stableJitter = (key: string): number => {
  const spread = LOADING_JITTER_RANGE * 2 + 1;
  return (hashString(key) % spread) - LOADING_JITTER_RANGE;
};

/**
 * 로딩 표시는 0%에서 멈춘 느낌을 줄이기 위해 10%부터 시작한다.
 * 실제 단계 기준값은 나머지 90%에 배치하고, 완료 전에는 100%를 먼저 보여주지 않는다.
 */
export function toLoadingDisplayPercent(
  rawPercent: number,
  jitterKey: string
): number {
  if (rawPercent >= 100) return 100;

  const normalized = clamp(rawPercent, 0, 100);
  if (normalized === 0) return LOADING_START_PERCENT;

  const baseline =
    LOADING_START_PERCENT + normalized * ((100 - LOADING_START_PERCENT) / 100);
  const jittered = baseline + stableJitter(jitterKey);

  return Math.round(clamp(jittered, LOADING_START_PERCENT, 99));
}

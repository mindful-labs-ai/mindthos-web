import { describe, expect, it } from 'vitest';

const sourceModules = import.meta.glob('/src/**/*.{ts,tsx}', {
  eager: true,
  import: 'default',
  query: '?raw',
}) as Record<string, string>;

const productionSources = Object.entries(sourceModules).filter(
  ([path]) =>
    !path.includes('.test.') &&
    !path.includes('.stories.') &&
    !path.includes('/__tests__/')
);

const findSources = (pattern: RegExp) =>
  productionSources
    .filter(([, source]) => pattern.test(source))
    .map(([path]) => path);

describe('non-CRM server-only EF boundary', () => {
  it('[WEB-EF-26] production source에 범용 Edge Function runtime fallback이 없다', () => {
    expect(
      findSources(
        /supabase\.functions\.invoke|callEdgeFunction|edgeFunctionClient/
      )
    ).toEqual([]);
  });

  it('[WEB-EF-27] 폐기된 patch-history Edge Function 호출이 없다', () => {
    expect(findSources(/['"]patch-history['"]/)).toEqual([]);
  });

  it('[WEB-CRM-01] CRM 예외는 unsubscribe Edge Function 한 곳으로 고정한다', () => {
    expect(findSources(/functions\/v1\/unsubscribe/)).toEqual([
      '/src/features/unsubscribe/page/UnsubscribePage.tsx',
    ]);
    expect(findSources(/functions\/v1\/(?!unsubscribe)/)).toEqual([]);
  });
});

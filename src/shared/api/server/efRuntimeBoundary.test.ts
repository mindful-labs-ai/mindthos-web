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

describe('server-only EF boundary', () => {
  it('[WEB-EF-26] production source에 Edge Function runtime fallback이 없다', () => {
    expect(
      findSources(
        /supabase\.functions\.invoke|callEdgeFunction|edgeFunctionClient/
      )
    ).toEqual([]);
  });

  it('[WEB-EF-27] 폐기된 patch-history Edge Function 호출이 없다', () => {
    expect(findSources(/['"]patch-history['"]/)).toEqual([]);
  });
});

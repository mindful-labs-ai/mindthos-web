/// <reference types="node" />

import { readdirSync, readFileSync } from 'node:fs';
import { join, relative, sep } from 'node:path';

import { describe, expect, it } from 'vitest';

type SourceEntry = readonly [path: string, source: string];

const projectRoot = process.cwd();

const readSources = (directory: string): SourceEntry[] =>
  readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const absolutePath = join(directory, entry.name);
    if (entry.isDirectory()) return readSources(absolutePath);
    if (!entry.isFile() || !/\.tsx?$/.test(entry.name)) return [];

    const path = `/${relative(projectRoot, absolutePath).split(sep).join('/')}`;
    return [[path, readFileSync(absolutePath, 'utf8')] as const];
  });

const productionSources = ['src']
  .flatMap((directory) => readSources(join(projectRoot, directory)))
  .filter(
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
  it('[WEB-EF-26] src에 범용 Edge Function runtime fallback이 없다', () => {
    expect(
      findSources(
        /\.functions\s*\.\s*invoke\s*\(|callEdgeFunction|edgeFunctionClient/
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

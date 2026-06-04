import type { JsonSchema } from '../schemas/jsonSchema.types';

import {
  collectLeaves,
  PATH_SEP,
  schemaToFields,
  type FormNode,
} from './schemaToFields';

type SchemaPathState = 'absent' | 'missing' | 'verified';

export interface SchemaReviewStats {
  /** 사용자 입력으로 보완할 수 있는 스키마 leaf 경로. */
  missingPaths: ReadonlySet<string>;
  /** 스키마에 대응하지 않아 프론트에서 안전하게 보완할 수 없는 null 경로. */
  unmappedMissingPaths: readonly string[];
  /** 현재 OCR 결과에서 확인된 스키마 leaf 수. */
  verified: number;
  /** 확인된 leaf + 실제 입력이 필요한 leaf 수. 응답에 아예 없는 경로는 제외한다. */
  total: number;
  /** 실제 입력이 필요한 스키마 leaf 수. */
  missing: number;
}

const hasOwn = (value: Record<string, unknown>, key: string): boolean =>
  Object.prototype.hasOwnProperty.call(value, key);

const containsNull = (value: unknown): boolean => {
  if (value === null) return true;
  if (!Array.isArray(value)) return false;
  return value.some(containsNull);
};

/**
 * 스키마 leaf 경로의 OCR 결과 상태.
 *
 * 명시적인 null만 missing으로 취급한다. 응답에 아예 없는 경로를 누락으로 잡으면
 * 부분 테스트 데이터 하나가 전체 스키마 입력으로 폭증하므로 absent로 분리한다.
 * 중간 object가 null이면 그 아래 모든 leaf가 missing이 되어 입력 폼과 개수가 맞는다.
 */
export const getSchemaPathState = (
  score: unknown,
  path: string
): SchemaPathState => {
  let current = score;

  for (const segment of path.split(PATH_SEP)) {
    if (current === null) return 'missing';
    if (
      typeof current !== 'object' ||
      Array.isArray(current) ||
      !hasOwn(current as Record<string, unknown>, segment)
    ) {
      return 'absent';
    }
    current = (current as Record<string, unknown>)[segment];
  }

  if (current === undefined) return 'absent';
  return containsNull(current) ? 'missing' : 'verified';
};

const collectNullPaths = (
  value: unknown,
  parentPath = '',
  paths: string[] = []
): string[] => {
  if (value === null) {
    paths.push(parentPath);
    return paths;
  }
  if (Array.isArray(value)) {
    value.forEach((item, index) =>
      collectNullPaths(
        item,
        parentPath ? `${parentPath}${PATH_SEP}${index}` : String(index),
        paths
      )
    );
    return paths;
  }
  if (typeof value !== 'object') return paths;

  Object.entries(value as Record<string, unknown>).forEach(([key, child]) =>
    collectNullPaths(
      child,
      parentPath ? `${parentPath}${PATH_SEP}${key}` : key,
      paths
    )
  );
  return paths;
};

const pathsOverlap = (left: string, right: string): boolean =>
  left === right ||
  left.startsWith(`${right}${PATH_SEP}`) ||
  right.startsWith(`${left}${PATH_SEP}`);

const setPathValue = (
  target: Record<string, unknown>,
  path: string,
  value: unknown
): void => {
  const segments = path.split(PATH_SEP);
  let current = target;

  for (const segment of segments.slice(0, -1)) {
    const next = current[segment];
    if (next === null || typeof next !== 'object' || Array.isArray(next)) {
      current[segment] = {};
    }
    current = current[segment] as Record<string, unknown>;
  }
  current[segments.at(-1)!] = value;
};

const getSchemaConstantValues = (
  schema: JsonSchema
): Record<string, unknown> => {
  const values: Record<string, unknown> = {};
  const walk = (node: FormNode): void => {
    if (node.kind === 'section') {
      node.children.forEach(walk);
      return;
    }
    if (node.constValue !== undefined) {
      values[node.path] = node.constValue;
    }
  };

  schemaToFields(schema).forEach(walk);
  return values;
};

const getPathValue = (
  source: Record<string, unknown>,
  path: string
): { found: boolean; value?: unknown } => {
  let current: unknown = source;

  for (const segment of path.split(PATH_SEP)) {
    if (
      current === null ||
      typeof current !== 'object' ||
      Array.isArray(current) ||
      !hasOwn(current as Record<string, unknown>, segment)
    ) {
      return { found: false };
    }
    current = (current as Record<string, unknown>)[segment];
  }

  return current === undefined
    ? { found: false }
    : { found: true, value: current };
};

/**
 * object null을 사용자 입력으로 복구할 때 그 안의 schema const도 함께 복원한다.
 * 응답에 아예 없던 경로는 새로 만들지 않는다.
 */
export const applyMissingSchemaConstants = (
  schema: JsonSchema,
  score: Record<string, unknown>
): Record<string, unknown> => {
  const next = structuredClone(score);

  Object.entries(getSchemaConstantValues(schema)).forEach(([path, value]) => {
    if (getSchemaPathState(score, path) !== 'missing') return;
    setPathValue(next, path, structuredClone(value));
  });

  return next;
};

/**
 * OCR 결과를 지원 스키마 경로만 남긴 객체로 정리한다.
 * 스키마 밖 별칭/오타 필드는 검수 카드를 막지 않고 확정 요청에서도 제거한다.
 */
export const projectScoreToSchema = (
  schema: JsonSchema,
  score: Record<string, unknown>
): Record<string, unknown> => {
  const projected: Record<string, unknown> = {};
  const paths = [
    ...collectLeaves(schemaToFields(schema)).map((leaf) => leaf.path),
    ...Object.keys(getSchemaConstantValues(schema)),
  ];

  paths.forEach((path) => {
    const { found, value } = getPathValue(score, path);
    if (!found) return;
    setPathValue(projected, path, structuredClone(value));
  });

  return projected;
};

/**
 * 검수 카드와 항목 채우기 폼이 공유하는 스키마 기반 집계.
 *
 * object null은 하위 leaf 전체로 확장한다. 스키마 밖 null은 진단 정보로만 반환하며,
 * 실제 확정 요청에서는 projectScoreToSchema로 제거한다.
 */
export const getSchemaReviewStats = (
  schema: JsonSchema,
  score: Record<string, unknown>
): SchemaReviewStats => {
  const leaves = collectLeaves(schemaToFields(schema));
  const missingPaths = new Set<string>();
  let verified = 0;

  leaves.forEach((leaf) => {
    const state = getSchemaPathState(score, leaf.path);
    if (state === 'missing') missingPaths.add(leaf.path);
    if (state === 'verified') verified += 1;
  });

  const mappedMissingPaths = [
    ...missingPaths,
    ...Object.keys(getSchemaConstantValues(schema)).filter(
      (path) => getSchemaPathState(score, path) === 'missing'
    ),
  ];
  const unmappedMissingPaths = collectNullPaths(score).filter(
    (nullPath) =>
      !mappedMissingPaths.some((missingPath) =>
        pathsOverlap(nullPath, missingPath)
      )
  );

  return {
    missingPaths,
    unmappedMissingPaths,
    verified,
    total: verified + missingPaths.size,
    missing: missingPaths.size,
  };
};

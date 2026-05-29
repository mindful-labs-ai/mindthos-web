import type { JsonSchema } from '../schemas/jsonSchema.types';

/**
 * 우리 스키마는 #/$defs/Name 형태만 사용 — 단순 lookup.
 */
const resolveRef = (root: JsonSchema, ref: string): JsonSchema => {
  if (!ref.startsWith('#/$defs/')) return {};
  const key = ref.replace('#/$defs/', '');
  return root.$defs?.[key] ?? {};
};

/**
 * $ref / allOf를 깊이 풀어 단일 스키마 객체로 정규화.
 *
 * - $ref → root.$defs에서 lookup
 * - allOf → 모든 항목을 merge (properties는 shallow merge, 같은 키면 뒤가 우선)
 *
 * 재귀적으로 properties / items / oneOf 내부도 풀지 않음 (성능/순환 위험).
 * 호출자가 leaf까지 traversal하면서 필요할 때마다 resolveSchema를 호출.
 */
export const resolveSchema = (
  schema: JsonSchema,
  root: JsonSchema
): JsonSchema => {
  let current = schema;

  // $ref 풀기 (체인 따라가기)
  while (current.$ref) {
    current = resolveRef(root, current.$ref);
  }

  // allOf merge
  if (current.allOf && current.allOf.length > 0) {
    const merged: JsonSchema = { ...current };
    delete (merged as { allOf?: JsonSchema[] }).allOf;

    for (const part of current.allOf) {
      const resolved = resolveSchema(part, root);
      merged.type = merged.type ?? resolved.type;
      merged.description = merged.description ?? resolved.description;

      if (resolved.properties) {
        merged.properties = {
          ...(merged.properties ?? {}),
          ...resolved.properties,
        };
      }
      if (resolved.required) {
        merged.required = Array.from(
          new Set([...(merged.required ?? []), ...resolved.required])
        );
      }
      // const는 leaf merge에 의미 있음 (e.g. SubscaleScoreBase + 라벨 const)
      if (resolved.properties) {
        for (const [k, v] of Object.entries(resolved.properties)) {
          if (v.const !== undefined && merged.properties?.[k]) {
            merged.properties[k] = { ...merged.properties[k], const: v.const };
          }
        }
      }
    }
    current = merged;
  }

  return current;
};

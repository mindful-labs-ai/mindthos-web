/**
 * 우리가 사용하는 JSON Schema의 하위 집합 타입.
 * 심리검사 schema가 사용하는 형태에 한정 — 완전한 JSON Schema 스펙은 아님.
 */
export type JsonSchemaPrimitive =
  | 'string'
  | 'integer'
  | 'number'
  | 'boolean'
  | 'array'
  | 'object'
  | 'null';

export interface JsonSchema {
  $ref?: string;
  $defs?: Record<string, JsonSchema>;
  type?: JsonSchemaPrimitive | JsonSchemaPrimitive[];
  title?: string;
  description?: string;

  // string
  pattern?: string;
  enum?: (string | number)[];
  const?: string | number | boolean | null | (string | number)[];
  minLength?: number;

  // numeric
  minimum?: number;
  maximum?: number;

  // object
  properties?: Record<string, JsonSchema>;
  required?: string[];
  additionalProperties?: boolean | JsonSchema;

  // array
  items?: JsonSchema;
  uniqueItems?: boolean;

  // composition
  oneOf?: JsonSchema[];
  anyOf?: JsonSchema[];
  allOf?: JsonSchema[];
}

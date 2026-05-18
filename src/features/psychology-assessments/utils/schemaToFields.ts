import type { JsonSchema } from '../schemas/jsonSchema.types';

import { resolveSchema } from './schemaResolver';

/**
 * 동적 폼에서 사용할 노드 트리.
 */
export type FormNode = FormSection | FormLeaf;

export interface FormSection {
  kind: 'section';
  key: string;
  label: string;
  path: string;
  required: boolean;
  description?: string;
  children: FormNode[];
}

export interface FormLeaf {
  kind: 'leaf';
  key: string;
  label: string;
  path: string;
  required: boolean;
  description?: string;
  inputType: LeafInputType;
  options?: (string | number)[];
  pattern?: string;
  constValue?: string | number | boolean | null | (string | number)[];
}

/**
 * 세분화된 input 종류:
 *  - text:               일반 짧은 문자열 (이름, 소속 등)
 *  - number:             정수/실수 (척도 점수)
 *  - date:               YYYYMMDD 8자리 숫자
 *  - percent:            "NN%" 형태
 *  - enum:               옵션 chip
 *  - textarea:           긴 자유 응답
 *  - array-of-numbers:   문항 번호 등 콤마 구분 입력
 *  - union:              oneOf 복합 (TRIN T점수: 평형 시 정수, 외 시 NN[TF])
 */
export type LeafInputType =
  | 'text'
  | 'number'
  | 'date'
  | 'percent'
  | 'enum'
  | 'textarea'
  | 'array-of-numbers'
  | 'union';

const prettifyLabel = (key: string): string => key.replace(/_/g, ' ').trim();

const primaryType = (type: JsonSchema['type']): string | undefined => {
  if (!type) return undefined;
  if (Array.isArray(type)) {
    return type.find((t) => t !== 'null') ?? type[0];
  }
  return type;
};

/** key/스키마 기반 input 종류 결정 */
const detectInputType = (key: string, resolved: JsonSchema): LeafInputType => {
  if (resolved.enum) return 'enum';
  if (resolved.oneOf) return 'union';

  const t = primaryType(resolved.type);
  if (t === 'array') return 'array-of-numbers';
  if (t === 'integer' || t === 'number') return 'number';

  // string 분기
  if (resolved.pattern === '^[0-9]{8}$') return 'date';
  if (resolved.pattern?.includes('%')) return 'percent';

  // 자유 응답/요약은 textarea
  const TEXTAREA_KEY_HINTS = ['응답', '해석요약', '제시문구'];
  if (TEXTAREA_KEY_HINTS.some((h) => key.includes(h))) return 'textarea';

  return 'text';
};

/**
 * properties를 의도된 표시 순서로 정렬.
 *  - required 배열 순서를 우선 (의도된 시퀀스 보존)
 *  - required에 없는 키는 뒤에 properties 삽입 순서대로
 *
 * JS 엔진은 객체 integer-like 키("10"~"50")를 leading-zero 키("01"~"09")보다
 * 먼저 enumerate하기 때문에 required 순서 활용이 안전.
 */
const orderedPropertyKeys = (schema: JsonSchema): string[] => {
  if (!schema.properties) return [];
  const propKeys = Object.keys(schema.properties);
  const required = schema.required ?? [];
  const requiredOrdered = required.filter((k) => k in schema.properties!);
  const seen = new Set(requiredOrdered);
  const extras = propKeys.filter((k) => !seen.has(k));
  return [...requiredOrdered, ...extras];
};

interface BuildOpts {
  root: JsonSchema;
  parentPath: string;
  isRequired: boolean;
}

const buildNode = (
  key: string,
  rawSchema: JsonSchema,
  opts: BuildOpts
): FormNode => {
  const { root, parentPath, isRequired } = opts;
  const resolved = resolveSchema(rawSchema, root);
  const path = parentPath ? `${parentPath}.${key}` : key;
  const label = prettifyLabel(key);

  const t = primaryType(resolved.type);

  // object → section
  if (t === 'object' && resolved.properties) {
    const requiredKeys = new Set(resolved.required ?? []);
    const keys = orderedPropertyKeys(resolved);
    const children: FormNode[] = keys.map((childKey) =>
      buildNode(childKey, resolved.properties![childKey], {
        root,
        parentPath: path,
        isRequired: requiredKeys.has(childKey),
      })
    );
    return {
      kind: 'section',
      key,
      label,
      path,
      required: isRequired,
      description: resolved.description,
      children,
    };
  }

  // leaf
  return {
    kind: 'leaf',
    key,
    label,
    path,
    required: isRequired,
    description: resolved.description,
    inputType: detectInputType(key, resolved),
    options: resolved.enum,
    pattern: resolved.pattern,
    constValue: resolved.const,
  };
};

export const schemaToFields = (schema: JsonSchema): FormNode[] => {
  if (!schema.properties) return [];
  const requiredKeys = new Set(schema.required ?? []);
  const keys = orderedPropertyKeys(schema);
  return keys.map((key) =>
    buildNode(key, schema.properties![key], {
      root: schema,
      parentPath: '',
      isRequired: requiredKeys.has(key),
    })
  );
};

export const collectLeaves = (nodes: FormNode[]): FormLeaf[] => {
  const out: FormLeaf[] = [];
  const walk = (n: FormNode) => {
    if (n.kind === 'leaf') {
      if (n.constValue === undefined) out.push(n);
      return;
    }
    n.children.forEach(walk);
  };
  nodes.forEach(walk);
  return out;
};

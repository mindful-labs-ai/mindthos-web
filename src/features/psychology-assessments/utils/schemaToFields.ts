import type { JsonSchema } from '../schemas/jsonSchema.types';

import { formatAssessmentSchemaLabel } from './assessmentDisplay';
import { resolveSchema } from './schemaResolver';

/**
 * 경로 구분자. '.'을 쓰면 MMPI 'Hs(+.5K)'처럼 키 자체에 점이 든 경우 split이 깨져
 * 잘못된 leaf를 누락으로 오판한다. JSON 키에 등장하지 않는 제어문자(U+001F)를 쓴다.
 * 경로 문자열은 폼 내부에서만 쓰이는 불투명 식별자라 표시에는 영향 없다.
 */
export const PATH_SEP = '\u001f';

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

const prettifyLabel = (key: string): string =>
  formatAssessmentSchemaLabel(key).replace(/_/g, ' ').trim();

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
  const path = parentPath ? `${parentPath}${PATH_SEP}${key}` : key;
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

/**
 * "스키마 라벨" 단위 = 카운팅 단위.
 *
 * - 최상위 섹션의 직속 leaf (e.g. 수검자정보.이름) → 1 unit
 * - 중첩 섹션 (e.g. 타당도척도_및_임상척도.VRIN) → 1 unit
 *   (자식 leaves 전부 채워져야 unit 채움)
 * - depth 0 섹션 자체는 unit 아님 (카드 헤더 역할)
 *
 * 즉, FieldLabel이 화면에 그려지는 단위와 1:1 대응.
 */
export interface FormUnit {
  /** unit 경로 (leaf path 또는 중첩 section path) */
  path: string;
  /** 표시용 라벨 */
  label: string;
  /** 이 unit에 속한 입력 가능 leaf path들 (채워짐 검증용). 단독 leaf면 1개, section unit이면 다수 */
  leafPaths: string[];
}

const collectLeafPathsIn = (node: FormNode): string[] => {
  const out: string[] = [];
  const walk = (n: FormNode) => {
    if (n.kind === 'leaf') {
      if (n.constValue === undefined) out.push(n.path);
      return;
    }
    n.children.forEach(walk);
  };
  walk(node);
  return out;
};

export const collectUnits = (nodes: FormNode[]): FormUnit[] => {
  const units: FormUnit[] = [];

  const walk = (n: FormNode, depth: number) => {
    if (n.kind === 'leaf') {
      if (n.constValue === undefined) {
        units.push({
          path: n.path,
          label: n.label,
          leafPaths: [n.path],
        });
      }
      return;
    }

    // section
    if (depth === 0) {
      // 최상위 섹션은 그룹 헤더 — 자식들이 unit
      n.children.forEach((c) => walk(c, depth + 1));
      return;
    }

    // 중첩 섹션 자체가 1 unit (스키마 라벨 1개로 묶임)
    const leafPaths = collectLeafPathsIn(n);
    if (leafPaths.length > 0) {
      units.push({ path: n.path, label: n.label, leafPaths });
    }
  };

  nodes.forEach((n) => walk(n, 0));
  return units;
};

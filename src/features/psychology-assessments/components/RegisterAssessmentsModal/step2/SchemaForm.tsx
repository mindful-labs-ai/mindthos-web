import { useEffect, useMemo, useRef, useState } from 'react';

import { cn } from '@/lib/cn';
import { useDevice } from '@/shared/hooks/useDevice';

import type { JsonSchema } from '../../../schemas/jsonSchema.types';
import {
  collectLeaves,
  schemaToFields,
  type FormLeaf,
  type FormNode,
  type LeafInputType,
} from '../../../utils/schemaToFields';

import {
  FieldChipGroup,
  FieldDescription,
  FieldFilledCheck,
  FieldLabel,
  FieldNumberTags,
  FieldScoreWithDirection,
  FieldSection,
  FieldSeparator,
  FieldTextArea,
  FieldTextInput,
  FIELD_MAX_WIDTH,
} from './fields';
import type { FillingFormCounts } from './forms/types';

interface SchemaFormProps {
  schema: JsonSchema;
  onCountsChange?: (counts: FillingFormCounts) => void;
  /** 입력으로 노출할 leaf 필터. 주어지면 해당 leaf(및 조상)만 렌더 — 누락 필드만 채우기용. */
  visibleLeaf?: (path: string) => boolean;
  /** 현재 입력값(path → 문자열) 통지 — 확정 제출 시 부모가 점수 재구성에 사용. */
  onValuesChange?: (values: Record<string, string>) => void;
  className?: string;
}

/** visibleLeaf 술어로 노드 트리를 가지치기 — 보이는 leaf와 그 조상 섹션만 남긴다. */
const pruneNodes = (
  nodes: FormNode[],
  visible: (path: string) => boolean
): FormNode[] => {
  const out: FormNode[] = [];
  for (const n of nodes) {
    if (n.kind === 'leaf') {
      if (n.constValue === undefined && visible(n.path)) out.push(n);
    } else {
      const children = pruneNodes(n.children, visible);
      if (children.length > 0) out.push({ ...n, children });
    }
  }
  return out;
};

export const SchemaForm = ({
  schema,
  onCountsChange,
  visibleLeaf,
  onValuesChange,
  className,
}: SchemaFormProps) => {
  const allNodes = useMemo(() => schemaToFields(schema), [schema]);
  const nodes = useMemo(
    () => (visibleLeaf ? pruneNodes(allNodes, visibleLeaf) : allNodes),
    [allNodes, visibleLeaf]
  );
  // 카운팅은 leaf(입력칸) 단위 — 검증 요약(누락 leaf 수)과 동일 기준으로 맞춘다.
  // (라벨 단위로 세면 결정적문항처럼 한 라벨에 그렇다/아니다 2칸인 경우 요약 13 vs 폼 10으로
  //  어긋나고, 채워도 완료 카운트가 안 맞는 문제가 생긴다.)
  const leaves = useMemo(() => collectLeaves(nodes), [nodes]);

  const [values, setValues] = useState<Record<string, string>>({});

  const setValue = (path: string, value: string) => {
    setValues((prev) => ({ ...prev, [path]: value }));
  };

  const filled = useMemo(
    () =>
      leaves.filter((leaf) => {
        const v = values[leaf.path];
        return !!v && v.trim() !== '';
      }).length,
    [leaves, values]
  );

  const onCountsChangeRef = useRef(onCountsChange);
  onCountsChangeRef.current = onCountsChange;
  useEffect(() => {
    onCountsChangeRef.current?.({ filled, total: leaves.length });
  }, [filled, leaves.length]);

  const onValuesChangeRef = useRef(onValuesChange);
  useEffect(() => {
    onValuesChangeRef.current = onValuesChange;
  });
  useEffect(() => {
    onValuesChangeRef.current?.(values);
  }, [values]);

  return (
    <div className={cn('flex flex-col gap-6', className)}>
      {nodes.map((node) => (
        <RenderNode
          key={node.path}
          node={node}
          values={values}
          setValue={setValue}
          depth={0}
        />
      ))}
    </div>
  );
};

/* -----------------------------------------------------
 * 내부 렌더링
 * ---------------------------------------------------*/

interface RenderNodeProps {
  node: FormNode;
  values: Record<string, string>;
  setValue: (path: string, value: string) => void;
  depth: number;
}

const RenderNode = ({ node, values, setValue, depth }: RenderNodeProps) => {
  if (node.kind === 'section') {
    return (
      <RenderSection
        node={node}
        values={values}
        setValue={setValue}
        depth={depth}
      />
    );
  }
  return <RenderLeaf leaf={node} values={values} setValue={setValue} />;
};

const RenderSection = ({
  node,
  values,
  setValue,
  depth,
}: {
  node: Extract<FormNode, { kind: 'section' }>;
  values: Record<string, string>;
  setValue: (path: string, value: string) => void;
  depth: number;
}) => {
  if (depth === 0) {
    return (
      <FieldSection label={node.label}>
        {node.description && (
          <FieldDescription>{node.description}</FieldDescription>
        )}
        {node.children.map((child, idx) => (
          <div key={child.path}>
            {idx > 0 && child.kind === 'section' && (
              <FieldSeparator className="my-2" />
            )}
            <RenderNode
              node={child}
              values={values}
              setValue={setValue}
              depth={depth + 1}
            />
          </div>
        ))}
      </FieldSection>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <FieldLabel>{node.label}</FieldLabel>
      {node.description && (
        <FieldDescription>{node.description}</FieldDescription>
      )}
      <div className="flex flex-col gap-3">
        {node.children.map((child) => (
          <RenderNode
            key={child.path}
            node={child}
            values={values}
            setValue={setValue}
            depth={depth + 1}
          />
        ))}
      </div>
    </div>
  );
};

const RenderLeaf = ({
  leaf,
  values,
  setValue,
}: {
  leaf: FormLeaf;
  values: Record<string, string>;
  setValue: (path: string, value: string) => void;
}) => {
  const value = values[leaf.path] ?? '';
  const isFilled = value.trim() !== '';

  // const는 정의된 라벨만 표시 (입력 불가)
  if (leaf.constValue !== undefined) {
    return (
      <div className="flex flex-col gap-1">
        <FieldLabel>{leaf.label}</FieldLabel>
        <p className="text-xs font-medium text-grey-60">
          {JSON.stringify(leaf.constValue)}
        </p>
      </div>
    );
  }

  // enum → FieldChipGroup
  if (leaf.inputType === 'enum' && leaf.options) {
    return (
      <div className="flex flex-col gap-1.5">
        <FieldLabel>{leaf.label}</FieldLabel>
        {leaf.description && (
          <FieldDescription>{leaf.description}</FieldDescription>
        )}
        <div className="flex items-center gap-2">
          <FieldChipGroup
            options={leaf.options.map((opt) => ({
              value: String(opt),
              label: String(opt),
            }))}
            value={value || null}
            onChange={(v) => setValue(leaf.path, v)}
          />
          <FieldFilledCheck filled={isFilled} />
        </div>
      </div>
    );
  }

  // array-of-numbers (결정적문항 등 문항번호 목록) → 번호 칩 입력
  if (leaf.inputType === 'array-of-numbers') {
    return (
      <div className="flex flex-col gap-1.5">
        <FieldLabel>{leaf.label}</FieldLabel>
        {leaf.description && (
          <FieldDescription>{leaf.description}</FieldDescription>
        )}
        <div className="flex items-start gap-2">
          <FieldNumberTags
            value={value}
            onChange={(v) => setValue(leaf.path, v)}
          />
          <FieldFilledCheck filled={isFilled} className="mt-2" />
        </div>
      </div>
    );
  }

  // union (TRIN T점수 등) → 점수 칸 + 방향(평형/T/F) 칩
  if (leaf.inputType === 'union') {
    return (
      <div className="flex flex-col gap-1.5">
        <FieldLabel>{leaf.label}</FieldLabel>
        {leaf.description && (
          <FieldDescription>{leaf.description}</FieldDescription>
        )}
        <div className="flex items-center gap-2">
          <FieldScoreWithDirection
            value={value}
            onChange={(v) => setValue(leaf.path, v)}
          />
          <FieldFilledCheck filled={isFilled} />
        </div>
      </div>
    );
  }

  // textarea (자유 응답/해석요약)
  if (leaf.inputType === 'textarea') {
    return (
      <div className="flex flex-col gap-1.5">
        <FieldLabel>{leaf.label}</FieldLabel>
        {leaf.description && (
          <FieldDescription>{leaf.description}</FieldDescription>
        )}
        <div className="flex items-start gap-2">
          <FieldTextArea
            value={value}
            onChange={(e) => setValue(leaf.path, e.target.value)}
            placeholder="내용을 입력해주세요."
            rows={3}
          />
          <FieldFilledCheck filled={isFilled} className="mt-2" />
        </div>
      </div>
    );
  }

  // 일반 input (text/number/date/percent) — width 매핑 + 우측 체크
  return (
    <div className="flex flex-col gap-1.5">
      <FieldLabel>{leaf.label}</FieldLabel>
      {leaf.description && (
        <FieldDescription>{leaf.description}</FieldDescription>
      )}
      <div className="flex items-center gap-2">
        <SingleLineFieldInput
          leaf={leaf}
          value={value}
          onChange={(v) => setValue(leaf.path, v)}
        />
        <FieldFilledCheck filled={isFilled} />
      </div>
    </div>
  );
};

const SingleLineFieldInput = ({
  leaf,
  value,
  onChange,
}: {
  leaf: FormLeaf;
  value: string;
  onChange: (v: string) => void;
}) => {
  const { isMobile, isTablet } = useDevice();
  const isMobileView = isMobile || isTablet;
  // 모바일은 부모 폭 100% (text 240px 같은 데스크탑 width 제한 해제)
  const desktopMaxWidth = FIELD_MAX_WIDTH[leaf.inputType];
  const maxWidth = isMobileView ? undefined : desktopMaxWidth;

  const placeholder = placeholderFor(leaf);
  const inputMode = ['number', 'percent', 'date'].includes(leaf.inputType)
    ? 'numeric'
    : undefined;

  return (
    <FieldTextInput
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      inputMode={inputMode}
      style={maxWidth ? { maxWidth, width: '100%' } : undefined}
    />
  );
};

const placeholderFor = (leaf: FormLeaf): string => {
  switch (leaf.inputType) {
    case 'date':
      return 'YYYY-MM-DD';
    case 'percent':
      return '0%';
    case 'number':
      return '0';
    default:
      return '내용을 입력해주세요.';
  }
};

// (사용처에서 import할 때를 위한 re-export)
export type { LeafInputType };

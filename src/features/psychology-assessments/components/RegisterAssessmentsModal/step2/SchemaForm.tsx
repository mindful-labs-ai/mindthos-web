import { useEffect, useMemo, useRef, useState } from 'react';

import { cn } from '@/lib/cn';

import type { JsonSchema } from '../../../schemas/jsonSchema.types';
import {
  collectLeaves,
  schemaToFields,
  type FormLeaf,
  type FormNode,
  type LeafInputType,
} from '../../../utils/schemaToFields';
import type { FillingFormCounts } from './forms/types';
import {
  FieldChipGroup,
  FieldDescription,
  FieldFilledCheck,
  FieldLabel,
  FieldSection,
  FieldSeparator,
  FieldTextArea,
  FieldTextInput,
  FIELD_MAX_WIDTH,
} from './fields';

interface SchemaFormProps {
  schema: JsonSchema;
  onCountsChange?: (counts: FillingFormCounts) => void;
  className?: string;
}

export const SchemaForm = ({
  schema,
  onCountsChange,
  className,
}: SchemaFormProps) => {
  const nodes = useMemo(() => schemaToFields(schema), [schema]);
  const leaves = useMemo(() => collectLeaves(nodes), [nodes]);

  const [values, setValues] = useState<Record<string, string>>({});

  const setValue = (path: string, value: string) => {
    setValues((prev) => ({ ...prev, [path]: value }));
  };

  const filled = useMemo(() => {
    return leaves.reduce((acc, leaf) => {
      const v = values[leaf.path];
      return acc + (v && v.trim() !== '' ? 1 : 0);
    }, 0);
  }, [leaves, values]);

  const onCountsChangeRef = useRef(onCountsChange);
  onCountsChangeRef.current = onCountsChange;
  useEffect(() => {
    onCountsChangeRef.current?.({ filled, total: leaves.length });
  }, [filled, leaves.length]);

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
        {node.description && <FieldDescription>{node.description}</FieldDescription>}
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
      {node.description && <FieldDescription>{node.description}</FieldDescription>}
      <div className="flex flex-col gap-3 border-l border-grey-30 pl-3">
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
        {leaf.description && <FieldDescription>{leaf.description}</FieldDescription>}
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

  // textarea (자유 응답/해석요약)
  if (leaf.inputType === 'textarea') {
    return (
      <div className="flex flex-col gap-1.5">
        <FieldLabel>{leaf.label}</FieldLabel>
        {leaf.description && <FieldDescription>{leaf.description}</FieldDescription>}
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

  // 일반 input (text/number/date/percent/array/union) — width 매핑 + 우측 체크
  return (
    <div className="flex flex-col gap-1.5">
      <FieldLabel>{leaf.label}</FieldLabel>
      {leaf.description && <FieldDescription>{leaf.description}</FieldDescription>}
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
  const maxWidth = FIELD_MAX_WIDTH[leaf.inputType];
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
      return 'YYYYMMDD';
    case 'percent':
      return '예: 50%';
    case 'number':
      return '0';
    case 'array-of-numbers':
      return '예: 1, 4, 7';
    case 'union':
      return '예: 65T / 70F';
    default:
      return '내용을 입력해주세요.';
  }
};

// (사용처에서 import할 때를 위한 re-export)
export type { LeafInputType };

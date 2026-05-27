import tciSchema from '../../../../schemas/tci.schema.json';
import type { JsonSchema } from '../../../../schemas/jsonSchema.types';

import { SchemaForm } from '../SchemaForm';

import type { FillingFormCounts } from './types';

interface TciFillingFormProps {
  onCountsChange?: (counts: FillingFormCounts) => void;
  visibleLeaf?: (path: string) => boolean;
  onValuesChange?: (values: Record<string, string>) => void;
}

/** 기질 검사 (TCI-RS) 폼 — schema 기반 동적 렌더링 */
export const TciFillingForm = ({
  onCountsChange,
  visibleLeaf,
  onValuesChange,
}: TciFillingFormProps) => {
  return (
    <SchemaForm
      schema={tciSchema as JsonSchema}
      onCountsChange={onCountsChange}
      visibleLeaf={visibleLeaf}
      onValuesChange={onValuesChange}
    />
  );
};

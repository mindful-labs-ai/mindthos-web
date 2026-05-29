import type { JsonSchema } from '../../../../schemas/jsonSchema.types';
import mmpiSchema from '../../../../schemas/mmpi.schema.json';
import { SchemaForm } from '../SchemaForm';

import type { FillingFormCounts } from './types';

interface MmpiFillingFormProps {
  onCountsChange?: (counts: FillingFormCounts) => void;
  visibleLeaf?: (path: string) => boolean;
  onValuesChange?: (values: Record<string, string>) => void;
}

/** 다면적 인성 검사 (MMPI-2) 폼 — schema 기반 동적 렌더링 */
export const MmpiFillingForm = ({
  onCountsChange,
  visibleLeaf,
  onValuesChange,
}: MmpiFillingFormProps) => {
  return (
    <SchemaForm
      schema={mmpiSchema as JsonSchema}
      onCountsChange={onCountsChange}
      visibleLeaf={visibleLeaf}
      onValuesChange={onValuesChange}
    />
  );
};

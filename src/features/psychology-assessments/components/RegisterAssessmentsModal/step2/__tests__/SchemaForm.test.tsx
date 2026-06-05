import { render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import type { JsonSchema } from '../../../../schemas/jsonSchema.types';
import mmpiSchema from '../../../../schemas/mmpi.schema.json';
import { getSchemaReviewStats } from '../../../../utils/schemaReview';
import { SchemaForm } from '../SchemaForm';

describe('SchemaForm missing section expansion', () => {
  it('expands a missing object section into its labeled child fields', async () => {
    const handleCounts = vi.fn();
    const stats = getSchemaReviewStats(mmpiSchema as JsonSchema, {
      타당도척도_및_임상척도: null,
    });

    render(
      <SchemaForm
        schema={mmpiSchema as JsonSchema}
        visibleLeaf={(path) => stats.missingPaths.has(path)}
        onCountsChange={handleCounts}
      />
    );

    expect(screen.getByText('타당도척도 및 임상척도')).toBeInTheDocument();
    expect(screen.getByText('VRIN')).toBeInTheDocument();
    expect(screen.getByText('TRIN')).toBeInTheDocument();

    await waitFor(() => {
      const lastCall = handleCounts.mock.calls.at(-1)?.[0];
      expect(lastCall).toEqual({ filled: 0, total: stats.missing });
      expect(stats.missing).toBeGreaterThan(1);
    });
  });
});

import { describe, expect, it } from 'vitest';

import type { JsonSchema } from '../../schemas/jsonSchema.types';
import mmpiSchema from '../../schemas/mmpi.schema.json';
import {
  applyMissingSchemaConstants,
  getSchemaReviewStats,
  projectScoreToSchema,
} from '../schemaReview';
import { PATH_SEP } from '../schemaToFields';

const smallSchema: JsonSchema = {
  type: 'object',
  required: ['이름', '척도'],
  properties: {
    이름: { type: 'string' },
    척도: {
      type: 'object',
      required: ['A', 'B'],
      properties: {
        A: { type: 'number' },
        B: {
          type: 'object',
          required: ['원점수', 'T점수', '라벨'],
          properties: {
            원점수: { type: 'number' },
            T점수: { type: 'number' },
            라벨: { const: '고정값' },
          },
        },
      },
    },
  },
};

describe('getSchemaReviewStats', () => {
  it('expands an explicit object null into every schema leaf below it', () => {
    const stats = getSchemaReviewStats(smallSchema, {
      이름: '홍길동',
      척도: null,
    });

    expect(stats.verified).toBe(1);
    expect(stats.missing).toBe(3);
    expect(stats.total).toBe(4);
    expect(stats.missingPaths).toEqual(
      new Set([
        `척도${PATH_SEP}A`,
        `척도${PATH_SEP}B${PATH_SEP}원점수`,
        `척도${PATH_SEP}B${PATH_SEP}T점수`,
      ])
    );
    expect(stats.unmappedMissingPaths).toEqual([]);
  });

  it('does not treat schema paths absent from the OCR response as missing', () => {
    const stats = getSchemaReviewStats(smallSchema, {
      척도: { A: null },
    });

    expect(stats.verified).toBe(0);
    expect(stats.missing).toBe(1);
    expect(stats.total).toBe(1);
  });

  it('reports null paths that the supported schema cannot map', () => {
    const stats = getSchemaReviewStats(smallSchema, {
      이름: '홍길동',
      지원하지_않는_항목: null,
    });

    expect(stats.missing).toBe(0);
    expect(stats.unmappedMissingPaths).toEqual(['지원하지_않는_항목']);
  });

  it('keeps fillable schema fields when an unsupported null field is also present', () => {
    const stats = getSchemaReviewStats(smallSchema, {
      척도: { A: null },
      지원하지_않는_항목: null,
    });

    expect(stats.missing).toBe(1);
    expect(stats.unmappedMissingPaths).toEqual(['지원하지_않는_항목']);
  });

  it('restores schema constants only below explicit null paths', () => {
    expect(
      applyMissingSchemaConstants(smallSchema, {
        이름: '홍길동',
        척도: null,
      })
    ).toEqual({
      이름: '홍길동',
      척도: {
        B: {
          라벨: '고정값',
        },
      },
    });
    expect(applyMissingSchemaConstants(smallSchema, {})).toEqual({});
  });

  it('removes unsupported OCR fields before confirmation', () => {
    expect(
      projectScoreToSchema(smallSchema, {
        이름: '홍길동',
        척도: {
          A: 10,
          B: {
            원점수: 20,
            T점수: 30,
            라벨: '고정값',
            스키마밖값: 40,
          },
        },
        지원하지_않는_항목: null,
      })
    ).toEqual({
      이름: '홍길동',
      척도: {
        A: 10,
        B: {
          원점수: 20,
          T점수: 30,
          라벨: '고정값',
        },
      },
    });
  });

  it('expands an MMPI category null without requesting the entire absent schema', () => {
    const stats = getSchemaReviewStats(mmpiSchema as JsonSchema, {
      타당도척도_및_임상척도: null,
    });

    expect(stats.missing).toBeGreaterThan(1);
    expect(stats.missing).toBeLessThan(476);
    expect(stats.total).toBe(stats.missing);
    expect(stats.unmappedMissingPaths).toEqual([]);
  });
});

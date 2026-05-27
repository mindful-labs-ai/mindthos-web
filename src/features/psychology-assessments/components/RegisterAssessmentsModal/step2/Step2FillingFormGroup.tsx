import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { MissingFieldsForm } from './MissingFieldsForm';
import {
  MmpiFillingForm,
  TciFillingForm,
  type FillingFormCounts,
} from './forms';

export interface FillingFormDescriptor {
  /** 검사 카테고리 라벨 */
  categoryLabel: string;
  /** 누락된 항목 수 — 폼 진입 직전 초기값 (실시간으로는 폼 내부 카운트로 덮어씀) */
  missingCount: number;
  /** 검사 종류 키 — 어떤 폼을 렌더할지 결정 */
  formKey: 'mmpi' | 'tci';
  /** (실데이터) 입력 노출할 leaf 필터 — 주어지면 누락 필드만 렌더. */
  visibleLeaf?: (path: string) => boolean;
  /** (실데이터) 입력값(path → 문자열) 통지 — 확정 제출용. */
  onValuesChange?: (values: Record<string, string>) => void;
}

interface Step2FillingFormGroupProps {
  forms: FillingFormDescriptor[];
  /** 모든 카드 합산 카운트 — summary bar 갱신용 */
  onCountsChange?: (counts: FillingFormCounts) => void;
  className?: string;
}

/** Step 2 filling 모드 — 검사별 누락 항목 채우기 카드 그룹 + 카운트 집계 */
export const Step2FillingFormGroup = ({
  forms,
  onCountsChange,
  className,
}: Step2FillingFormGroupProps) => {
  // 인덱스별 카운트 저장
  const [perFormCounts, setPerFormCounts] = useState<
    Record<number, FillingFormCounts>
  >({});

  const setFormCounts = useCallback(
    (idx: number, counts: FillingFormCounts) => {
      setPerFormCounts((prev) => {
        const cur = prev[idx];
        // 동일 값이면 setState 스킵 (무한 루프 방지)
        if (cur && cur.filled === counts.filled && cur.total === counts.total) {
          return prev;
        }
        return { ...prev, [idx]: counts };
      });
    },
    []
  );

  // 합산 카운트 → 부모로 통지 (ref 패턴으로 콜백 안정성 보장)
  const aggregated = useMemo(() => {
    let filled = 0;
    let total = 0;
    Object.values(perFormCounts).forEach((c) => {
      filled += c.filled;
      total += c.total;
    });
    return { filled, total };
  }, [perFormCounts]);

  const onCountsChangeRef = useRef(onCountsChange);
  onCountsChangeRef.current = onCountsChange;
  useEffect(() => {
    onCountsChangeRef.current?.(aggregated);
  }, [aggregated]);

  const renderFormByKey = (
    form: FillingFormDescriptor,
    handle: (counts: FillingFormCounts) => void
  ) => {
    const shared = {
      onCountsChange: handle,
      visibleLeaf: form.visibleLeaf,
      onValuesChange: form.onValuesChange,
    };
    switch (form.formKey) {
      case 'mmpi':
        return <MmpiFillingForm {...shared} />;
      case 'tci':
        return <TciFillingForm {...shared} />;
    }
  };

  return (
    <div className={className}>
      <div className="flex flex-col gap-4">
        {forms.map((form, idx) => {
          const counts = perFormCounts[idx];
          const validated = !!counts && counts.filled >= counts.total;
          const missingCount = counts
            ? Math.max(0, counts.total - counts.filled)
            : form.missingCount;

          // 폼별 callback (inline new instance — 폼 내부 ref 패턴으로 안전)
          const handle = (c: FillingFormCounts) => setFormCounts(idx, c);

          return (
            <MissingFieldsForm
              key={`${form.formKey}-${idx}`}
              categoryLabel={form.categoryLabel}
              missingCount={missingCount}
              validated={validated}
            >
              {renderFormByKey(form, handle)}
            </MissingFieldsForm>
          );
        })}
      </div>
    </div>
  );
};

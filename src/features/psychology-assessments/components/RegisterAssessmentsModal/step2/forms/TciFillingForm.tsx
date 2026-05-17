import { useEffect, useMemo, useRef, useState } from 'react';

import {
  FieldChipGroup,
  FieldColumnInput,
  FieldRow,
  FieldSection,
} from '../fields';

import type { FillingFormCounts } from './types';

const NORM_GROUP_OPTIONS = [
  { value: 'general_adult', label: '일반성인' },
  { value: 'college', label: '대학생' },
  { value: 'youth', label: '청소년' },
  { value: 'general_senior', label: '일반노인' },
];

const TOTAL_FIELDS = 3;

interface TciFillingFormProps {
  onCountsChange?: (counts: FillingFormCounts) => void;
}

export const TciFillingForm = ({ onCountsChange }: TciFillingFormProps) => {
  const [normGroup, setNormGroup] = useState<string | null>(null);
  const [ns1NormMean, setNs1NormMean] = useState('');
  const [ns1NormStd, setNs1NormStd] = useState('');

  const filled = useMemo(() => {
    let c = 0;
    if (normGroup) c++;
    if (ns1NormMean.trim()) c++;
    if (ns1NormStd.trim()) c++;
    return c;
  }, [normGroup, ns1NormMean, ns1NormStd]);

  const onCountsChangeRef = useRef(onCountsChange);
  onCountsChangeRef.current = onCountsChange;
  useEffect(() => {
    onCountsChangeRef.current?.({ filled, total: TOTAL_FIELDS });
  }, [filled]);

  return (
    <div className="flex flex-col gap-6 py-4">
      <FieldSection label="프로파일-하위척도">
        <FieldRow label="규준집단">
          <FieldChipGroup
            options={NORM_GROUP_OPTIONS}
            value={normGroup}
            onChange={setNormGroup}
          />
        </FieldRow>

        <FieldRow label="NS1 | 탐색적 흥분-규준 기술통계">
          <div className="grid grid-cols-2 gap-3">
            <FieldColumnInput
              label="규준 평균"
              value={ns1NormMean}
              onChange={setNs1NormMean}
            />
            <FieldColumnInput
              label="규준 평균편차"
              value={ns1NormStd}
              onChange={setNs1NormStd}
            />
          </div>
        </FieldRow>
      </FieldSection>
    </div>
  );
};

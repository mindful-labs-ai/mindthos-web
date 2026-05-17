import { useEffect, useMemo, useRef, useState } from 'react';

import {
  FieldDescription,
  FieldLabel,
  FieldRow,
  FieldSection,
  FieldSeparator,
  FieldTextArea,
} from '../fields';

import type { FillingFormCounts } from './types';

const TOTAL_FIELDS = 2;

interface SctFillingFormProps {
  onCountsChange?: (counts: FillingFormCounts) => void;
}

export const SctFillingForm = ({ onCountsChange }: SctFillingFormProps) => {
  const [item14, setItem14] = useState('');
  const [emotionalAdjustment, setEmotionalAdjustment] = useState('');

  const filled = useMemo(() => {
    let c = 0;
    if (item14.trim()) c++;
    if (emotionalAdjustment.trim()) c++;
    return c;
  }, [item14, emotionalAdjustment]);

  const onCountsChangeRef = useRef(onCountsChange);
  onCountsChangeRef.current = onCountsChange;
  useEffect(() => {
    onCountsChangeRef.current?.({ filled, total: TOTAL_FIELDS });
  }, [filled]);

  return (
    <div className="flex flex-col gap-6 py-4">
      <FieldSection label="응답-평정">
        <div className="flex flex-col gap-1.5">
          <FieldLabel>문항 14</FieldLabel>
          <FieldDescription>
            제시문구 : “무슨 일을 해서라도 잊고 싶은 것은 ...”
          </FieldDescription>
          <FieldTextArea
            placeholder="수검자가 작성한 응답을 입력하세요."
            value={item14}
            onChange={(e) => setItem14(e.target.value)}
            rows={3}
          />
        </div>
      </FieldSection>

      <FieldSeparator />

      <FieldSection label="성격 구조">
        <FieldRow label="정서적 적응">
          <FieldTextArea
            placeholder="내용을 입력해주세요."
            value={emotionalAdjustment}
            onChange={(e) => setEmotionalAdjustment(e.target.value)}
            rows={3}
          />
        </FieldRow>
      </FieldSection>
    </div>
  );
};

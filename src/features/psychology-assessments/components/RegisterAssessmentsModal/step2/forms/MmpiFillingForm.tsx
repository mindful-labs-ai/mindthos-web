import { useEffect, useMemo, useRef, useState } from 'react';

import {
  FieldCheckbox,
  FieldChipGroup,
  FieldColumnInput,
  FieldRow,
  FieldSection,
  FieldSeparator,
  FieldTextInput,
} from '../fields';

import type { FillingFormCounts } from './types';

const GENDER_OPTIONS = [
  { value: 'male', label: '남성' },
  { value: 'female', label: '여자' },
];

const TRIN_DIRECTION_OPTIONS = [
  { value: 'balanced', label: '평형' },
  { value: 't', label: 'T쪽' },
  { value: 'f', label: 'F쪽' },
];

const TOTAL_FIELDS = 12;

interface MmpiFillingFormProps {
  onCountsChange?: (counts: FillingFormCounts) => void;
}

export const MmpiFillingForm = ({ onCountsChange }: MmpiFillingFormProps) => {
  // 수검자 정보
  const [name, setName] = useState('');
  const [testDate, setTestDate] = useState('');
  const [gender, setGender] = useState<string | null>(null);
  const [affiliation, setAffiliation] = useState('');
  const [noAffiliationRecord, setNoAffiliationRecord] = useState(false);

  // 응답 통계
  const [noResponseRaw, setNoResponseRaw] = useState('');
  const [agreeRatio, setAgreeRatio] = useState('');

  // 타당도 척도 - 임상 척도
  const [fpRaw, setFpRaw] = useState('');
  const [fpTotalT, setFpTotalT] = useState('');
  const [fpGenderT, setFpGenderT] = useState('');
  const [hsKCorrected, setHsKCorrected] = useState('');
  const [trinValue, setTrinValue] = useState('');
  const [trinDirection, setTrinDirection] = useState<string | null>(null);

  const filled = useMemo(() => {
    let c = 0;
    if (name.trim()) c++;
    if (testDate.trim()) c++;
    if (gender) c++;
    if (affiliation.trim() || noAffiliationRecord) c++;
    if (noResponseRaw.trim()) c++;
    if (agreeRatio.trim()) c++;
    if (fpRaw.trim()) c++;
    if (fpTotalT.trim()) c++;
    if (fpGenderT.trim()) c++;
    if (hsKCorrected.trim()) c++;
    if (trinValue.trim()) c++;
    if (trinDirection) c++;
    return c;
  }, [
    name,
    testDate,
    gender,
    affiliation,
    noAffiliationRecord,
    noResponseRaw,
    agreeRatio,
    fpRaw,
    fpTotalT,
    fpGenderT,
    hsKCorrected,
    trinValue,
    trinDirection,
  ]);

  // ref 패턴 — onCountsChange가 매 render 새 instance여도 무한 루프 방지
  const onCountsChangeRef = useRef(onCountsChange);
  onCountsChangeRef.current = onCountsChange;
  useEffect(() => {
    onCountsChangeRef.current?.({ filled, total: TOTAL_FIELDS });
  }, [filled]);

  return (
    <div className="flex flex-col gap-6 py-4">
      {/* --- 수검자 정보 --- */}
      <FieldSection label="수검자 정보">
        <FieldRow label="이름">
          <FieldTextInput
            placeholder="내용을 입력해주세요."
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </FieldRow>

        <FieldRow label="검사일">
          <FieldTextInput
            placeholder="YYYY-MM-DD"
            value={testDate}
            onChange={(e) => setTestDate(e.target.value)}
          />
        </FieldRow>

        <FieldRow label="성별">
          <FieldChipGroup
            options={GENDER_OPTIONS}
            value={gender}
            onChange={setGender}
          />
        </FieldRow>

        <FieldRow label="소속 기관">
          <div className="flex flex-col gap-2">
            <FieldTextInput
              placeholder="내용을 입력해주세요."
              value={affiliation}
              onChange={(e) => setAffiliation(e.target.value)}
              disabled={noAffiliationRecord}
            />
            <FieldCheckbox
              label="기록 없음"
              checked={noAffiliationRecord}
              onChange={setNoAffiliationRecord}
            />
          </div>
        </FieldRow>
      </FieldSection>

      <FieldSeparator />

      {/* --- 응답 통계 --- */}
      <FieldSection label="응답 통계">
        <FieldRow label="무응답 원점수">
          <FieldTextInput
            placeholder="0"
            value={noResponseRaw}
            onChange={(e) => setNoResponseRaw(e.target.value)}
          />
        </FieldRow>

        <FieldRow label="'그렇다' 응답비율">
          <div className="flex items-center gap-2">
            <FieldTextInput
              placeholder="0"
              value={agreeRatio}
              onChange={(e) => setAgreeRatio(e.target.value)}
            />
            <span className="text-sm font-medium text-grey-80">%</span>
          </div>
        </FieldRow>
      </FieldSection>

      <FieldSeparator />

      {/* --- 타당도 척도 - 임상 척도 --- */}
      <FieldSection label="타당도 척도 - 임상 척도">
        <FieldRow label="F(P) | Infrequency-Psychopathology">
          <div className="grid grid-cols-3 gap-3">
            <FieldColumnInput
              label="원점수"
              value={fpRaw}
              onChange={setFpRaw}
            />
            <FieldColumnInput
              label="전체규준 T"
              value={fpTotalT}
              onChange={setFpTotalT}
            />
            <FieldColumnInput
              label="성별규준 T"
              value={fpGenderT}
              onChange={setFpGenderT}
            />
          </div>
        </FieldRow>

        <FieldRow
          label="Hs (+.5K) | K 교정점수"
          description="결과지 P.2의 K-corr 옆에서 Hs 행 값을 확인하세요."
        >
          <FieldTextInput
            placeholder="0"
            value={hsKCorrected}
            onChange={(e) => setHsKCorrected(e.target.value)}
          />
        </FieldRow>

        <FieldRow
          label="TRIN | 성별규준 T"
          description="평형이면 숫자만, 한쪽으로 치우치면 방향(T/F)을 함께 입력"
        >
          <div className="flex flex-wrap items-center gap-2">
            <FieldTextInput
              placeholder="0"
              value={trinValue}
              onChange={(e) => setTrinValue(e.target.value)}
              className="max-w-[120px]"
            />
            <FieldChipGroup
              options={TRIN_DIRECTION_OPTIONS}
              value={trinDirection}
              onChange={setTrinDirection}
            />
          </div>
        </FieldRow>
      </FieldSection>
    </div>
  );
};

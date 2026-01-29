import React, { useCallback } from 'react';

import { Edit3, X } from 'lucide-react';

import type { Subject } from '@/genogram/core/models/person';
import { SubjectType } from '@/genogram/core/types/enums';

import {
  GENDER_TYPE_ITEMS,
  ILLNESS_ITEMS,
  NODE_SIZE_ITEMS,
} from '../constants/labels';
import { usePropertyPanel } from '../hooks/usePropertyPanel';

import { DateInput } from './common/DateInput';
import { IconDropdown } from './common/IconDropdown';
import { InlineDropdown } from './common/InlineDropdown';
import { GenderIcon } from './icons/GenderIcon';
import { IllnessIcon } from './icons/IllnessIcon';

// ── 메인 컴포넌트 ──

interface GenogramPropertyPanelProps {
  subject: Subject | null;
  onUpdate: (subjectId: string, updates: Partial<Subject>) => void;
  onClose: () => void;
}

export const GenogramPropertyPanel: React.FC<GenogramPropertyPanelProps> = ({
  subject,
  onUpdate,
  onClose,
}) => {
  const {
    isPerson,
    isAnimal,
    attr,
    animalAttr,
    style,
    isEditingName,
    setIsEditingName,
    nameValue,
    setNameValue,
    memoValue,
    nameInputRef,
    updateAttribute,
    updateGenderOrType,
    updateLifeSpan,
    updateDetail,
    updateStyle,
    handleMemoChange,
    commitName,
  } = usePropertyPanel({ subject, onUpdate });

  const renderGenderIcon = useCallback(
    (value: string) => <GenderIcon value={value} />,
    []
  );

  const renderIllnessIcon = useCallback(
    (value: string) => <IllnessIcon value={value} />,
    []
  );

  if (!subject || (!isPerson && !isAnimal)) {
    return null;
  }

  // 드롭다운 현재 값: Person이면 gender, Animal이면 SubjectType.Animal
  const genderDropdownValue = isPerson ? attr!.gender : SubjectType.Animal;

  // 이름/사망 공통
  const displayName = isPerson ? attr!.name : animalAttr?.name;
  const currentIsDead = isPerson ? attr!.isDead : (animalAttr?.isDead ?? false);

  return (
    <div className="absolute right-0 top-0 z-10 h-full w-80 overflow-y-auto border-l border-border bg-white shadow-lg">
      {/* 헤더: 이름 */}
      <div className="flex items-center justify-between px-5 pt-5">
        {isEditingName ? (
          <input
            ref={nameInputRef}
            type="text"
            value={nameValue}
            onChange={(e) => setNameValue(e.target.value)}
            onBlur={commitName}
            onKeyDown={(e) => {
              if (e.key === 'Enter') commitName();
              if (e.key === 'Escape') {
                setNameValue(displayName ?? '');
                setIsEditingName(false);
              }
            }}
            className="h-8 flex-1 rounded-md border-2 border-border bg-surface px-3 text-lg font-bold outline-none transition-colors"
          />
        ) : (
          <button
            type="button"
            className="flex items-center gap-2 text-lg font-bold text-fg"
            onClick={() => setIsEditingName(true)}
          >
            {displayName || '이름 없음'}
            <Edit3 size={16} className="text-fg-muted" />
          </button>
        )}
        <button
          type="button"
          className="inline-flex h-8 items-center justify-center rounded-md px-2 text-fg transition-colors hover:bg-surface-contrast"
          onClick={onClose}
        >
          <X size={16} />
        </button>
      </div>

      <hr className="mx-5 mt-3 border-border" />

      <div className="flex flex-col gap-5 px-5 py-5">
        {/* 성별 / 타입 */}
        <section>
          <h3 className="mb-2 text-base font-medium text-fg">성별</h3>
          <IconDropdown
            items={GENDER_TYPE_ITEMS}
            value={genderDropdownValue}
            onChange={(value) => updateGenderOrType(value)}
            renderIcon={renderGenderIcon}
            className="w-full"
          />
        </section>

        {/* 사망 여부 (공통) */}
        <div className="flex items-center justify-between">
          <span className="text-base font-medium text-fg">사망 여부</span>
          <input
            type="checkbox"
            checked={currentIsDead}
            onChange={(e) => updateAttribute('isDead', e.target.checked)}
            className="relative h-6 w-6 cursor-pointer appearance-none rounded-sm border-2 border-border bg-surface after:absolute after:left-1/2 after:top-1/2 after:-translate-x-1/2 after:-translate-y-1/2 after:text-base after:font-black after:text-white after:opacity-0 after:content-['✓'] checked:border-fg checked:bg-fg checked:after:opacity-100"
          />
        </div>

        {/* Person 전용 필드 */}
        {isPerson && attr && (
          <>
            {/* 출생일 */}
            <div className="flex items-center justify-between">
              <span className="text-base font-medium text-fg">출생일</span>
              <DateInput
                key={`birth-${subject.id}-${attr.lifeSpan.birth}`}
                value={attr.lifeSpan.birth}
                onChange={(value) => updateLifeSpan('birth', value)}
              />
            </div>

            {/* 사망일 — 사망 여부 체크 시에만 표시 */}
            {currentIsDead && (
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-fg">사망일</span>
                <DateInput
                  key={`death-${subject.id}-${attr.lifeSpan.death}`}
                  value={attr.lifeSpan.death}
                  onChange={(value) => updateLifeSpan('death', value)}
                />
              </div>
            )}

            {/* 나이 */}
            <div className="flex items-center justify-between">
              <span className="text-base font-medium text-fg">나이</span>
              <div className="flex items-center gap-1">
                <span className="text-sm text-fg-muted">만</span>
                <input
                  type="number"
                  inputMode="numeric"
                  value={attr.age ?? ''}
                  min={0}
                  max={999}
                  onKeyDown={(e) => {
                    // 허용 키 (편집/이동/삭제)
                    const allowed = [
                      'Backspace',
                      'Delete',
                      'Tab',
                      'ArrowLeft',
                      'ArrowRight',
                      'Home',
                      'End',
                    ];
                    if (allowed.includes(e.key)) return;

                    // 숫자만 허용
                    if (!/^\d$/.test(e.key)) {
                      e.preventDefault();
                      return;
                    }

                    // 현재 선택된 범위를 고려해서 "입력 후" 길이가 3을 넘으면 막기
                    const input = e.currentTarget;
                    const start = input.selectionStart ?? input.value.length;
                    const end = input.selectionEnd ?? input.value.length;
                    const next =
                      input.value.slice(0, start) +
                      e.key +
                      input.value.slice(end);

                    // leading zero가 있어도 일단 길이 기준으로 3자리 제한
                    if (
                      next.replace(/^0+(?=\d)/, '').length > 3 &&
                      next.length > 3
                    ) {
                      e.preventDefault();
                    } else if (next.length > 3) {
                      e.preventDefault();
                    }
                  }}
                  onChange={(e) => {
                    const raw = e.target.value;

                    // 빈 값 허용
                    if (!raw) {
                      updateAttribute('age', null);
                      return;
                    }

                    // 숫자만 남기고 3자리로 자르기 (붙여넣기 대비)
                    const digits = raw.replace(/\D/g, '').slice(0, 3);
                    const n = Number(digits);

                    // 0~999 범위로 클램프
                    const clamped = Math.max(0, Math.min(999, n));

                    updateAttribute(
                      'age',
                      Number.isNaN(clamped) ? null : clamped
                    );
                  }}
                  className="h-8 w-16 rounded-md border-2 border-border bg-surface px-3 text-right text-sm outline-none transition-colors [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                />
                <span className="text-sm text-fg-muted">세</span>
              </div>
            </div>

            {/* 임상적 상태 */}
            <section>
              <h3 className="mb-2 text-base font-medium text-fg">
                임상적 상태
              </h3>
              <IconDropdown
                items={ILLNESS_ITEMS}
                value={attr.illness}
                onChange={(value) => updateAttribute('illness', value)}
                renderIcon={renderIllnessIcon}
              />
            </section>

            {/* 인적 사항 정보 */}
            <div>
              <div className="mb-2 flex items-center justify-between">
                <span className="text-base font-medium text-fg">인적 사항</span>
                <input
                  type="checkbox"
                  checked={attr.detail.enable}
                  onChange={(e) => updateDetail('enable', e.target.checked)}
                  className="relative h-6 w-6 cursor-pointer appearance-none rounded-sm border-2 border-border bg-surface after:absolute after:left-1/2 after:top-1/2 after:-translate-x-1/2 after:-translate-y-1/2 after:text-base after:font-black after:text-white after:opacity-0 after:content-['✓'] checked:border-fg checked:bg-fg checked:after:opacity-100"
                />
              </div>
              {attr.detail.enable && (
                <div className="flex flex-col gap-3">
                  <div>
                    <label
                      className="mb-1 block text-xs text-fg-muted"
                      htmlFor="job"
                    >
                      직업
                    </label>
                    <input
                      id="job"
                      type="text"
                      value={attr.detail.job ?? ''}
                      onChange={(e) =>
                        updateDetail('job', e.target.value || null)
                      }
                      placeholder="메모를 추가하세요."
                      className="h-10 w-full rounded-md border-2 border-border bg-surface px-4 text-sm outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring"
                    />
                  </div>
                  <div>
                    <label
                      className="mb-1 block text-xs text-fg-muted"
                      htmlFor="education"
                    >
                      학력
                    </label>
                    <input
                      id="education"
                      type="text"
                      value={attr.detail.education ?? ''}
                      onChange={(e) =>
                        updateDetail('education', e.target.value || null)
                      }
                      placeholder="메모를 추가하세요."
                      className="h-10 w-full rounded-md border-2 border-border bg-surface px-4 text-sm outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring"
                    />
                  </div>
                  <div>
                    <label
                      className="mb-1 block text-xs text-fg-muted"
                      htmlFor="region"
                    >
                      지역
                    </label>
                    <input
                      id="region"
                      type="text"
                      value={attr.detail.region ?? ''}
                      onChange={(e) =>
                        updateDetail('region', e.target.value || null)
                      }
                      placeholder="메모를 추가하세요."
                      className="h-10 w-full rounded-md border-2 border-border bg-surface px-4 text-sm outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring"
                    />
                  </div>
                </div>
              )}
            </div>
          </>
        )}

        <hr className="border-border" />

        {/* 부가 설명 */}
        <section>
          <h3 className="mb-2 text-base font-medium text-fg">부가 설명</h3>
          <textarea
            value={memoValue}
            onChange={handleMemoChange}
            placeholder="메모를 추가하세요."
            rows={5}
            className="w-full resize-none rounded-md border-2 border-border bg-surface p-3 text-sm outline-none transition-colors placeholder:text-fg-muted"
          />
        </section>

        <hr className="border-border" />

        {/* 도형 크기 */}
        {style && (
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <span className="text-base font-medium text-fg">도형 크기</span>
              <InlineDropdown
                items={NODE_SIZE_ITEMS}
                value={style.size}
                onChange={(value) => updateStyle('size', value)}
              />
            </div>

            {/* 도형 색상 */}
            <div className="flex items-center justify-between">
              <span className="text-base font-medium text-fg">도형 색상</span>
              <input
                type="color"
                value={style.bgColor}
                onChange={(e) => updateStyle('bgColor', e.target.value)}
                className="h-8 w-8 cursor-pointer rounded border border-border"
              />
            </div>

            {/* 텍스트 색상 */}
            <div className="flex items-center justify-between">
              <span className="text-base font-medium text-fg">텍스트 색상</span>
              <input
                type="color"
                value={style.textColor}
                onChange={(e) => updateStyle('textColor', e.target.value)}
                className="h-8 w-8 cursor-pointer rounded border border-border"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

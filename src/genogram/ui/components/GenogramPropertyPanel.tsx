import React from 'react';

import { Edit3, X } from 'lucide-react';

import { Button, CheckBox, Dropdown, Input, TextArea } from '@/components/ui';
import type { Subject } from '@/genogram/core/models/person';
import { SubjectType } from '@/genogram/core/types/enums';

import {
  CLINIC_STATUS_ITEMS,
  GENDER_TYPE_ITEMS,
  NODE_SIZE_ITEMS,
} from '../constants/labels';
import { usePropertyPanel } from '../hooks/usePropertyPanel';

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
          <Input
            ref={nameInputRef}
            size="sm"
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
            className="flex-1 text-lg font-bold"
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
        <Button size="sm" variant="ghost" tone="neutral" onClick={onClose}>
          <X size={16} />
        </Button>
      </div>

      <hr className="mx-5 mt-3 border-border" />

      <div className="flex flex-col gap-5 px-5 py-5">
        {/* 성별 / 타입 */}
        <section>
          <h3 className="mb-2 text-sm font-semibold text-fg">성별</h3>
          <Dropdown
            items={GENDER_TYPE_ITEMS}
            value={genderDropdownValue}
            onChange={(value) => updateGenderOrType(value)}
          />
        </section>

        {/* 사망 여부 (공통) */}
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold text-fg">사망 여부</span>
          <CheckBox
            checked={currentIsDead}
            onChange={(e) =>
              updateAttribute('isDead', (e.target as HTMLInputElement).checked)
            }
          />
        </div>

        {/* Person 전용 필드 */}
        {isPerson && attr && (
          <>
            {/* 출생일 */}
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-fg">출생일</span>
              <Input
                size="sm"
                type="date"
                value={attr.lifeSpan.birth ?? ''}
                onChange={(e) =>
                  updateLifeSpan('birth', e.target.value || null)
                }
                placeholder="미입력"
                className="w-36 text-right"
              />
            </div>

            {/* 사망일 */}
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-fg">사망일</span>
              <Input
                size="sm"
                type="date"
                value={attr.lifeSpan.death ?? ''}
                onChange={(e) =>
                  updateLifeSpan('death', e.target.value || null)
                }
                placeholder="미입력"
                className="w-36 text-right"
              />
            </div>

            {/* 나이 */}
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-fg">나이</span>
              <div className="flex items-center gap-1">
                <span className="text-sm text-fg-muted">만</span>
                <Input
                  size="sm"
                  type="number"
                  value={attr.age ?? ''}
                  onChange={(e) => {
                    const val = e.target.value;
                    updateAttribute('age', val ? Number(val) : null);
                  }}
                  placeholder="미입력"
                  className="w-16 text-right"
                />
                <span className="text-sm text-fg-muted">세</span>
              </div>
            </div>

            <hr className="border-border" />

            {/* 임상적 상태 */}
            <section>
              <h3 className="mb-2 text-sm font-semibold text-fg">
                임상적 상태
              </h3>
              <Dropdown
                items={CLINIC_STATUS_ITEMS}
                value={attr.clinicStatus}
                onChange={(value) => updateAttribute('clinicStatus', value)}
              />
            </section>

            <hr className="border-border" />

            {/* 인적 사항 정보 */}
            <div>
              <div className="mb-2 flex items-center justify-between">
                <span className="text-sm font-semibold text-fg">
                  인적 사항 정보
                </span>
                <CheckBox
                  checked={attr.detail.enable}
                  onChange={(e) =>
                    updateDetail(
                      'enable',
                      (e.target as HTMLInputElement).checked
                    )
                  }
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
                    <Input
                      id="job"
                      size="sm"
                      value={attr.detail.job ?? ''}
                      onChange={(e) =>
                        updateDetail('job', e.target.value || null)
                      }
                      placeholder="메모를 추가하세요."
                    />
                  </div>
                  <div>
                    <label
                      className="mb-1 block text-xs text-fg-muted"
                      htmlFor="education"
                    >
                      학력
                    </label>
                    <Input
                      id="education"
                      size="sm"
                      value={attr.detail.education ?? ''}
                      onChange={(e) =>
                        updateDetail('education', e.target.value || null)
                      }
                      placeholder="메모를 추가하세요."
                    />
                  </div>
                  <div>
                    <label
                      className="mb-1 block text-xs text-fg-muted"
                      htmlFor="region"
                    >
                      지역
                    </label>
                    <Input
                      id="region"
                      size="sm"
                      value={attr.detail.region ?? ''}
                      onChange={(e) =>
                        updateDetail('region', e.target.value || null)
                      }
                      placeholder="메모를 추가하세요."
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
          <h3 className="mb-2 text-sm font-semibold text-fg">부가 설명</h3>
          <TextArea
            value={memoValue}
            onChange={handleMemoChange}
            placeholder="메모를 추가하세요."
            rows={5}
          />
        </section>

        <hr className="border-border" />

        {/* 도형 크기 */}
        {style && (
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-fg">도형 크기</span>
              <Dropdown
                items={NODE_SIZE_ITEMS}
                value={style.size}
                onChange={(value) => updateStyle('size', value)}
              />
            </div>

            {/* 도형 색상 */}
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-fg">도형 색상</span>
              <input
                type="color"
                value={style.bgColor}
                onChange={(e) => updateStyle('bgColor', e.target.value)}
                className="h-8 w-8 cursor-pointer rounded border border-border"
              />
            </div>

            {/* 텍스트 색상 */}
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-fg">텍스트 색상</span>
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

import { Fragment, useRef, useState } from 'react';

import { ChevronDown } from 'lucide-react';

import { useDevice } from '@/shared/hooks/useDevice';
import { useDropdownPosition } from '@/shared/hooks/useDropdownPosition';
import { FormFieldTypeIcons } from '@/shared/icons';
import { Modal } from '@/shared/ui/composites/Modal';

import { FIELD_TYPE_LABEL } from '../../constants/formField';
import type { FormFieldType } from '../../types';

interface FieldTypeDropdownProps {
  type: FormFieldType;
  onChange: (type: FormFieldType) => void;
}

/** 셀렉터 항목 그룹 — 그룹 사이에 구분선. 동의(consent)는 동의서 전용이라 질문지 편집기에선 미노출. */
const TYPE_GROUPS: FormFieldType[][] = [
  ['single', 'multiple'],
  ['short', 'long', 'score'],
  ['section', 'richtext'],
];

/** 필드 유형 드롭다운 — 카드 우하단 버튼, 클릭 시 하단으로 셀렉터가 펼쳐진다. */
export function FieldTypeDropdown({ type, onChange }: FieldTypeDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { isMobile, isTablet } = useDevice();
  const isMobileView = isMobile || isTablet;
  const TriggerIcon = FormFieldTypeIcons[type];
  // 드롭다운 위치 보정(화면 밖 방지) — 카드가 하단에 있으면 위로 펼치고 넘치면 좌표 보정
  const triggerRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { direction, offset } = useDropdownPosition(
    triggerRef,
    dropdownRef,
    isOpen && !isMobileView,
    { estimatedHeight: 360 }
  );

  // 그룹 목록 본문 — 데스크탑 드롭다운/모바일 바텀시트 공용
  const typeList = TYPE_GROUPS.map((group, groupIndex) => (
    <Fragment key={groupIndex}>
      {groupIndex > 0 && <div className="my-2 border-t border-grey-40" />}
      {group.map((item) => {
        const ItemIcon = FormFieldTypeIcons[item];
        return (
          <button
            key={item}
            type="button"
            role="menuitem"
            onClick={() => {
              onChange(item);
              setIsOpen(false);
            }}
            className={`flex w-full items-center gap-3 rounded-lg px-2.5 py-2 text-left transition-colors lg:hover:bg-grey-20 ${
              item === type ? 'bg-grey-20' : ''
            }`}
          >
            <span className="text-grey-80">
              <ItemIcon size={20} />
            </span>
            <span className="text-m font-medium text-grey-100">
              {FIELD_TYPE_LABEL[item]}
            </span>
          </button>
        );
      })}
    </Fragment>
  ));

  return (
    <div ref={triggerRef} className="relative">
      <button
        type="button"
        aria-label="질문 유형 선택"
        aria-expanded={isOpen}
        onClick={() => setIsOpen((prev) => !prev)}
        className="flex h-9 w-[160px] items-center justify-between rounded-lg border border-grey-40 bg-grey-20 py-2 pl-3 pr-2 transition-colors lg:hover:bg-grey-30"
      >
        <span className="flex items-center gap-2 text-grey-100">
          <TriggerIcon size={20} />
          <span className="text-m font-medium">{FIELD_TYPE_LABEL[type]}</span>
        </span>
        <ChevronDown size={16} className="text-grey-70" />
      </button>

      {isMobileView ? (
        /* 모바일 — 바텀시트 */
        <Modal
          open={isOpen}
          onOpenChange={setIsOpen}
          mobileVariant="bottomSheet"
          hideCloseButton
        >
          <div className="pb-4">
            <p className="px-1 pb-2 text-m font-emphasize text-grey-100">
              질문 유형
            </p>
            {typeList}
          </div>
        </Modal>
      ) : (
        isOpen && (
          <>
            {/* 바깥 클릭 닫기용 투명 오버레이 */}
            <div
              className="fixed inset-0 z-modal"
              onClick={() => setIsOpen(false)}
              aria-hidden="true"
            />

            <div
              ref={dropdownRef}
              role="menu"
              style={{
                transform:
                  offset.x || offset.y
                    ? `translate(${offset.x}px, ${offset.y}px)`
                    : undefined,
              }}
              className={`absolute right-0 z-modal w-[234px] rounded-lg border border-grey-30 bg-white p-2.5 shadow-modal ${
                direction === 'up' ? 'bottom-full mb-2' : 'top-full mt-2'
              }`}
            >
              {typeList}
            </div>
          </>
        )
      )}
    </div>
  );
}

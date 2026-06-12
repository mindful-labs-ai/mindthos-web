import { Fragment, useState } from 'react';

import { ChevronDown } from 'lucide-react';

import { QnaQuestionTypeIcons } from '@/shared/icons';

import { QNA_QUESTION_TYPE_LABEL } from '../../constants/qnaQuestion';
import type { QnaQuestionType } from '../../types';

interface QuestionTypeDropdownProps {
  type: QnaQuestionType;
  onChange: (type: QnaQuestionType) => void;
}

/** 셀렉터 항목 그룹 — 그룹 사이에 구분선 */
const TYPE_GROUPS: QnaQuestionType[][] = [
  ['single', 'multiple'],
  ['short', 'long', 'score'],
  ['section'],
];

/** 질문 유형 드롭다운 — 카드 우하단 버튼, 클릭 시 하단으로 셀렉터가 펼쳐진다. */
export function QuestionTypeDropdown({
  type,
  onChange,
}: QuestionTypeDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const TriggerIcon = QnaQuestionTypeIcons[type];

  return (
    <div className="relative">
      <button
        type="button"
        aria-label="질문 유형 선택"
        aria-expanded={isOpen}
        onClick={() => setIsOpen((prev) => !prev)}
        className="flex h-9 w-[160px] items-center justify-between rounded-lg border border-grey-40 bg-grey-20 py-2 pl-3 pr-2 transition-colors lg:hover:bg-grey-30"
      >
        <span className="flex items-center gap-2 text-grey-100">
          <TriggerIcon size={20} />
          <span className="text-m font-medium">
            {QNA_QUESTION_TYPE_LABEL[type]}
          </span>
        </span>
        <ChevronDown size={16} className="text-grey-70" />
      </button>

      {isOpen && (
        <>
          {/* 바깥 클릭 닫기용 투명 오버레이 */}
          <div
            className="fixed inset-0 z-modal"
            onClick={() => setIsOpen(false)}
            aria-hidden="true"
          />

          <div
            role="menu"
            className="absolute right-0 top-full z-modal mt-2 w-[234px] rounded-lg border border-grey-30 bg-white p-2.5 shadow-[0px_4px_24px_rgba(0,0,0,0.1)]"
          >
            {TYPE_GROUPS.map((group, groupIndex) => (
              <Fragment key={groupIndex}>
                {groupIndex > 0 && (
                  <div className="my-2 border-t border-grey-40" />
                )}
                {group.map((item) => {
                  const ItemIcon = QnaQuestionTypeIcons[item];
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
                        {QNA_QUESTION_TYPE_LABEL[item]}
                      </span>
                    </button>
                  );
                })}
              </Fragment>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

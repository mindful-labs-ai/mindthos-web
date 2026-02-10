import { useState, useCallback, useRef, useEffect } from 'react';

import { ChevronDown, Pencil, Plus, Trash2, X } from 'lucide-react';
import { createPortal } from 'react-dom';

import { cn } from '@/lib/cn';

// ─────────────────────────────────────────────────────────────────────────────
// Auto-resize Textarea 컴포넌트
// ─────────────────────────────────────────────────────────────────────────────

interface AutoResizeTextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  minRows?: number;
  maxRows?: number;
}

function AutoResizeTextarea({
  value,
  onChange,
  minRows = 2,
  maxRows = 6,
  className,
  ...props
}: AutoResizeTextareaProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    // 높이 초기화 후 scrollHeight로 설정
    textarea.style.height = 'auto';
    const lineHeight = 20; // 대략적인 line-height
    const minHeight = minRows * lineHeight;
    const maxHeight = maxRows * lineHeight;
    const newHeight = Math.min(
      Math.max(textarea.scrollHeight, minHeight),
      maxHeight
    );
    textarea.style.height = `${newHeight}px`;
  }, [value, minRows, maxRows]);

  return (
    <textarea
      ref={textareaRef}
      value={value}
      onChange={onChange}
      className={cn(
        'resize-none rounded-md bg-primary-50 px-2 py-2 text-sm text-fg placeholder:text-fg-muted focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary',
        className
      )}
      {...props}
    />
  );
}

import type { AISubject, AIGenogramOutput } from '../../utils/aiJsonConverter';

// ─────────────────────────────────────────────────────────────────────────────
// 커스텀 드롭다운 컴포넌트
// ─────────────────────────────────────────────────────────────────────────────

interface SelectOption {
  value: string;
  label: string;
}

interface CustomSelectProps {
  value: string;
  options: SelectOption[];
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

function CustomSelect({
  value,
  options,
  onChange,
  placeholder = '선택',
  className,
}: CustomSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0, width: 0 });
  const triggerRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const selectedLabel =
    options.find((opt) => opt.value === value)?.label || placeholder;

  // 드롭다운 위치 계산
  const updatePosition = useCallback(() => {
    if (triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      setPosition({
        top: rect.bottom + 4,
        left: rect.left,
        width: Math.max(rect.width, 100),
      });
    }
  }, []);

  // 외부 클릭 감지
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node) &&
        triggerRef.current &&
        !triggerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleOpen = () => {
    updatePosition();
    setIsOpen(true);
  };

  const handleSelect = (optValue: string) => {
    onChange(optValue);
    setIsOpen(false);
  };

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={handleOpen}
        className={cn(
          'flex h-[22px] w-full items-center justify-between rounded-md border border-border bg-white px-[6px] text-xs text-fg',
          className
        )}
      >
        <span className="truncate">{selectedLabel}</span>
        <ChevronDown className="h-3 w-3 shrink-0 text-fg-muted" />
      </button>

      {isOpen &&
        createPortal(
          <div
            ref={dropdownRef}
            style={{
              position: 'fixed',
              top: position.top,
              left: position.left,
              minWidth: position.width,
              zIndex: 9999,
            }}
            className="rounded-xl bg-white py-2 shadow-lg"
          >
            {options.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => handleSelect(opt.value)}
                className={cn(
                  'flex w-full items-center px-4 py-2 text-sm hover:bg-surface-contrast',
                  opt.value === value ? 'font-medium text-fg' : 'text-fg-muted'
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>,
          document.body
        )}
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 옵션 데이터
// ─────────────────────────────────────────────────────────────────────────────

const GENDER_OPTIONS = [
  { value: 'Male', label: '남성' },
  { value: 'Female', label: '여성' },
  { value: 'Gay', label: '게이' },
  { value: 'Lesbian', label: '레즈비언' },
  { value: 'Transgender_Male', label: '트랜스젠더 남성' },
  { value: 'Transgender_Female', label: '트랜스젠더 여성' },
  { value: 'Nonbinary', label: '논바이너리' },
];

const ILLNESS_OPTIONS = [
  { value: 'None', label: '없음' },
  { value: 'Psychological_Or_Physical_Problem', label: '심리적/신체적 문제' },
  { value: 'Alcohol_Or_Drug_Abuse', label: '알코올 / 약물 남용' },
  { value: 'Suspected_Alcohol_Or_Drug_Abuse', label: '알코올/약물 남용 의심' },
  {
    value: 'Psychological_Or_Physical_Illness_In_Remission',
    label: '질병 관해',
  },
  { value: 'In_Recovery_From_Substance_Abuse', label: '물질 남용 회복 중' },
  {
    value: 'Serious_Mental_Or_Physical_Problems_And_Substance_Abuse',
    label: '심각한 문제 + 물질 남용',
  },
];

const GENDER_LABELS: Record<string, string> = Object.fromEntries(
  GENDER_OPTIONS.map((o) => [o.value, o.label])
);

const ILLNESS_LABELS: Record<string, string> = Object.fromEntries(
  ILLNESS_OPTIONS.map((o) => [o.value, o.label])
);

const RELATION_TYPE_LABELS: Record<string, string> = {
  spouse: '배우자',
  parent: '부모',
  child: '자녀',
};

const RELATION_TYPE_OPTIONS = [
  { value: 'parent', label: '부모' },
  { value: 'spouse', label: '배우자' },
  { value: 'child', label: '자녀' },
];

// ─────────────────────────────────────────────────────────────────────────────
// 타입
// ─────────────────────────────────────────────────────────────────────────────

export type RelationType = 'spouse' | 'parent' | 'child';

export interface Relation {
  targetId: number;
  targetName: string;
  type: RelationType;
}

interface FamilyMemberCardProps {
  subject: AISubject;
  index: number;
  relations: Relation[];
  allSubjects: AISubject[];
  onUpdate: (id: number, updates: Partial<AISubject>) => void;
  onAddRelation: (
    subjectId: number,
    targetId: number,
    type: RelationType
  ) => void;
  onRemoveRelation: (
    subjectId: number,
    targetId: number,
    type: RelationType
  ) => void;
  onDelete: (id: number) => void;
  /** 팝오버를 렌더링할 컨테이너 (Portal 대상) */
  portalContainer?: HTMLElement | null;
  /** 외부에서 편집 상태 제어 */
  isEditing?: boolean;
  onEditChange?: (isEditing: boolean) => void;
}

// ─────────────────────────────────────────────────────────────────────────────
// 삭제 확인 모달 컴포넌트
// ─────────────────────────────────────────────────────────────────────────────

interface DeleteConfirmModalProps {
  isOpen: boolean;
  name: string;
  onClose: () => void;
  onConfirm: () => void;
}

function DeleteConfirmModal({
  isOpen,
  name,
  onClose,
  onConfirm,
}: DeleteConfirmModalProps) {
  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      {/* 백드롭 */}
      <button
        type="button"
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
        aria-label="모달 닫기"
      />
      {/* 모달 */}
      <div className="relative w-[400px] rounded-2xl bg-white px-8 py-10">
        {/* 닫기 버튼 */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 p-1 text-fg-muted hover:text-fg"
        >
          <X className="h-5 w-5" />
        </button>

        {/* 제목 */}
        <h2 className="mb-8 text-center text-xl font-bold text-fg">
          구성원 삭제
        </h2>

        {/* 내용 */}
        <p className="mb-2 text-center text-lg font-medium text-fg">
          {name} 가족 구성원을 삭제하시겠습니까?
        </p>
        <p className="mb-10 text-center text-sm text-fg-muted">
          한 번 삭제하면 해당 정보를 다시 불러올 수 없어요.
          <br />
          그래도 삭제하시겠습니까?
        </p>

        {/* 삭제 버튼 */}
        <button
          onClick={onConfirm}
          className="h-14 w-full rounded-xl bg-primary text-lg font-medium text-white transition-colors hover:bg-primary-600"
        >
          삭제하기
        </button>
      </div>
    </div>,
    document.body
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 칩 컴포넌트
// ─────────────────────────────────────────────────────────────────────────────

function Chip({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        'h-[22px] items-center truncate rounded-md border border-border bg-surface-contrast px-1.5 py-1 text-xs text-fg',
        className
      )}
    >
      {children}
    </span>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 메인 컴포넌트
// ─────────────────────────────────────────────────────────────────────────────

export function FamilyMemberCard({
  subject,
  index,
  relations,
  allSubjects,
  onUpdate,
  onAddRelation,
  onRemoveRelation,
  onDelete,
  portalContainer,
  isEditing: controlledIsEditing,
  onEditChange,
}: FamilyMemberCardProps) {
  // 외부 제어 또는 내부 상태 사용
  const [internalIsEditing, setInternalIsEditing] = useState(false);
  const isEditing = controlledIsEditing ?? internalIsEditing;
  const setIsEditing = (value: boolean) => {
    if (onEditChange) {
      onEditChange(value);
    } else {
      setInternalIsEditing(value);
    }
  };
  const [showAddPopover, setShowAddPopover] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [newRelationTarget, setNewRelationTarget] = useState<number | null>(
    null
  );
  const [newRelationType, setNewRelationType] =
    useState<RelationType>('parent');
  const [popoverPosition, setPopoverPosition] = useState({ top: 0, left: 0 });
  const popoverRef = useRef<HTMLDivElement>(null);
  const addButtonRef = useRef<HTMLButtonElement>(null);
  const internalScrollRef = useRef<HTMLDivElement>(null);

  // 팝오버 위치 업데이트 함수
  const updatePopoverPosition = useCallback(() => {
    if (addButtonRef.current && portalContainer) {
      const buttonRect = addButtonRef.current.getBoundingClientRect();
      const containerRect = portalContainer.getBoundingClientRect();
      setPopoverPosition({
        top:
          buttonRect.bottom - containerRect.top + portalContainer.scrollTop + 8,
        left: buttonRect.left - containerRect.left + portalContainer.scrollLeft,
      });
    }
  }, [portalContainer]);

  // 팝오버 외부 클릭 감지 및 내부 스크롤 추적
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        popoverRef.current &&
        !popoverRef.current.contains(e.target as Node) &&
        addButtonRef.current &&
        !addButtonRef.current.contains(e.target as Node)
      ) {
        setShowAddPopover(false);
      }
    };

    const internalScrollEl = internalScrollRef.current;

    if (showAddPopover) {
      document.addEventListener('mousedown', handleClickOutside);
      // 카드 내부 스크롤 시 팝오버 위치 업데이트
      internalScrollEl?.addEventListener('scroll', updatePopoverPosition);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      internalScrollEl?.removeEventListener('scroll', updatePopoverPosition);
    };
  }, [showAddPopover, updatePopoverPosition]);

  const handleFieldChange = useCallback(
    (field: keyof AISubject, value: unknown) => {
      onUpdate(subject.id, { [field]: value });
    },
    [subject.id, onUpdate]
  );

  // 관계 추가 가능한 대상 (자기 자신 제외)
  const availableTargets = allSubjects.filter((s) => s.id !== subject.id);

  // 팝오버 열 때 기본값 설정 및 위치 계산
  const handleOpenAddPopover = () => {
    if (availableTargets.length > 0) {
      setNewRelationTarget(availableTargets[0].id);
    }
    setNewRelationType('parent');

    // 버튼 위치 기준으로 팝오버 위치 계산 (컨테이너 상대 좌표)
    if (addButtonRef.current && portalContainer) {
      const buttonRect = addButtonRef.current.getBoundingClientRect();
      const containerRect = portalContainer.getBoundingClientRect();
      setPopoverPosition({
        top:
          buttonRect.bottom - containerRect.top + portalContainer.scrollTop + 8,
        left: buttonRect.left - containerRect.left + portalContainer.scrollLeft,
      });
    }

    setShowAddPopover(true);
  };

  // 관계 추가 처리
  const handleAddRelation = () => {
    if (newRelationTarget !== null) {
      onAddRelation(subject.id, newRelationTarget, newRelationType);
      setShowAddPopover(false);
    }
  };

  const genderLabel = subject.gender ? GENDER_LABELS[subject.gender] : '미지정';
  const illnessLabel = subject.illness ? ILLNESS_LABELS[subject.illness] : null;

  // 관계 배지 렌더링 (보기 모드)
  const renderRelationChips = () => {
    if (relations.length === 0) return null;

    return (
      <div className="flex flex-wrap gap-1">
        {relations.map((rel, idx) => (
          <Chip key={`${rel.type}-${rel.targetId}-${idx}`}>
            {rel.targetId}-{RELATION_TYPE_LABELS[rel.type] || rel.type}
          </Chip>
        ))}
      </div>
    );
  };

  // 관계 배지 렌더링 (편집 모드 - X 버튼 포함)
  const renderEditableRelationChips = () => {
    return (
      <div className="relative flex flex-wrap items-center gap-1">
        {relations.map((rel, idx) => (
          <span
            key={`${rel.type}-${rel.targetId}-${idx}`}
            className="inline-flex h-[22px] items-center gap-1 rounded-md border border-border bg-surface-contrast px-2 text-xs text-fg"
          >
            {rel.targetId}-{RELATION_TYPE_LABELS[rel.type] || rel.type}
            <button
              onClick={() =>
                onRemoveRelation(subject.id, rel.targetId, rel.type)
              }
              className="ml-0.5 text-fg-muted hover:text-fg"
            >
              <X className="h-3 w-3" />
            </button>
          </span>
        ))}
        {/* + 버튼 */}
        <button
          ref={addButtonRef}
          onClick={handleOpenAddPopover}
          className="inline-flex h-[22px] w-[22px] items-center justify-center rounded-md border border-border bg-surface-contrast text-fg-muted hover:border-fg-muted hover:text-fg"
        >
          <Plus className="h-3 w-3" />
        </button>

        {/* 관계 추가 팝오버 (Portal로 스크롤 컨테이너에 렌더링) */}
        {showAddPopover &&
          portalContainer &&
          createPortal(
            <div
              ref={popoverRef}
              style={{
                position: 'absolute',
                top: popoverPosition.top,
                left: popoverPosition.left,
                zIndex: 50,
              }}
              className="w-[260px] rounded-xl border border-border bg-white p-4 shadow-lg"
            >
              <h4 className="mb-3 text-sm font-medium text-fg-muted">
                관계 추가하기
              </h4>

              {/* 대상 선택 */}
              <div className="mb-3 flex items-center gap-3">
                <span className="w-16 shrink-0 text-sm text-fg">대상</span>
                <div className="relative flex-1">
                  <select
                    value={newRelationTarget ?? ''}
                    onChange={(e) =>
                      setNewRelationTarget(Number(e.target.value))
                    }
                    className="h-8 w-full appearance-none rounded-md border border-border bg-white px-2 pr-7 text-sm text-fg focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  >
                    {availableTargets.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.id}. {s.name || `인물 ${s.id}`}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2 text-fg-muted" />
                </div>
              </div>

              {/* 관계 종류 선택 */}
              <div className="mb-4 flex items-center gap-3">
                <span className="w-16 shrink-0 text-sm text-fg">관계 종류</span>
                <div className="relative flex-1">
                  <select
                    value={newRelationType}
                    onChange={(e) =>
                      setNewRelationType(e.target.value as RelationType)
                    }
                    className="h-8 w-full appearance-none rounded-md border border-border bg-white px-2 pr-7 text-sm text-fg focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  >
                    {RELATION_TYPE_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2 text-fg-muted" />
                </div>
              </div>

              {/* 추가 버튼 */}
              <button
                onClick={handleAddRelation}
                disabled={newRelationTarget === null}
                className="h-10 w-full rounded-lg bg-primary text-sm font-medium text-white transition-colors hover:bg-primary-600 disabled:cursor-not-allowed disabled:opacity-50"
              >
                추가하기
              </button>
            </div>,
            portalContainer
          )}
      </div>
    );
  };

  // 공통 필드 값 스타일 (편집/보기 모드 레이아웃 일치)
  const fieldValueClass =
    'flex h-8 w-full items-center rounded-md px-2 text-sm';
  const inputClassName = cn(
    fieldValueClass,
    'bg-primary-50 text-fg placeholder:text-fg-muted focus:outline-none focus:ring-1 focus:ring-primary'
  );
  const displayClassName = cn(fieldValueClass, 'font-medium text-fg');

  return (
    <div
      className={cn(
        'relative flex h-[276px] max-w-[489px] flex-col rounded-xl border border-border bg-white'
      )}
    >
      {/* ─────────────────────────────────────────────────────────────────────
          상단 레이아웃: 순서 배지 + 내담자 배지
         ───────────────────────────────────────────────────────────────────── */}
      <div className="flex shrink-0 justify-between px-3 pt-3">
        {/* 순서 배지 */}
        <div className="flex h-5 w-5 items-center justify-center rounded-full bg-[#BABAC0] text-xs font-bold text-surface">
          {index + 1}
        </div>

        {/* 내담자 배지 */}
        {subject.isIP && (
          <div className="flex h-[27px] w-[54px] items-center justify-center rounded-md border border-primary text-sm font-medium text-primary">
            내담자
          </div>
        )}
      </div>

      {/* ─────────────────────────────────────────────────────────────────────
          하단 레이아웃: 좌측(고정) + 우측(스크롤)
         ───────────────────────────────────────────────────────────────────── */}
      <div className="flex min-h-0 flex-1 gap-3 px-3 pb-3 pt-2">
        {/* 좌측 레이아웃 (고정 크기, 넘어가지 않음) */}
        <div className="flex w-[130px] shrink-0 flex-col items-center gap-2">
          {/* 아바타 박스 */}
          <div className="flex h-[108px] w-[108px] flex-col items-center justify-center rounded-lg border border-border">
            {/* 성별에 따른 도형 */}
            <div
              className={cn(
                'flex h-[60px] w-[60px] items-center justify-center border-2 border-fg text-xl font-semibold',
                subject.gender === 'Female' && 'rounded-full',
                subject.gender === 'Male' && 'rounded-none',
                (!subject.gender ||
                  (subject.gender !== 'Male' && subject.gender !== 'Female')) &&
                  'rounded-lg'
              )}
            >
              {subject.age ?? ''}
            </div>
            {isEditing ? (
              <input
                type="text"
                value={subject.name || ''}
                onChange={(e) => handleFieldChange('name', e.target.value)}
                placeholder={`인물 ${subject.id}`}
                className="mt-1 w-full bg-primary-50 text-center text-sm font-medium text-fg placeholder:text-fg-muted focus:outline-none"
              />
            ) : (
              <span className="mt-1 max-w-[100px] truncate text-sm font-medium text-fg">
                {subject.name || `인물 ${subject.id}`}
              </span>
            )}
          </div>

          {/* 성별/상태 영역 - 편집/보기 모드 동일 레이아웃 */}
          <div className="flex w-[108px] flex-col gap-2">
            <div className="flex w-full items-center gap-2">
              <span className="w-8 shrink-0 text-xs text-fg-muted">성별</span>
              {isEditing ? (
                <CustomSelect
                  value={subject.gender || ''}
                  options={GENDER_OPTIONS}
                  onChange={(v) => handleFieldChange('gender', v)}
                  placeholder="선택"
                  className="max-w-[68px] flex-1"
                />
              ) : (
                <Chip>{genderLabel}</Chip>
              )}
            </div>
            <div className="flex w-full items-center gap-2">
              <span className="w-8 shrink-0 text-xs text-fg-muted">상태</span>
              {isEditing ? (
                <CustomSelect
                  value={subject.illness || 'None'}
                  options={ILLNESS_OPTIONS}
                  onChange={(v) => handleFieldChange('illness', v)}
                  placeholder="선택"
                  className="max-w-[68px] flex-1"
                />
              ) : (
                <Chip className="max-w-[80px]">{illnessLabel || '없음'}</Chip>
              )}
            </div>
          </div>
        </div>

        {/* 우측 레이아웃 (나머지 공간, 스크롤 가능) */}
        <div
          ref={internalScrollRef}
          className="relative min-w-0 flex-1 overflow-y-auto pt-[3px]"
        >
          <div className="space-y-2">
            {/* 나이 */}
            <div className="flex items-center gap-2">
              <span className="w-8 shrink-0 text-xs text-fg-muted">나이</span>
              {isEditing ? (
                <input
                  type="number"
                  value={subject.age ?? ''}
                  onChange={(e) =>
                    handleFieldChange(
                      'age',
                      e.target.value ? Number(e.target.value) : null
                    )
                  }
                  placeholder="나이"
                  className={inputClassName}
                />
              ) : (
                <span className={displayClassName}>{subject.age ?? '-'}</span>
              )}
            </div>

            {/* 직업 */}
            <div className="flex items-center gap-2">
              <span className="w-8 shrink-0 text-xs text-fg-muted">직업</span>
              {isEditing ? (
                <input
                  type="text"
                  value={subject.job || ''}
                  onChange={(e) => handleFieldChange('job', e.target.value)}
                  placeholder="직업"
                  className={inputClassName}
                />
              ) : (
                <span className={cn(displayClassName, 'truncate')}>
                  {subject.job || '-'}
                </span>
              )}
            </div>

            {/* 관계 */}
            <div className="flex items-start gap-2">
              <span className="w-8 shrink-0 pt-1 text-xs text-fg-muted">
                관계
              </span>
              <div className="flex-1">
                {isEditing ? (
                  renderEditableRelationChips()
                ) : relations.length > 0 ? (
                  renderRelationChips()
                ) : (
                  <span className="text-sm text-fg-muted">-</span>
                )}
              </div>
            </div>

            {/* 메모 */}
            <div className="flex items-start gap-2">
              <span className="w-8 shrink-0 pt-2 text-xs text-fg-muted">
                메모
              </span>
              {isEditing ? (
                <AutoResizeTextarea
                  value={subject.memo || ''}
                  onChange={(e) => handleFieldChange('memo', e.target.value)}
                  placeholder="메모"
                  minRows={2}
                  maxRows={5}
                  className="flex-1"
                />
              ) : (
                <span className="min-h-[40px] flex-1 break-all rounded-md px-2 py-2 text-sm text-fg">
                  {subject.memo || '-'}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="absolute right-4 top-2 flex items-center gap-2">
        {!subject.isIP && isEditing && (
          <button
            onClick={() => setShowDeleteModal(true)}
            className="flex h-[27px] w-[27px] items-center justify-center rounded-md text-danger hover:scale-105"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* 편집/저장 버튼 (우측 하단 고정) */}
      <div className="absolute bottom-4 right-4 flex items-center gap-2">
        {isEditing ? (
          <button
            onClick={() => setIsEditing(false)}
            className="flex h-[27px] w-[50px] items-center justify-center rounded-md bg-primary text-sm text-white hover:bg-primary-600"
          >
            저장
          </button>
        ) : (
          <button
            onClick={() => setIsEditing(true)}
            className="p-1 text-fg-muted hover:text-fg"
          >
            <Pencil className="h-5 w-5" />
          </button>
        )}
      </div>

      {/* 삭제 확인 모달 */}
      <DeleteConfirmModal
        isOpen={showDeleteModal}
        name={subject.name || `인물 ${subject.id}`}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={() => {
          onDelete(subject.id);
          setShowDeleteModal(false);
        }}
      />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 관계 추출 유틸리티 함수
// ─────────────────────────────────────────────────────────────────────────────

export function extractRelations(
  subjectId: number,
  data: AIGenogramOutput
): Relation[] {
  const relations: Relation[] = [];
  const subjectMap = new Map(data.subjects.map((s) => [s.id, s]));

  // 배우자 관계 (partners)
  for (const [id1, id2] of data.partners) {
    if (id1 === subjectId) {
      const target = subjectMap.get(id2);
      relations.push({
        targetId: id2,
        targetName: target?.name || `인물 ${id2}`,
        type: 'spouse',
      });
    } else if (id2 === subjectId) {
      const target = subjectMap.get(id1);
      relations.push({
        targetId: id1,
        targetName: target?.name || `인물 ${id1}`,
        type: 'spouse',
      });
    }
  }

  // 부모/자녀 관계 (children)
  for (const [fatherId, motherId, childId] of data.children) {
    if (childId === subjectId) {
      // 이 사람이 자녀일 때 → 부모 관계
      if (fatherId) {
        const target = subjectMap.get(fatherId);
        relations.push({
          targetId: fatherId,
          targetName: target?.name || `인물 ${fatherId}`,
          type: 'parent',
        });
      }
      if (motherId) {
        const target = subjectMap.get(motherId);
        relations.push({
          targetId: motherId,
          targetName: target?.name || `인물 ${motherId}`,
          type: 'parent',
        });
      }
    } else if (fatherId === subjectId || motherId === subjectId) {
      // 이 사람이 부모일 때 → 자녀 관계
      const target = subjectMap.get(childId);
      relations.push({
        targetId: childId,
        targetName: target?.name || `인물 ${childId}`,
        type: 'child',
      });
    }
  }

  // 연결선 관계(relations)는 하단 RelationCard에서 관리하므로 제외

  return relations;
}

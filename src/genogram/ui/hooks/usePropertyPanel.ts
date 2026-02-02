import { useCallback, useEffect, useRef, useState } from 'react';

import type {
  AnimalAttribute,
  PersonAttribute,
  PersonDetail,
  PersonLifeSpan,
  Subject,
  SubjectStyle,
} from '@/genogram/core/models/person';
import { SubjectType } from '@/genogram/core/types/enums';

interface UsePropertyPanelOptions {
  subject: Subject | null;
  onUpdate: (subjectId: string, updates: Partial<Subject>) => void;
  onConvertType?: (subjectId: string, targetType: string) => void;
}

export const usePropertyPanel = ({
  subject,
  onUpdate,
  onConvertType,
}: UsePropertyPanelOptions) => {
  const [isEditingName, setIsEditingName] = useState(false);
  const [nameValue, setNameValue] = useState('');
  const [memoValue, setMemoValue] = useState('');
  const nameInputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(
    undefined
  );

  const isPerson = subject?.entity.type === SubjectType.Person;
  const isAnimal = subject?.entity.type === SubjectType.Animal;
  const attr = isPerson
    ? (subject!.entity.attribute as PersonAttribute)
    : undefined;
  const animalAttr = isAnimal
    ? (subject!.entity.attribute as AnimalAttribute)
    : undefined;

  // subject 변경 시 로컬 상태 동기화
  /* eslint-disable react-hooks/set-state-in-effect -- prop → local state sync on id change */
  useEffect(() => {
    if (subject) {
      setNameValue(attr?.name ?? '');
      setMemoValue(subject.entity.memo ?? '');
      setIsEditingName(false);
    }
  }, [subject?.id]); // eslint-disable-line react-hooks/exhaustive-deps
  /* eslint-enable react-hooks/set-state-in-effect */

  // 이름 편집 시작 시 포커스
  useEffect(() => {
    if (isEditingName && nameInputRef.current) {
      nameInputRef.current.focus();
      nameInputRef.current.select();
    }
  }, [isEditingName]);

  // attribute 업데이트 헬퍼 (Person/Animal 공통)
  const updateAttribute = useCallback(
    (field: string, value: unknown) => {
      if (!subject) return;
      const currentAttr = attr ?? animalAttr;
      if (!currentAttr) return;
      onUpdate(subject.id, {
        entity: {
          ...subject.entity,
          attribute: { ...currentAttr, [field]: value },
        },
      });
    },
    [subject, attr, animalAttr, onUpdate]
  );

  // 성별/타입 통합 변경 핸들러 → editor에 위임
  const updateGenderOrType = useCallback(
    (value: string) => {
      if (!subject) return;
      if (onConvertType) {
        onConvertType(subject.id, value);
      }
    },
    [subject, onConvertType]
  );

  // lifeSpan 업데이트 헬퍼
  const updateLifeSpan = useCallback(
    (field: keyof PersonLifeSpan, value: string | null) => {
      if (!subject || !attr) return;
      onUpdate(subject.id, {
        entity: {
          ...subject.entity,
          attribute: {
            ...attr,
            lifeSpan: { ...attr.lifeSpan, [field]: value },
          },
        },
      });
    },
    [subject, attr, onUpdate]
  );

  // detail 업데이트 헬퍼
  const updateDetail = useCallback(
    (field: keyof PersonDetail, value: unknown) => {
      if (!subject || !attr) return;
      onUpdate(subject.id, {
        entity: {
          ...subject.entity,
          attribute: {
            ...attr,
            detail: { ...attr.detail, [field]: value },
          },
        },
      });
    },
    [subject, attr, onUpdate]
  );

  // 메모 업데이트 (debounced)
  const handleMemoChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const val = e.target.value;
      setMemoValue(val);

      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        if (!subject) return;
        onUpdate(subject.id, {
          entity: {
            ...subject.entity,
            memo: val || null,
          },
        });
      }, 300);
    },
    [subject, onUpdate]
  );

  // style 업데이트 헬퍼
  const updateStyle = useCallback(
    (field: keyof SubjectStyle, value: unknown) => {
      if (!subject) return;
      onUpdate(subject.id, {
        layout: {
          ...subject.layout,
          style: { ...subject.layout.style, [field]: value },
        },
      });
    },
    [subject, onUpdate]
  );

  // 이름 커밋
  const commitName = useCallback(() => {
    if (!subject) return;
    updateAttribute('name', nameValue || null);
    setIsEditingName(false);
  }, [subject, nameValue, updateAttribute]);

  return {
    isPerson,
    isAnimal,
    attr,
    animalAttr,
    style: subject?.layout.style,
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
  };
};

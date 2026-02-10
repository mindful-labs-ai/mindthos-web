import { useCallback, useMemo, useRef, useState } from 'react';

import type {
  AIGenogramOutput,
  AISubject,
  AIInfluenceStatus,
  AIRelationStatus,
} from '../../utils/aiJsonConverter';

import { AddMemberCard, AddRelationCard } from './AddCards';
import {
  FamilyMemberCard,
  extractRelations,
  type RelationType,
} from './FamilyMemberCard';
import { GenerationConfirmModal } from './GenerationConfirmModal';
import {
  RelationCard,
  isInfluenceStatus,
  type RelationData,
} from './RelationCard';

// ─────────────────────────────────────────────────────────────────────────────
// 타입 정의
// ─────────────────────────────────────────────────────────────────────────────

interface FamilyMemberListStepProps {
  data: AIGenogramOutput;
  onChange: (data: AIGenogramOutput) => void;
  onNext: () => void;
}

export function FamilyMemberListStep({
  data,
  onChange,
  onNext,
}: FamilyMemberListStepProps) {
  // 스크롤 컨테이너 ref (팝오버 Portal 대상)
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // 현재 편집 중인 구성원 카드 인덱스 (null이면 편집 중 아님)
  const [editingMemberIndex, setEditingMemberIndex] = useState<number | null>(
    null
  );

  // 현재 편집 중인 관계 카드 인덱스 (null이면 편집 중 아님)
  const [editingRelationIndex, setEditingRelationIndex] = useState<
    number | null
  >(null);

  // 생성 확인 모달 표시 여부
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  // 편집 중인 카드가 있는지 확인
  const hasUnsavedChanges =
    editingMemberIndex !== null || editingRelationIndex !== null;

  // 편집 중일 때 추가 버튼 비활성화
  const isAddDisabled = hasUnsavedChanges;

  // Subject map for quick lookup
  const subjectMap = useMemo(
    () => new Map(data.subjects.map((s) => [s.id, s])),
    [data.subjects]
  );

  // ─────────────────────────────────────────────────────────────────────────────
  // Subject 핸들러
  // ─────────────────────────────────────────────────────────────────────────────

  const handleSubjectUpdate = useCallback(
    (id: number, updates: Partial<AISubject>) => {
      const newSubjects = data.subjects.map((s) =>
        s.id === id ? { ...s, ...updates } : s
      );
      onChange({ ...data, subjects: newSubjects });
    },
    [data, onChange]
  );

  const handleAddSubject = useCallback(() => {
    const maxId = Math.max(0, ...data.subjects.map((s) => s.id));
    const newSubject: AISubject = {
      id: maxId + 1,
      type: 'PERSON',
      name: '',
      gender: undefined,
      age: null,
      isIP: false,
    };
    onChange({ ...data, subjects: [...data.subjects, newSubject] });

    // 새로 추가된 카드를 편집 모드로 설정
    setEditingMemberIndex(data.subjects.length);
  }, [data, onChange]);

  const handleDeleteSubject = useCallback(
    (id: number) => {
      // 해당 구성원과 관련된 모든 관계도 제거
      const newSubjects = data.subjects.filter((s) => s.id !== id);
      const newPartners = data.partners.filter(
        ([id1, id2]) => id1 !== id && id2 !== id
      );
      const newChildren = data.children.filter(
        ([fatherId, motherId, childId]) =>
          fatherId !== id && motherId !== id && childId !== id
      );
      const newRelations = data.relations.filter(
        ([id1, id2]) => id1 !== id && id2 !== id
      );
      const newInfluences = data.influences.filter(
        ([fromId, toId]) => fromId !== id && toId !== id
      );

      onChange({
        ...data,
        subjects: newSubjects,
        partners: newPartners,
        children: newChildren,
        relations: newRelations,
        influences: newInfluences,
      });
    },
    [data, onChange]
  );

  // ─────────────────────────────────────────────────────────────────────────────
  // 가족 관계 (partners, children) 핸들러
  // ─────────────────────────────────────────────────────────────────────────────

  const handleAddFamilyRelation = useCallback(
    (subjectId: number, targetId: number, type: RelationType) => {
      let newData = { ...data };

      if (type === 'spouse') {
        // 배우자 관계 추가 (중복 체크)
        const exists = data.partners.some(
          ([id1, id2]) =>
            (id1 === subjectId && id2 === targetId) ||
            (id1 === targetId && id2 === subjectId)
        );
        if (!exists) {
          newData = {
            ...newData,
            partners: [...newData.partners, [subjectId, targetId]],
          };
        }
      } else if (type === 'parent') {
        // subjectId의 부모로 targetId 추가
        // children 배열에서 subjectId가 자녀인 항목 찾기
        const existingIndex = data.children.findIndex(
          ([, , childId]) => childId === subjectId
        );
        if (existingIndex >= 0) {
          // 기존 항목에 부모 추가
          const [fatherId, motherId, childId] = data.children[existingIndex];
          const target = data.subjects.find((s) => s.id === targetId);
          const isMale =
            target?.gender === 'Male' || target?.gender === 'Transgender_Male';
          const newChildren = [...data.children];
          if (isMale && !fatherId) {
            newChildren[existingIndex] = [targetId, motherId, childId];
          } else if (!isMale && !motherId) {
            newChildren[existingIndex] = [fatherId, targetId, childId];
          }
          newData = { ...newData, children: newChildren };
        } else {
          // 새 항목 추가
          const target = data.subjects.find((s) => s.id === targetId);
          const isMale =
            target?.gender === 'Male' || target?.gender === 'Transgender_Male';
          if (isMale) {
            newData = {
              ...newData,
              children: [...newData.children, [targetId, null, subjectId]],
            };
          } else {
            newData = {
              ...newData,
              children: [...newData.children, [null, targetId, subjectId]],
            };
          }
        }
      } else if (type === 'child') {
        // subjectId의 자녀로 targetId 추가
        const subject = data.subjects.find((s) => s.id === subjectId);
        const isMale =
          subject?.gender === 'Male' || subject?.gender === 'Transgender_Male';
        // 기존에 targetId가 자녀인 항목이 있는지 확인
        const existingIndex = data.children.findIndex(
          ([, , childId]) => childId === targetId
        );
        if (existingIndex >= 0) {
          const [fatherId, motherId, childId] = data.children[existingIndex];
          const newChildren = [...data.children];
          if (isMale && !fatherId) {
            newChildren[existingIndex] = [subjectId, motherId, childId];
          } else if (!isMale && !motherId) {
            newChildren[existingIndex] = [fatherId, subjectId, childId];
          }
          newData = { ...newData, children: newChildren };
        } else {
          if (isMale) {
            newData = {
              ...newData,
              children: [...newData.children, [subjectId, null, targetId]],
            };
          } else {
            newData = {
              ...newData,
              children: [...newData.children, [null, subjectId, targetId]],
            };
          }
        }
      }

      onChange(newData);
    },
    [data, onChange]
  );

  const handleRemoveFamilyRelation = useCallback(
    (subjectId: number, targetId: number, type: RelationType) => {
      let newData = { ...data };

      if (type === 'spouse') {
        // 배우자 관계 제거
        newData = {
          ...newData,
          partners: newData.partners.filter(
            ([id1, id2]) =>
              !(
                (id1 === subjectId && id2 === targetId) ||
                (id1 === targetId && id2 === subjectId)
              )
          ),
        };
      } else if (type === 'parent') {
        // subjectId의 부모에서 targetId 제거
        newData = {
          ...newData,
          children: newData.children
            .map(([fatherId, motherId, childId]) => {
              if (childId === subjectId) {
                if (fatherId === targetId) return [null, motherId, childId];
                if (motherId === targetId) return [fatherId, null, childId];
              }
              return [fatherId, motherId, childId];
            })
            .filter(
              ([fatherId, motherId]) => fatherId !== null || motherId !== null
            ) as [number | null, number | null, number][],
        };
      } else if (type === 'child') {
        // subjectId의 자녀에서 targetId 제거
        newData = {
          ...newData,
          children: newData.children
            .map(([fatherId, motherId, childId]) => {
              if (childId === targetId) {
                if (fatherId === subjectId) return [null, motherId, childId];
                if (motherId === subjectId) return [fatherId, null, childId];
              }
              return [fatherId, motherId, childId];
            })
            .filter(
              ([fatherId, motherId]) => fatherId !== null || motherId !== null
            ) as [number | null, number | null, number][],
        };
      }

      onChange(newData);
    },
    [data, onChange]
  );

  // ─────────────────────────────────────────────────────────────────────────────
  // Relations/Influences 핸들러 (통합 구조)
  // ─────────────────────────────────────────────────────────────────────────────

  // Relations와 Influences를 통합된 RelationData 형식으로 변환 (단일 소스: data)
  const relationDataList = useMemo<RelationData[]>(() => {
    const list: RelationData[] = [];
    let orderCounter = 0;

    // Relations → [id1, id2, status, description]
    data.relations.forEach(([id1, id2, status, description]) => {
      list.push({
        id1,
        id2,
        status,
        description,
        order: orderCounter++,
      });
    });

    // Influences → [fromId, toId, status, memo]
    data.influences.forEach(([fromId, toId, status, memo]) => {
      list.push({
        id1: fromId,
        id2: toId,
        status,
        description: memo || '',
        order: orderCounter++,
      });
    });

    return list;
  }, [data.relations, data.influences]);

  // 통합 리스트 → 분리된 relations/influences 배열로 변환 (order 기준 정렬 후 분리)
  const convertToSeparateArrays = useCallback((list: RelationData[]) => {
    const relations: [number, number, AIRelationStatus, string][] = [];
    const influences: [
      number,
      number,
      AIInfluenceStatus,
      string | undefined,
    ][] = [];

    // order 기준 정렬 후 분리
    const sorted = [...list].sort((a, b) => a.order - b.order);
    sorted.forEach((item) => {
      if (isInfluenceStatus(item.status)) {
        influences.push([
          item.id1,
          item.id2,
          item.status as AIInfluenceStatus,
          item.description || undefined,
        ]);
      } else {
        relations.push([
          item.id1,
          item.id2,
          item.status as AIRelationStatus,
          item.description,
        ]);
      }
    });

    return { relations, influences };
  }, []);

  const handleRelationUpdate = useCallback(
    (index: number, updated: RelationData) => {
      const newList = [...relationDataList];
      newList[index] = updated;
      const { relations, influences } = convertToSeparateArrays(newList);
      onChange({ ...data, relations, influences });
    },
    [data, onChange, relationDataList, convertToSeparateArrays]
  );

  const handleRelationDelete = useCallback(
    (index: number) => {
      const newList = relationDataList.filter((_, i) => i !== index);
      const { relations, influences } = convertToSeparateArrays(newList);
      onChange({ ...data, relations, influences });
    },
    [data, onChange, relationDataList, convertToSeparateArrays]
  );

  const handleAddRelation = useCallback(() => {
    if (data.subjects.length < 2) return;

    const maxOrder =
      relationDataList.length > 0
        ? Math.max(...relationDataList.map((r) => r.order))
        : -1;

    const newRelation: RelationData = {
      id1: data.subjects[0].id,
      id2: data.subjects[1].id,
      description: '',
      status: 'Connected',
      order: maxOrder + 1,
    };
    const newList = [...relationDataList, newRelation];
    const { relations, influences } = convertToSeparateArrays(newList);
    onChange({ ...data, relations, influences });

    // 새로 추가된 카드를 편집 모드로 설정
    setEditingRelationIndex(relationDataList.length);
  }, [data, onChange, relationDataList, convertToSeparateArrays]);

  return (
    <div className="flex h-full flex-col overflow-hidden">
      {/* 스크롤 가능한 컨텐츠 영역 - 스크롤바 6px 보정 */}
      <div
        ref={scrollContainerRef}
        className="relative min-h-0 flex-1 overflow-y-auto rounded-lg bg-surface-contrast pl-6 pr-[18px]"
      >
        {/* 구성원 섹션 */}
        <div className="my-6">
          <h3 className="mb-3 text-sm font-medium text-fg">
            가족 구성원 ({data.subjects.length}명)
          </h3>

          {/* 카드 그리드 */}
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            {data.subjects.map((subject, index) => (
              <FamilyMemberCard
                key={subject.id}
                subject={subject}
                index={index}
                relations={extractRelations(subject.id, data)}
                allSubjects={data.subjects}
                onUpdate={handleSubjectUpdate}
                onAddRelation={handleAddFamilyRelation}
                onRemoveRelation={handleRemoveFamilyRelation}
                onDelete={(id) => {
                  handleDeleteSubject(id);
                  setEditingMemberIndex(null);
                }}
                portalContainer={scrollContainerRef.current}
                isEditing={editingMemberIndex === index}
                onEditChange={(isEditing) =>
                  setEditingMemberIndex(isEditing ? index : null)
                }
              />
            ))}
            {/* 구성원 추가 더미 카드 */}
            <AddMemberCard
              onClick={handleAddSubject}
              disabled={isAddDisabled}
            />
          </div>
        </div>

        {/* 구성원 관계 섹션 */}
        <div className="border-t border-border pt-4">
          <h3 className="mb-3 text-sm font-medium text-fg">
            구성원 관계 ({relationDataList.length}개)
          </h3>

          {/* 관계 카드 목록 */}
          <div className="space-y-3 pb-4">
            {relationDataList.map((rel, index) => (
              <RelationCard
                key={`relation-${rel.order}`}
                data={rel}
                subjectMap={subjectMap}
                allSubjects={data.subjects}
                onUpdate={(updated) => handleRelationUpdate(index, updated)}
                onDelete={() => {
                  handleRelationDelete(index);
                  setEditingRelationIndex(null);
                }}
                isEditing={editingRelationIndex === index}
                onEditChange={(isEditing) =>
                  setEditingRelationIndex(isEditing ? index : null)
                }
              />
            ))}
            {/* 관계 추가 더미 카드 (구성원 2명 이상일 때만) */}
            {data.subjects.length >= 2 && (
              <AddRelationCard
                onClick={handleAddRelation}
                disabled={isAddDisabled}
              />
            )}
          </div>
        </div>
      </div>

      {/* 하단 고정 버튼 */}
      <div className="mt-4 flex shrink-0 justify-center pt-4">
        <button
          onClick={() => setShowConfirmModal(true)}
          className="h-12 w-full max-w-[500px] rounded-xl bg-primary text-lg font-medium text-white transition-colors hover:bg-primary-600"
        >
          가계도 자동 생성하기
        </button>
      </div>

      {/* 생성 확인 모달 */}
      <GenerationConfirmModal
        isOpen={showConfirmModal}
        hasUnsavedChanges={hasUnsavedChanges}
        onClose={() => setShowConfirmModal(false)}
        onConfirm={() => {
          setShowConfirmModal(false);
          onNext();
        }}
      />
    </div>
  );
}

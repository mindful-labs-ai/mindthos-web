/**
 * 클라이언트 분석 생성 모달
 */

import React from 'react';

import {
  closestCenter,
  DndContext,
  type DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  restrictToFirstScrollableAncestor,
  restrictToVerticalAxis,
} from '@dnd-kit/modifiers';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';

import { Title } from '@/components/ui';
import { Button } from '@/components/ui/atoms/Button';
import { Text } from '@/components/ui/atoms/Text';
import { Modal } from '@/components/ui/composites/Modal';
import type { SelectItem } from '@/components/ui/composites/Select';
import { Select } from '@/components/ui/composites/Select';
import type { Session } from '@/feature/session/types';

import type { ClientTemplateGroups } from '../types/clientAnalysis.types';

import { SortableSessionCard } from './SortableSessionCard';

interface CreateAnalysisModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  templates: ClientTemplateGroups | undefined;
  sessions: Session[];
  onCreateAnalysis: (data: {
    sessionIds: string[];
    aiSupervisionTemplateId: number;
  }) => Promise<void>;
}

export const CreateAnalysisModal: React.FC<CreateAnalysisModalProps> = ({
  open,
  onOpenChange,
  templates,
  sessions,
  onCreateAnalysis,
}) => {
  const [orderedSessionIds, setOrderedSessionIds] = React.useState<string[]>(
    []
  );
  const [aiSupervisionTemplateId, setAiSupervisionTemplateId] =
    React.useState<string>('1');
  const [isCreating, setIsCreating] = React.useState(false);

  // 성공한 세션만 필터링
  const availableSessions = React.useMemo(
    () =>
      sessions.filter(
        (session) =>
          session.processing_status === 'succeeded' &&
          session.client_id !== null
      ),
    [sessions]
  );

  // 모달이 열릴 때 모든 세션을 기본 선택 (최신순)
  React.useEffect(() => {
    if (open) {
      setOrderedSessionIds([...availableSessions].reverse().map((s) => s.id));
    }
  }, [open, availableSessions]);

  // 현재 순서대로 세션 객체 배열
  const orderedSessions = React.useMemo(
    () =>
      orderedSessionIds
        .map((id) => availableSessions.find((s) => s.id === id))
        .filter((s): s is Session => s !== undefined),
    [orderedSessionIds, availableSessions]
  );

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setOrderedSessionIds((items) => {
        const oldIndex = items.indexOf(active.id as string);
        const newIndex = items.indexOf(over.id as string);

        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  const handleRemoveSession = (sessionId: string) => {
    setOrderedSessionIds((prev) => prev.filter((id) => id !== sessionId));
  };

  const handleClose = () => {
    if (!isCreating) {
      onOpenChange(false);
      setTimeout(() => {
        setOrderedSessionIds([]);
        setAiSupervisionTemplateId('1');
      }, 300);
    }
  };

  const handleCreateAnalysis = async () => {
    if (orderedSessionIds.length === 0 || !aiSupervisionTemplateId) {
      return;
    }

    setIsCreating(true);
    try {
      await onCreateAnalysis({
        sessionIds: orderedSessionIds,
        aiSupervisionTemplateId: Number(aiSupervisionTemplateId),
      });
      handleClose();
    } catch (error) {
      console.error('Failed to create analysis:', error);
    } finally {
      setIsCreating(false);
    }
  };

  // AI 수퍼비전 템플릿 아이템
  const aiSupervisionItems: SelectItem[] =
    templates?.ai_supervision.map((t) => ({
      value: String(t.id),
      label: t.name,
    })) || [];

  const canSubmit =
    orderedSessionIds.length > 0 &&
    aiSupervisionTemplateId !== '' &&
    !isCreating;

  React.useEffect(() => {
    setAiSupervisionTemplateId('1');
  }, [templates]);

  return (
    <Modal
      className="flex h-[788px] max-w-[670px] flex-col"
      open={open}
      onOpenChange={handleClose}
    >
      {/* 상단 콘텐츠 영역 */}
      <div className="flex min-h-0 flex-1 flex-col gap-6 overflow-hidden p-6 pb-0">
        {/* 헤더 */}
        <div className="text-center">
          <Title as="h3" className="text-xl font-bold">
            클라이언트 분석하기
          </Title>
        </div>

        {/* 분석 기법 선택 */}
        <div className="flex items-center justify-between border-b border-border pb-4">
          <Text className="text-base font-medium text-fg">분석 기법</Text>
          <div className="w-32">
            <Select
              items={aiSupervisionItems}
              value={aiSupervisionTemplateId}
              onChange={(value) => setAiSupervisionTemplateId(value as string)}
              placeholder="선택"
              disabled={aiSupervisionItems.length === 0}
              maxDropdownHeight={120}
              className="truncate"
            />
          </div>
        </div>

        {/* 세션 선택 섹션 */}
        <div className="flex min-h-0 flex-1 flex-col gap-y-7">
          <div className="flex items-center justify-between">
            <Text className="text-base font-medium text-fg">
              분석에 반영할 상담 기록 선택
            </Text>
            <Text className="text-sm font-medium text-primary">
              총 {orderedSessionIds.length}회기 선택됨
            </Text>
          </div>

          {availableSessions.length === 0 ? (
            <div className="flex min-h-[200px] items-center justify-center rounded-lg border-2 border-dashed border-border bg-surface">
              <Text className="text-center text-fg-muted">
                분석 가능한 상담기록이 없습니다.
                <br />
                완료된 상담기록이 필요합니다.
              </Text>
            </div>
          ) : (
            <div className="min-h-0 flex-1 overflow-clip">
              <div className="h-full overflow-y-auto">
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={handleDragEnd}
                  modifiers={[
                    restrictToVerticalAxis,
                    restrictToFirstScrollableAncestor,
                  ]}
                >
                  <SortableContext
                    items={orderedSessionIds}
                    strategy={verticalListSortingStrategy}
                  >
                    <div className="space-y-3">
                      {orderedSessions.map((session, index) => (
                        <div
                          key={session.id}
                          className="flex items-center gap-3"
                        >
                          <span className="w-6 text-center text-sm text-fg-muted">
                            {index + 1}
                          </span>
                          <div className="flex-1">
                            <SortableSessionCard
                              session={session}
                              index={index}
                              onRemove={handleRemoveSession}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </SortableContext>
                </DndContext>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 하단 고정 영역 */}
      <div className="shrink-0 p-6 pt-0">
        <div className="flex items-center justify-center gap-2 rounded-lg py-3">
          <div className="flex items-center gap-1 rounded-full bg-primary-200 px-2 py-0.5">
            <span className="text-lg font-bold text-success">50</span>
            <div className="flex h-5 w-5 items-center justify-center rounded-full bg-success text-xs font-bold text-white">
              C
            </div>
          </div>
          <span className="text-sm font-medium text-fg">사용</span>
        </div>

        {/* 분석하기 버튼 */}
        <Button
          variant="solid"
          tone="primary"
          size="lg"
          onClick={handleCreateAnalysis}
          disabled={!canSubmit}
          className="w-full"
        >
          {isCreating ? '분석 중...' : '분석하기'}
        </Button>
      </div>
    </Modal>
  );
};

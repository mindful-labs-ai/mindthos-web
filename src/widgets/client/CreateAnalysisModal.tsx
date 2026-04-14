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

import type { ClientTemplateGroups } from '@/features/client/types/clientAnalysis.types';
import type { Session } from '@/features/session/types';
import { trackEvent } from '@/lib/mixpanel';
import { MixpanelEvent } from '@/shared/constants/mixpanelEvents';
import { useDevice } from '@/shared/hooks/useDevice';
import { CreditIcon } from '@/shared/icons';
import { Title } from '@/shared/ui';
import { BackButton } from '@/shared/ui/atoms/BackButton';
import { Button } from '@/shared/ui/atoms/Button';
import { Text } from '@/shared/ui/atoms/Text';
import { Modal } from '@/shared/ui/composites/Modal';
import type { SelectItem } from '@/shared/ui/composites/Select';
import { Select } from '@/shared/ui/composites/Select';

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
  const { isMobile, isTablet } = useDevice();
  const isMobileView = isMobile || isTablet;
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
      trackEvent(MixpanelEvent.ClientAnalysisModalOpen);
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
    trackEvent(MixpanelEvent.ClientAnalysisSessionSelect, {
      session_id: sessionId,
    });
    setOrderedSessionIds((prev) => prev.filter((id) => id !== sessionId));
  };

  const handleClose = () => {
    if (!isCreating) {
      trackEvent(MixpanelEvent.ClientAnalysisModalClose);
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

  // 공통: 세션 리스트
  const sessionListContent =
    availableSessions.length === 0 ? (
      <div className="flex min-h-[200px] items-center justify-center rounded-lg border-2 border-dashed border-grey-30">
        <Text className="text-center text-grey-60">
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
                  <div key={session.id} className="flex items-center gap-3">
                    <span className="w-6 text-center text-m font-medium text-grey-100">
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
    );

  // 공통: 하단 크레딧 + 버튼
  const bottomSection = (
    <div className={isMobileView ? 'shrink-0 px-4 pb-4' : 'shrink-0 p-6 pt-0'}>
      <div className="flex items-center justify-center py-3">
        <div className="flex items-center justify-center gap-1 rounded-md bg-green-20 px-1.5 py-1">
          <span className="text-m font-medium text-green-80">50</span>
          <CreditIcon size={14} />
          <span className="text-m font-medium text-green-80">사용</span>
        </div>
      </div>
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
  );

  // 공통: 분석 기법 + 세션 선택
  const formContent = (
    <>
      <div className="flex items-center justify-between border-b border-grey-30 pb-4">
        <p className="text-m font-medium text-grey-100">분석 기법</p>
        <div className="w-32">
          <Select
            items={aiSupervisionItems}
            value={aiSupervisionTemplateId}
            onChange={(value) => {
              trackEvent(MixpanelEvent.ClientAnalysisTemplateSelect, {
                template_id: value,
              });
              setAiSupervisionTemplateId(value as string);
            }}
            placeholder="선택"
            disabled={aiSupervisionItems.length === 0}
            maxDropdownHeight={120}
            className="truncate"
          />
        </div>
      </div>

      <div className="flex min-h-0 flex-1 flex-col gap-y-5">
        <div className="flex items-center justify-between">
          <p className="text-m font-medium text-grey-100">
            분석에 반영할 상담 기록 선택
          </p>
          <p className="text-sm font-medium text-green-80">
            총 {orderedSessionIds.length}회기 선택됨
          </p>
        </div>
        {sessionListContent}
      </div>
    </>
  );

  return (
    <Modal
      className={
        isMobileView ? 'flex flex-col' : 'flex h-[788px] max-w-[670px] flex-col'
      }
      open={open}
      onOpenChange={handleClose}
      mobileVariant={isMobileView ? 'fullScreen' : 'center'}
      hideCloseButton={isMobileView}
    >
      {/* 헤더 */}
      {isMobileView ? (
        <div className="flex h-[67px] items-center gap-3 border-b border-grey-30 px-4 py-3">
          <BackButton onClick={handleClose} />
          <p className="text-m font-medium text-grey-100">
            클라이언트 분석하기
          </p>
        </div>
      ) : (
        <div className="p-6 pb-0 text-center">
          <Title as="h3" className="text-xl font-headline text-grey-100">
            클라이언트 분석하기
          </Title>
        </div>
      )}

      {/* 콘텐츠 */}
      <div
        className={
          isMobileView
            ? 'flex min-h-0 flex-1 flex-col gap-6 overflow-y-auto px-4 py-6 md:px-10'
            : 'flex min-h-0 flex-1 flex-col gap-6 overflow-hidden p-6 pb-0'
        }
      >
        {formContent}
      </div>

      {/* 하단 */}
      {bottomSection}
    </Modal>
  );
};

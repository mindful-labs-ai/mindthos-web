/**
 * 클라이언트 분석 생성 모달
 */

import React from 'react';

import { Title } from '@/components/ui';
import { Button } from '@/components/ui/atoms/Button';
import { Text } from '@/components/ui/atoms/Text';
import { Modal } from '@/components/ui/composites/Modal';
import type { SelectItem } from '@/components/ui/composites/Select';
import { Select } from '@/components/ui/composites/Select';
import type { Session } from '@/feature/session/types';
import { cn } from '@/lib/cn';

import type { ClientTemplateGroups } from '../types/clientAnalysis.types';

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
  const [selectedSessionIds, setSelectedSessionIds] = React.useState<string[]>(
    []
  );
  const [aiSupervisionTemplateId, setAiSupervisionTemplateId] =
    React.useState<string>('');
  const [isCreating, setIsCreating] = React.useState(false);
  const [selectAll, setSelectAll] = React.useState(false);

  // 성공한 세션만 필터링
  const availableSessions = sessions.filter(
    (session) =>
      session.processing_status === 'succeeded' && session.client_id !== null
  );

  const handleClose = () => {
    if (!isCreating) {
      onOpenChange(false);
      setTimeout(() => {
        setSelectedSessionIds([]);
        setAiSupervisionTemplateId('');
        setSelectAll(false);
      }, 300);
    }
  };

  const handleSessionToggle = (sessionId: string) => {
    setSelectedSessionIds((prev) =>
      prev.includes(sessionId)
        ? prev.filter((id) => id !== sessionId)
        : [...prev, sessionId]
    );
  };

  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedSessionIds([]);
    } else {
      setSelectedSessionIds(availableSessions.map((s) => s.id));
    }
    setSelectAll(!selectAll);
  };

  const handleCreateAnalysis = async () => {
    if (selectedSessionIds.length === 0 || !aiSupervisionTemplateId) {
      return;
    }

    setIsCreating(true);
    try {
      await onCreateAnalysis({
        sessionIds: selectedSessionIds,
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
    selectedSessionIds.length > 0 &&
    aiSupervisionTemplateId !== '' &&
    !isCreating;

  return (
    <Modal className="max-w-lg" open={open} onOpenChange={handleClose}>
      <div className="space-y-6 p-6">
        {/* 헤더 */}
        <div className="text-center">
          <Title as="h3" className="text-xl font-bold">
            AI 수퍼비전
          </Title>
        </div>

        {/* 세션 선택 섹션 - 스크롤 가능 */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Text className="text-sm font-medium text-fg">
              수퍼비전 받을 상담 기록 선택
            </Text>
            <button
              type="button"
              onClick={handleSelectAll}
              className="hover:bg-primary/5 rounded-lg border border-primary bg-white px-4 py-2 text-sm font-medium text-primary transition-colors"
            >
              전체 선택
            </button>
          </div>

          {availableSessions.length === 0 ? (
            <div className="flex min-h-[200px] items-center justify-center rounded-lg border-2 border-dashed border-border bg-surface">
              <Text className="text-center text-fg-muted">
                분석 가능한 세션이 없습니다.
                <br />
                완료된 세션이 필요합니다.
              </Text>
            </div>
          ) : (
            <div className="max-h-[300px] overflow-y-auto">
              <div className="grid grid-cols-2 gap-3">
                {availableSessions.map((session) => {
                  const isSelected = selectedSessionIds.includes(session.id);
                  return (
                    <button
                      key={session.id}
                      type="button"
                      onClick={() => handleSessionToggle(session.id)}
                      className={cn(
                        'relative rounded-lg border-2 p-4 text-left transition-all',
                        isSelected
                          ? 'bg-primary/5 border-primary'
                          : 'hover:border-primary/50 border-border bg-surface'
                      )}
                    >
                      {/* 체크 아이콘 */}
                      <div
                        className={cn(
                          'absolute right-3 top-3 flex h-6 w-6 items-center justify-center rounded-full',
                          isSelected ? 'bg-primary' : 'bg-border'
                        )}
                      >
                        {isSelected && (
                          <svg
                            className="h-4 w-4 text-white"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={3}
                              d="M5 13l4 4L19 7"
                            />
                          </svg>
                        )}
                      </div>

                      {/* 세션 정보 */}
                      <div className="pr-8">
                        <div className="mb-1 font-medium text-fg">
                          {session.title || '제목 없는 세션'}
                        </div>
                        <div className="text-xs text-fg-muted">
                          {new Date(session.created_at).toLocaleDateString(
                            'ko-KR',
                            {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            }
                          )}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* 분석 기법 선택 - overflow 밖에 위치 */}
        <div className="space-y-2">
          <Text className="text-sm font-medium text-fg">적용 이론</Text>
          <Select
            items={aiSupervisionItems}
            value={aiSupervisionTemplateId}
            onChange={(value) => setAiSupervisionTemplateId(value as string)}
            placeholder="이론 감지(자동)"
            disabled={aiSupervisionItems.length === 0}
            maxDropdownHeight={120}
          />
        </div>

        {/* 크레딧 정보 */}
        <div>
          <div className="flex items-center justify-center gap-2 rounded-lg py-3">
            <div className="flex items-center gap-1">
              <span className="text-lg font-bold text-success">92</span>
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
      </div>
    </Modal>
  );
};

import React from 'react';

import type { Session, SessionRecord } from '@/features/session/types';
import { Badge } from '@/shared/ui/atoms/Badge';
import { AddClientModal } from '@/widgets/client/AddClientModal';
import { ClientAnalysisTab } from '@/widgets/client/ClientAnalysisTab';
import { CreateAnalysisModal } from '@/widgets/client/CreateAnalysisModal';
import { SessionRecordCard } from '@/widgets/session/SessionRecordCard';

import type { Client } from '../types';
import type {
  ClientAnalysisVersion,
  ClientTemplateGroups,
} from '../types/clientAnalysis.types';

export interface ClientDetailViewProps {
  client: Client;
  isDummyFlow: boolean;
  isReadOnly: boolean;
  activeTab: 'history' | 'analyze';
  onTabChange: (tab: 'history' | 'analyze') => void;
  sessionRecords: SessionRecord[];
  displayAnalyses: ClientAnalysisVersion[];
  isLoadingAnalyses: boolean;
  pollingVersion: number | null;
  templates: ClientTemplateGroups | undefined;
  sessions: Session[];
  isEditModalOpen: boolean;
  isAnalysisModalOpen: boolean;
  onEditModalOpen: (open: boolean) => void;
  onSetAnalysisModalOpen: (open: boolean) => void;
  onSessionClick: (record: SessionRecord) => void;
  onEditClientClick: () => void;
  onCreateAnalysis: (data: {
    sessionIds: string[];
    aiSupervisionTemplateId: number;
  }) => Promise<void>;
  onOpenCreateAnalysis: () => void;
  onSaveAnalysisContent: (analysisId: string, content: string) => Promise<void>;
}

export const ClientDetailView: React.FC<ClientDetailViewProps> = ({
  client,
  isDummyFlow,
  isReadOnly,
  activeTab,
  onTabChange,
  sessionRecords,
  displayAnalyses,
  isLoadingAnalyses,
  pollingVersion,
  templates,
  sessions,
  isEditModalOpen,
  isAnalysisModalOpen,
  onEditModalOpen,
  onSetAnalysisModalOpen,
  onSessionClick,
  onEditClientClick,
  onCreateAnalysis,
  onOpenCreateAnalysis,
  onSaveAnalysisContent,
}) => {
  return (
    <div className="mx-auto flex h-full w-full max-w-[1332px] flex-col">
      {/* 헤더 */}
      <div className="flex-shrink-0 px-16 pt-[42px]">
        <div className="mb-4 flex items-start justify-between">
          <div className="flex items-end gap-3">
            <h1 className="text-2xl font-bold text-fg">{client.name} </h1>
            <span className="text-xl font-semibold text-fg-muted">
              총 {sessionRecords.length}개의 상담 기록
            </span>
            {isDummyFlow && (
              <Badge tone="warning" variant="soft" size="sm">
                예시
              </Badge>
            )}
          </div>
        </div>
      </div>

      {/* 탭 */}
      <div className="flex-shrink-0 px-12">
        <div className="flex justify-center gap-8">
          <button
            onClick={() => onTabChange('analyze')}
            className={`relative px-1 py-4 text-lg font-medium transition-colors ${
              activeTab === 'analyze'
                ? 'text-fg'
                : 'text-fg-muted hover:text-fg'
            }`}
          >
            다회기 분석
            <div
              className={`absolute bottom-2 right-0 h-0.5 bg-fg transition-all ${activeTab === 'analyze' ? 'w-full' : 'w-0'}`}
            />
          </button>
          <button
            onClick={() => onTabChange('history')}
            className={`relative px-1 py-4 text-lg font-medium transition-colors ${
              activeTab === 'history'
                ? 'text-fg'
                : 'text-fg-muted hover:text-fg'
            }`}
          >
            상담 기록 및 정보
            <div
              className={`absolute bottom-2 left-0 h-0.5 bg-fg transition-all ${activeTab === 'history' ? 'w-full' : 'w-0'}`}
            />
          </button>
        </div>
      </div>

      {/* 컨텐츠 */}
      <div className="min-h-0 flex-1 overflow-hidden">
        {activeTab === 'history' ? (
          <div className="h-full overflow-y-auto overflow-x-hidden">
            <div className="grid grid-cols-[1fr_400px] gap-6 px-12 py-6">
              {/* 왼쪽: 세션 목록 */}
              <div className="min-w-0">
                {sessionRecords.length > 0 ? (
                  <div className="space-y-3">
                    {sessionRecords.map((record) => (
                      <SessionRecordCard
                        key={record.session_id}
                        record={record}
                        isReadOnly={isReadOnly}
                        onClick={onSessionClick}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="flex min-h-[300px] items-center justify-center rounded-lg border border-border bg-surface">
                    <p className="text-fg-muted">상담 기록이 없습니다.</p>
                  </div>
                )}
              </div>

              {/* 우측: 클라이언트 정보 */}
              <div className="sticky top-0 h-fit">
                <div className="rounded-lg border border-border bg-surface p-6 text-left">
                  <div className="mb-4 flex items-center justify-between">
                    <h2 className="text-sm text-fg-muted">클라이언트 정보</h2>
                    <button
                      onClick={onEditClientClick}
                      className="rounded-md border border-border px-2.5 py-0.5 text-sm text-fg-muted transition-colors hover:text-fg"
                    >
                      편집
                    </button>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <p className="mb-1 text-sm font-semibold text-fg">이름</p>
                      <p className="text-sm text-fg">{client.name}</p>
                    </div>
                    <div>
                      <p className="mb-1 text-sm font-semibold text-fg">
                        휴대폰 번호
                      </p>
                      <p className="text-sm text-fg">{client.phone_number}</p>
                    </div>
                    <div>
                      <p className="mb-1 text-sm font-semibold text-fg">
                        이메일 주소
                      </p>
                      <p className="text-sm text-fg">{client.email || '-'}</p>
                    </div>
                    <div>
                      <p className="mb-1 text-sm font-semibold text-fg">
                        상담 주제
                      </p>
                      <p className="text-sm text-fg">
                        {client.counsel_theme || '-'}
                      </p>
                    </div>
                    <div>
                      <p className="mb-1 text-sm font-semibold text-fg">
                        회기 수
                      </p>
                      <p className="text-sm text-fg">
                        {client.counsel_number || '- '}회기
                      </p>
                    </div>
                    <div>
                      <p className="mb-1 text-sm font-semibold text-fg">메모</p>
                      <p className="text-sm text-fg">{client.memo || '-'}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex h-full flex-col overflow-hidden px-12 py-6">
            <ClientAnalysisTab
              analyses={displayAnalyses}
              isLoading={isLoadingAnalyses}
              pollingVersion={pollingVersion}
              isReadOnly={isReadOnly}
              onSaveContent={onSaveAnalysisContent}
              onCreateAnalysis={onOpenCreateAnalysis}
            />
          </div>
        )}
      </div>

      {/* 클라이언트 수정 모달 */}
      <AddClientModal
        open={isEditModalOpen}
        onOpenChange={onEditModalOpen}
        initialData={client}
      />

      {/* 클라이언트 분석 모달 */}
      <CreateAnalysisModal
        open={isAnalysisModalOpen}
        onOpenChange={onSetAnalysisModalOpen}
        templates={templates}
        sessions={sessions}
        onCreateAnalysis={onCreateAnalysis}
      />
    </div>
  );
};

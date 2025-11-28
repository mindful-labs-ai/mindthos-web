import React from 'react';

import { Button, Card, Text, Title } from '@/components/ui';
import type { SessionProcessingStatus } from '@/feature/session/types';

export interface SessionCardProps {
  title: string;
  content: string;
  date: string;
  processingStatus?: SessionProcessingStatus;
  progressPercentage?: number;
  currentStep?: string;
  onClick?: () => void;
}

export const SessionCard: React.FC<SessionCardProps> = ({
  title,
  content,
  date,
  processingStatus,
  progressPercentage,
  currentStep,
  onClick,
}) => {
  const getStatusBadge = () => {
    if (!processingStatus || processingStatus === 'succeeded') return null;

    const statusConfig = {
      pending: { label: '대기 중', className: 'bg-surface-strong text-fg-muted' },
      transcribing: { label: '전사 중', className: 'bg-primary-100 text-primary-700' },
      generating_note: { label: '노트 생성 중', className: 'bg-primary-100 text-primary-700' },
      failed: { label: '실패', className: 'bg-danger-100 text-danger-700' },
    };

    const config = statusConfig[processingStatus];

    return (
      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${config.className}`}>
        {config.label}
      </span>
    );
  };

  const isProcessing = processingStatus && processingStatus !== 'succeeded' && processingStatus !== 'failed';
  const isClickable = !processingStatus || processingStatus === 'succeeded';

  return (
    <Card
      className={`transition-all ${isClickable ? 'cursor-pointer hover:shadow-lg' : 'cursor-not-allowed opacity-75'}`}
      onClick={isClickable ? onClick : undefined}
    >
      <Card.Body className="space-y-3 p-6">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <Title as="h3" className="text-base font-semibold">
              {title}
            </Title>
            {getStatusBadge()}
          </div>
          <Button
            variant="ghost"
            size="sm"
            tone="primary"
            onClick={(e) => {
              e.stopPropagation();
              console.log('마음토스 상담 노트 클릭');
            }}
            disabled={!isClickable}
          >
            마음토스 상담 노트
          </Button>
        </div>

        {/* 진행 중일 때 프로그레스 바 표시 */}
        {isProcessing && progressPercentage !== undefined && (
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Text className="text-xs text-fg-muted">{currentStep || '처리 중...'}</Text>
              <Text className="text-xs font-medium text-primary-700">{progressPercentage}%</Text>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-surface-strong">
              <div
                className="h-full bg-primary-500 transition-all duration-300 ease-out"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
          </div>
        )}

        <Text className="line-clamp-2 text-sm text-fg-muted">{content}</Text>
        <Text className="text-xs text-fg-muted">{date}</Text>
      </Card.Body>
    </Card>
  );
};

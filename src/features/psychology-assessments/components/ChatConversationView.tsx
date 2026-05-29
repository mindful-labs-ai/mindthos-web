import { useEffect, useMemo, useRef, useState } from 'react';

import { cn } from '@/lib/cn';
import { useDevice } from '@/shared/hooks/useDevice';
import { CheckIcon, CopyIcon, RetryIcon } from '@/shared/icons';
import { MarkdownRenderer } from '@/shared/ui/composites/MarkdownRenderer';
import { stripMarkdown } from '@/shared/utils/stripMarkdown';

export interface ChatTurn {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  /** 서버 ClientChatMessage id — assistant 턴에 대해 재시도에 사용. */
  messageId?: string;
  /** assistant 턴 상태. 'failed'면 재시도 버튼 노출. */
  status?: 'sending' | 'ok' | 'failed';
}

interface ChatConversationViewProps {
  turns: ChatTurn[];
  /** 실패한 assistant 턴의 재시도 핸들러. (id = turn.id) */
  onRetry?: (turnId: string) => void;
  /** 재시도 진행 중인 turn.id */
  retryingId?: string | null;
  className?: string;
}

/**
 * 임시 평가용 대화 뷰. AI-chatbot-layer result(markdown)를 실제 채팅 UI 맥락에서
 * 렌더링한다. 정성 평가가 끝나면 제거 대상.
 */
export const ChatConversationView = ({
  turns,
  onRetry,
  retryingId,
  className,
}: ChatConversationViewProps) => {
  const { isMobile, isTablet } = useDevice();
  const isMobileView = isMobile || isTablet;
  const bottomRef = useRef<HTMLDivElement>(null);

  // 복사 완료 피드백 — 복사한 turn.id를 잠시 표시(체크 아이콘)
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const copyResetRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(
    () => () => {
      if (copyResetRef.current) clearTimeout(copyResetRef.current);
    },
    []
  );

  const handleCopy = (turn: ChatTurn) => {
    if (!navigator.clipboard) return;
    // 마크다운 서식(**볼드**, 헤더, 목록 기호 등)을 제거해 가독성 있는 plain text로 복사
    void navigator.clipboard
      .writeText(stripMarkdown(turn.content))
      .then(() => {
        setCopiedId(turn.id);
        if (copyResetRef.current) clearTimeout(copyResetRef.current);
        copyResetRef.current = setTimeout(() => setCopiedId(null), 1500);
      })
      .catch(() => {
        /* 클립보드 권한 거부 등 — 무시 */
      });
  };

  // 마지막 assistant 턴 — 이 응답에만 로고 표시
  const lastAssistantId = useMemo(() => {
    for (let i = turns.length - 1; i >= 0; i -= 1) {
      if (turns[i].role === 'assistant') return turns[i].id;
    }
    return null;
  }, [turns]);

  // 새 턴이 추가되면 하단으로 자동 스크롤
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [turns.length]);

  return (
    <div className={cn('flex w-full flex-col gap-8', className)}>
      {turns.map((turn) =>
        turn.role === 'user' ? (
          <div key={turn.id} className="flex justify-end">
            <div
              className={cn(
                'max-w-[80%] rounded-2xl bg-grey-20 px-4 py-3 text-grey-100',
                isMobileView ? 'text-sm' : 'text-m'
              )}
            >
              {turn.content}
            </div>
          </div>
        ) : (
          <div key={turn.id} className="flex flex-col gap-3">
            <MarkdownRenderer content={turn.content} disableHeadings={false} />

            {turn.status === 'failed' && onRetry && turn.messageId && (
              <button
                type="button"
                onClick={() => onRetry(turn.id)}
                disabled={retryingId === turn.id}
                className={cn(
                  'w-fit rounded-md border border-grey-40 px-2.5 py-1 text-xs font-medium text-grey-100 transition-colors lg:hover:bg-grey-10',
                  retryingId === turn.id && 'cursor-not-allowed opacity-50'
                )}
              >
                {retryingId === turn.id ? '재시도 중…' : '재시도'}
              </button>
            )}

            {/* 복사 + 재시도 액션 — 마지막 AI 응답이 완료(ok)일 때만 노출 (평가 버튼 제외) */}
            {turn.id === lastAssistantId &&
              turn.status === 'ok' && (
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => handleCopy(turn)}
                    className="flex h-7 w-7 items-center justify-center rounded-md text-grey-70 transition-colors lg:hover:bg-grey-10 lg:hover:text-grey-100"
                    aria-label="복사"
                  >
                    {copiedId === turn.id ? (
                      <CheckIcon size={16} />
                    ) : (
                      <CopyIcon size={16} />
                    )}
                  </button>
                  {onRetry && turn.messageId && (
                    <button
                      type="button"
                      onClick={() => onRetry(turn.id)}
                      disabled={retryingId === turn.id}
                      className={cn(
                        'flex h-7 w-7 items-center justify-center rounded-md text-grey-70 transition-colors lg:hover:bg-grey-10 lg:hover:text-grey-100',
                        retryingId === turn.id && 'cursor-not-allowed opacity-50'
                      )}
                      aria-label="재시도"
                    >
                      <RetryIcon size={16} />
                    </button>
                  )}
                </div>
              )}

            {/* 마음토스 로고 — 마지막 AI 응답에만 표시 */}
            {turn.id === lastAssistantId && (
              <img
                src="/tutorial/mindthos_agent_icon.png"
                alt="마음토스"
                className={cn(isMobileView ? 'h-9 w-9' : 'h-12 w-12')}
                draggable={false}
              />
            )}
          </div>
        )
      )}
      <div ref={bottomRef} />
    </div>
  );
};

import { useEffect, useMemo, useRef, useState } from 'react';

import { cn } from '@/lib/cn';
import { useDevice } from '@/shared/hooks/useDevice';
import { CheckIcon, CopyIcon, RetryIcon } from '@/shared/icons';
import { MarkdownRenderer } from '@/shared/ui/composites/MarkdownRenderer';
import { MindthosLoadingMark } from '@/shared/ui/composites/MindthosLoadingMark';
import { useToast } from '@/shared/ui/composites/Toast';
import { Tooltip } from '@/shared/ui/composites/Tooltip';
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
  /** 완료된 assistant 턴의 답변 다시 생성 요청 핸들러. (id = turn.id) */
  onRegenerate?: (turnId: string) => void;
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
  onRegenerate,
  retryingId,
  className,
}: ChatConversationViewProps) => {
  const { isMobile, isTablet } = useDevice();
  const { toast } = useToast();
  const isMobileView = isMobile || isTablet;
  const chatTextClassName = 'text-m';
  const actionButtonClassName = cn(
    'flex items-center justify-center rounded-md text-grey-70 transition-colors lg:hover:bg-grey-10 lg:hover:text-grey-100',
    isMobileView ? 'h-12 w-12' : 'h-7 w-7'
  );
  const actionIconSize = isMobileView ? 20 : 16;
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
    if (!navigator.clipboard) {
      toast({
        title: '복사 실패 — 다시 시도해 주세요.',
        description: '클립보드에 복사할 수 없어요.',
        duration: 3000,
      });
      return;
    }

    // 마크다운 서식(**볼드**, 헤더, 목록 기호 등)을 제거해 가독성 있는 plain text로 복사
    void navigator.clipboard
      .writeText(stripMarkdown(turn.content))
      .then(() => {
        setCopiedId(turn.id);
        toast({
          title: '복사되었습니다',
          duration: 2000,
        });
        if (copyResetRef.current) clearTimeout(copyResetRef.current);
        copyResetRef.current = setTimeout(() => setCopiedId(null), 1500);
      })
      .catch(() => {
        toast({
          title: '복사 실패 — 다시 시도해 주세요.',
          description: '클립보드에 복사할 수 없어요.',
          duration: 3000,
        });
      });
  };

  // 마지막 assistant 턴 — 이 응답에만 로고/후속 액션 표시
  const lastAssistantTurn = useMemo(() => {
    for (let i = turns.length - 1; i >= 0; i -= 1) {
      if (turns[i].role === 'assistant') return turns[i];
    }
    return null;
  }, [turns]);
  const lastAssistantId = lastAssistantTurn?.id ?? null;

  // 새 턴이 추가되거나 답변이 완료되면 하단까지 자동 스크롤
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [lastAssistantId, lastAssistantTurn?.status, turns.length]);

  return (
    <div className={cn('flex w-full flex-col gap-8', className)}>
      {turns.map((turn) =>
        turn.role === 'user' ? (
          <div key={turn.id} className="flex justify-end">
            <div
              className={cn(
                'max-w-[80%] rounded-2xl bg-grey-20 px-4 py-3 text-grey-100',
                chatTextClassName
              )}
            >
              {turn.content}
            </div>
          </div>
        ) : (
          <div key={turn.id} className="group relative flex flex-col gap-3">
            {turn.status === 'sending' ? (
              <ThinkingMessage />
            ) : (
              <MarkdownRenderer
                content={turn.content}
                disableHeadings={false}
                className={chatTextClassName}
              />
            )}

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
            {turn.id === lastAssistantId && turn.status === 'ok' && (
              <div className="flex items-center gap-1">
                <Tooltip content="복사하기" placement="top" delay={100}>
                  <button
                    type="button"
                    onClick={() => handleCopy(turn)}
                    className={actionButtonClassName}
                    aria-label="복사하기"
                  >
                    {copiedId === turn.id ? (
                      <CheckIcon size={actionIconSize} />
                    ) : (
                      <CopyIcon size={actionIconSize} />
                    )}
                  </button>
                </Tooltip>
                {onRetry && turn.messageId && (
                  <Tooltip content="재생성하기" placement="top" delay={100}>
                    <button
                      type="button"
                      onClick={() => (onRegenerate ?? onRetry)(turn.id)}
                      disabled={retryingId === turn.id}
                      className={cn(
                        actionButtonClassName,
                        retryingId === turn.id &&
                          'cursor-not-allowed opacity-50'
                      )}
                      aria-label="재생성하기"
                    >
                      <RetryIcon size={actionIconSize} />
                    </button>
                  </Tooltip>
                )}
              </div>
            )}

            {turn.id !== lastAssistantId && turn.status === 'ok' && (
              <div
                className={cn(
                  'flex items-center opacity-100 transition-opacity lg:pointer-events-none lg:absolute lg:-bottom-7 lg:left-0 lg:opacity-0 lg:focus-within:pointer-events-auto lg:focus-within:opacity-100 lg:group-hover:pointer-events-auto lg:group-hover:opacity-100',
                  isMobileView ? 'h-12' : 'h-7'
                )}
              >
                <Tooltip content="복사하기" placement="top" delay={100}>
                  <button
                    type="button"
                    onClick={() => handleCopy(turn)}
                    className={actionButtonClassName}
                    aria-label="복사하기"
                  >
                    {copiedId === turn.id ? (
                      <CheckIcon size={actionIconSize} />
                    ) : (
                      <CopyIcon size={actionIconSize} />
                    )}
                  </button>
                </Tooltip>
              </div>
            )}

            {/* 마음토스 로고 — 마지막 AI 응답에만 표시 */}
            {turn.id === lastAssistantId &&
              (turn.status === 'sending' ? (
                <MindthosLoadingMark
                  ariaLabel="답변 생성 중"
                  className="h-12 w-12"
                />
              ) : (
                <img
                  src="/tutorial/mindthos_agent_icon.png"
                  alt="마음토스"
                  className="h-12 w-12"
                  draggable={false}
                />
              ))}
          </div>
        )
      )}
      <div ref={bottomRef} />
    </div>
  );
};

function ThinkingMessage() {
  return (
    <p
      className="thinking-text-wave inline-block w-fit text-m font-medium"
      aria-live="polite"
    >
      깊게 생각하는 중...
    </p>
  );
}

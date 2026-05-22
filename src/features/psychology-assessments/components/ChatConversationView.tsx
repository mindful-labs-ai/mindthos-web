import { useEffect, useMemo, useRef } from 'react';

import { cn } from '@/lib/cn';
import { useDevice } from '@/shared/hooks/useDevice';
import { MarkdownRenderer } from '@/shared/ui/composites/MarkdownRenderer';

export interface ChatTurn {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  /** 임시 평가용: 가드레일 발동 여부 표시 */
  guardrail?: boolean;
}

interface ChatConversationViewProps {
  turns: ChatTurn[];
  className?: string;
}

/**
 * 임시 평가용 대화 뷰. AI-chatbot-layer result(markdown)를 실제 채팅 UI 맥락에서
 * 렌더링한다. 정성 평가가 끝나면 제거 대상.
 */
export const ChatConversationView = ({
  turns,
  className,
}: ChatConversationViewProps) => {
  const { isMobile, isTablet } = useDevice();
  const isMobileView = isMobile || isTablet;
  const bottomRef = useRef<HTMLDivElement>(null);

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
            {turn.guardrail && (
              <span className="bg-warning/10 text-warning inline-flex w-fit items-center gap-1 rounded-md px-2 py-0.5 text-xs font-medium">
                가드레일 발동
              </span>
            )}
            <MarkdownRenderer content={turn.content} disableHeadings={false} />

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

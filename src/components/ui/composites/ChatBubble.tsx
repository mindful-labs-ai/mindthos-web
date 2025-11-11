import React from 'react';

import { cn } from '@/lib/cn';

export interface ChatBubbleProps {
  /**
   * Avatar element
   */
  avatar?: React.ReactNode;
  /**
   * Author name
   */
  author?: string;
  /**
   * Timestamp or time element
   */
  time?: React.ReactNode;
  /**
   * Is this message from the current user
   */
  mine?: boolean;
  /**
   * Message content
   */
  children: React.ReactNode;
  /**
   * Additional className
   */
  className?: string;
}

/**
 * ChatBubble component
 *
 * Message bubble for chat interfaces.
 * Left/right alignment based on `mine` prop.
 *
 * @example
 * ```tsx
 * <ChatBubble author="John" time="2:30 PM">
 *   Hello world!
 * </ChatBubble>
 *
 * <ChatBubble mine author="You" time="2:31 PM">
 *   Hi there!
 * </ChatBubble>
 * ```
 */
export const ChatBubble: React.FC<ChatBubbleProps> = ({
  avatar,
  author,
  time,
  mine = false,
  children,
  className,
}) => {
  return (
    <div
      className={cn(
        'flex max-w-[80%] gap-3',
        mine ? 'ml-auto flex-row-reverse' : 'mr-auto',
        className
      )}
    >
      {avatar && <div className="flex-shrink-0">{avatar}</div>}
      <div className={cn('flex flex-col gap-1', mine && 'items-end')}>
        {(author || time) && (
          <div
            className={cn(
              'flex items-center gap-2 text-xs text-fg-muted',
              mine && 'flex-row-reverse'
            )}
          >
            {author && <span className="font-medium">{author}</span>}
            {time && <span>{time}</span>}
          </div>
        )}
        <div
          className={cn(
            'rounded-[var(--radius-lg)] px-4 py-2',
            mine
              ? 'rounded-br-sm bg-primary text-surface'
              : 'rounded-bl-sm bg-surface-contrast text-fg'
          )}
        >
          {children}
        </div>
      </div>
    </div>
  );
};

ChatBubble.displayName = 'ChatBubble';

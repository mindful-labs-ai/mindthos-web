import DOMPurify from 'dompurify';

import type { ContentBlock } from '@/features/settings/types/notice';

/** 인라인 스타일 파싱: **bold**, __underline__, --strikethrough-- */
const formatInlineStyles = (text: string): string =>
  DOMPurify.sanitize(
    text
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/__(.+?)__/g, '<u>$1</u>')
      .replace(/--(.+?)--/g, '<s>$1</s>')
  );

function ContentBlockItem({ block }: { block: ContentBlock }) {
  switch (block.type) {
    case 'h1':
      return <h1 className="text-2xl font-bold text-fg">{block.text}</h1>;
    case 'h2':
      return <h2 className="text-xl font-bold text-fg">{block.text}</h2>;
    case 'h3':
      return <h3 className="text-lg font-bold text-fg">{block.text}</h3>;
    case 'span':
      return (
        <p
          className="text-base leading-relaxed text-fg [&>s]:line-through [&>u]:underline"
          dangerouslySetInnerHTML={{ __html: formatInlineStyles(block.text) }}
        />
      );
    case 'image':
      return (
        <img
          src={block.src}
          alt={block.alt}
          width={block.width}
          height={block.height}
          className="rounded-xl border object-cover"
          loading="lazy"
        />
      );
    default:
      return null;
  }
}

export function NoticeContentRenderer({ blocks }: { blocks: ContentBlock[] }) {
  return (
    <div className="space-y-4">
      {blocks.map((block, index) => (
        <ContentBlockItem key={index} block={block} />
      ))}
    </div>
  );
}

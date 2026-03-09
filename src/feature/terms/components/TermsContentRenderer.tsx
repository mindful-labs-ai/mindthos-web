import DOMPurify from 'dompurify';

import type { TermsContentBlock } from '../types';

const formatInlineStyles = (text: string): string =>
  DOMPurify.sanitize(
    text
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/__(.+?)__/g, '<u>$1</u>')
  );

function ContentBlockItem({ block }: { block: TermsContentBlock }) {
  switch (block.type) {
    case 'h1':
      return <h1 className="text-2xl font-bold text-fg">{block.text}</h1>;
    case 'h2':
      return <h2 className="text-xl font-bold text-fg">{block.text}</h2>;
    case 'h3':
      return <h3 className="text-lg font-semibold text-fg">{block.text}</h3>;
    case 'span':
      return (
        <p
          className="text-base leading-relaxed text-fg [&>u]:underline"
          dangerouslySetInnerHTML={{ __html: formatInlineStyles(block.text) }}
        />
      );
    case 'list': {
      const Tag = block.ordered ? 'ol' : 'ul';
      return (
        <Tag
          className={`ml-4 space-y-1 text-base text-fg ${block.ordered ? 'list-decimal' : 'list-disc'}`}
        >
          {block.items.map((item, i) => (
            <li
              key={i}
              className="leading-relaxed"
              dangerouslySetInnerHTML={{ __html: formatInlineStyles(item) }}
            />
          ))}
        </Tag>
      );
    }
    case 'table':
      return (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse border border-border text-sm">
            <thead>
              <tr>
                {block.headers.map((header, i) => (
                  <th
                    key={i}
                    className="bg-surface-contrast/50 border border-border px-3 py-2 text-left font-semibold"
                  >
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {block.rows.map((row, ri) => (
                <tr key={ri}>
                  {row.map((cell, ci) => (
                    <td
                      key={ci}
                      className="border border-border px-3 py-2"
                      dangerouslySetInnerHTML={{
                        __html: formatInlineStyles(cell),
                      }}
                    />
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    case 'link':
      return (
        <a
          href={block.href}
          className="text-primary-500 underline hover:text-primary-600"
          target={block.href.startsWith('mailto:') ? undefined : '_blank'}
          rel="noopener noreferrer"
        >
          {block.text}
        </a>
      );
    default:
      return null;
  }
}

export function TermsContentRenderer({
  blocks,
}: {
  blocks: TermsContentBlock[];
}) {
  return (
    <div className="space-y-3">
      {blocks.map((block, index) => (
        <ContentBlockItem key={index} block={block} />
      ))}
    </div>
  );
}

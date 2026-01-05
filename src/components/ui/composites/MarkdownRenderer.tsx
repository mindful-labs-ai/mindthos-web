import React, { useMemo } from 'react';

import Markdown from 'react-markdown';
import rehypeSanitize from 'rehype-sanitize';
import remarkBreaks from 'remark-breaks';
import remarkGfm from 'remark-gfm';

import { Text } from '@/components/ui/atoms/Text';
import { Title } from '@/components/ui/atoms/Title';

interface MarkdownRendererProps {
  content: string;
  className?: string;
  disableHeadings?: boolean;
}

/**
 * 한글 마크다운 파싱 문제 해결을 위한 전처리
 * **텍스트** 뒤에 한글이 바로 붙으면 파싱이 안되는 문제 해결
 * 예: **부모 하위 체계**의 → **부모 하위 체계** 의
 */
const preprocessMarkdown = (text: string): string => {
  let result = text;

  // **텍스트**한글 → **텍스트** 한글 (닫는 ** 뒤에 한글이 바로 오면 공백 삽입)
  // 닫는 **를 구분하기 위해: 앞에 공백이 아닌 문자가 있어야 함
  result = result.replace(/([^\s])\*\*([가-힣])/g, '$1** $2');

  return result;
};

export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({
  content,
  className = '',
  disableHeadings = false,
}) => {
  const components = useMemo(() => {
    const headingComponents = disableHeadings
      ? {
          h1: ({ children }: { children?: React.ReactNode }) => (
            <Text className="mb-4 leading-relaxed text-fg">{children}</Text>
          ),
          h2: ({ children }: { children?: React.ReactNode }) => (
            <Text className="mb-4 leading-relaxed text-fg">{children}</Text>
          ),
          h3: ({ children }: { children?: React.ReactNode }) => (
            <Text className="mb-4 leading-relaxed text-fg">{children}</Text>
          ),
        }
      : {
          h1: ({ children }: { children?: React.ReactNode }) => (
            <Title
              as="h1"
              className="mb-4 mt-8 text-2xl font-bold text-fg first:mt-0"
            >
              {children}
            </Title>
          ),
          h2: ({ children }: { children?: React.ReactNode }) => (
            <Title
              as="h2"
              className="mb-3 mt-6 text-xl font-semibold text-fg first:mt-0"
            >
              {children}
            </Title>
          ),
          h3: ({ children }: { children?: React.ReactNode }) => (
            <Title
              as="h3"
              className="mb-2 mt-4 text-lg font-semibold text-fg first:mt-0"
            >
              {children}
            </Title>
          ),
        };

    return {
      ...headingComponents,
      p: ({ children }: { children?: React.ReactNode }) => (
        <Text className="mb-4 leading-relaxed text-fg">{children}</Text>
      ),
      ul: ({ children }: { children?: React.ReactNode }) => (
        <ul className="mb-4 list-disc space-y-1 pl-6 text-fg">{children}</ul>
      ),
      ol: ({ children }: { children?: React.ReactNode }) => (
        <ol className="mb-4 list-decimal space-y-1 pl-6 text-fg">{children}</ol>
      ),
      li: ({ children }: { children?: React.ReactNode }) => (
        <li className="leading-relaxed">{children}</li>
      ),
      br: () => <span className="block h-4" />,
      strong: ({ children }: { children?: React.ReactNode }) => (
        <strong className="font-semibold text-fg">{children}</strong>
      ),
      em: ({ children }: { children?: React.ReactNode }) => (
        <em className="italic text-fg">{children}</em>
      ),
      blockquote: ({ children }: { children?: React.ReactNode }) => (
        <blockquote className="mb-4 border-l-4 border-primary pl-4 italic text-fg-muted">
          {children}
        </blockquote>
      ),
      code: ({ children }: { children?: React.ReactNode }) => (
        <code className="rounded bg-surface-contrast px-1.5 py-0.5 font-mono text-sm text-fg">
          {children}
        </code>
      ),
      pre: ({ children }: { children?: React.ReactNode }) => (
        <pre className="mb-4 overflow-x-auto rounded-lg bg-surface-contrast p-4">
          {children}
        </pre>
      ),
      table: ({ children }: { children?: React.ReactNode }) => (
        <div className="mb-4 overflow-x-auto rounded-lg border border-border">
          <table className="min-w-full divide-y divide-border text-sm">
            {children}
          </table>
        </div>
      ),
      thead: ({ children }: { children?: React.ReactNode }) => (
        <thead className="bg-surface-contrast">{children}</thead>
      ),
      tbody: ({ children }: { children?: React.ReactNode }) => (
        <tbody className="divide-y divide-border bg-surface">{children}</tbody>
      ),
      tr: ({ children }: { children?: React.ReactNode }) => (
        <tr className="hover:bg-surface-contrast/50">{children}</tr>
      ),
      th: ({ children }: { children?: React.ReactNode }) => (
        <th className="whitespace-nowrap px-4 py-3 text-left font-semibold text-fg">
          {children}
        </th>
      ),
      td: ({ children }: { children?: React.ReactNode }) => (
        <td className="px-4 py-3 text-fg">{children}</td>
      ),
    };
  }, [disableHeadings]);

  if (!content) {
    return null;
  }

  return (
    <div
      className={`prose prose-sm dark:prose-invert max-w-none break-keep ${className}`}
    >
      <Markdown
        remarkPlugins={[remarkGfm, remarkBreaks]}
        rehypePlugins={[rehypeSanitize]}
        components={components}
      >
        {preprocessMarkdown(content)}
      </Markdown>
    </div>
  );
};

export default MarkdownRenderer;

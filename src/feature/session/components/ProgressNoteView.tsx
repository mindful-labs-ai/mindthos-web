import React from 'react';

import { Text } from '@/components/ui/atoms/Text';
import { Title } from '@/components/ui/atoms/Title';
import { CopyIcon, Trash2Icon } from '@/shared/icons';

import type { ProgressNote } from '../types';

interface ProgressNoteViewProps {
  note: ProgressNote;
  onCopy?: () => void;
  onDelete?: () => void;
}

export const ProgressNoteView: React.FC<ProgressNoteViewProps> = ({
  note,
  onCopy,
  onDelete,
}) => {
  // summary를 섹션별로 파싱
  const parseSummary = (summary: string) => {
    const sections: { title: string; content: string }[] = [];
    const lines = summary.split('\n');
    let currentSection: { title: string; content: string } | null = null;

    lines.forEach((line) => {
      // ## 또는 # 으로 시작하는 섹션 제목
      if (line.startsWith('##') || line.startsWith('#')) {
        if (currentSection) {
          sections.push(currentSection);
        }
        currentSection = {
          title: line.replace(/^#+\s*/, '').trim(),
          content: '',
        };
      }
      // S (Subjective): 형태의 섹션 제목 (SOAP)
      else if (
        /^[A-Z]\s*\([^)]+\):/.test(line) ||
        /^[A-Z]\s*\([^)]+\)\s*:/.test(line)
      ) {
        if (currentSection) {
          sections.push(currentSection);
        }
        currentSection = {
          title: line.split(':')[0].trim(),
          content: line.substring(line.indexOf(':') + 1).trim(),
        };
      }
      // 내용 줄
      else if (currentSection && line.trim()) {
        currentSection.content += (currentSection.content ? '\n' : '') + line;
      }
    });

    if (currentSection) {
      sections.push(currentSection);
    }

    return sections;
  };

  const sections = note.summary ? parseSummary(note.summary) : [];

  return (
    <div className="space-y-6 text-left">
      {/* 헤더 */}
      <div className="flex items-start justify-between">
        <div>
          <Title as="h2" className="text-xl font-bold">
            {note.title || '상담 노트'}
          </Title>
        </div>
        <div className="flex gap-2">
          {onCopy && (
            <button
              type="button"
              onClick={onCopy}
              className="rounded-lg p-2 text-fg-muted hover:bg-surface-contrast hover:text-fg"
              aria-label="복사"
            >
              <CopyIcon size={18} />
            </button>
          )}
          {onDelete && (
            <button
              type="button"
              onClick={onDelete}
              className="rounded-lg p-2 text-fg-muted hover:bg-surface-contrast hover:text-fg"
              aria-label="삭제"
            >
              <Trash2Icon size={18} />
            </button>
          )}
        </div>
      </div>

      {/* 섹션들 */}
      <div className="space-y-6">
        {sections.length > 0 ? (
          sections.map((section, index) => (
            <div key={index} className="space-y-2">
              <Title as="h3" className="text-base font-semibold text-fg">
                {section.title}
              </Title>
              <Text className="whitespace-pre-wrap text-sm leading-relaxed text-fg">
                {section.content}
              </Text>
            </div>
          ))
        ) : (
          <Text className="text-fg-muted">내용이 없습니다.</Text>
        )}
      </div>
    </div>
  );
};

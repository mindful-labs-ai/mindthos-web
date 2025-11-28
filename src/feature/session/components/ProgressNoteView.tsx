import React, { useState } from 'react';

import { Text } from '@/components/ui/atoms/Text';
import { Title } from '@/components/ui/atoms/Title';
import { Card } from '@/components/ui/composites/Card';
import { useToast } from '@/components/ui/composites/Toast';
import { CheckIcon, CopyIcon } from '@/shared/icons';

import type { ProgressNote } from '../types';

interface ProgressNoteViewProps {
  note: ProgressNote;
}

// 상담노트 섹션 블럭 타입
interface NoteSection {
  title: string;
  content: string;
}

export const ProgressNoteView: React.FC<ProgressNoteViewProps> = ({ note }) => {
  const { toast } = useToast();
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  // summary를 섹션별로 파싱
  const parseSummary = (summary: string): NoteSection[] => {
    const sections: NoteSection[] = [];
    const lines = summary.split('\n');
    let currentSection: NoteSection | null = null;

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

  // 클립보드에 텍스트 복사
  const handleCopy = async (content: string, index: number) => {
    try {
      await navigator.clipboard.writeText(content);
      setCopiedIndex(index);

      toast({
        title: '복사 완료',
        description: '클립보드에 내용이 복사되었습니다.',
        duration: 2000,
      });

      // 2초 후 체크 아이콘 리셋
      setTimeout(() => {
        setCopiedIndex(null);
      }, 2000);
    } catch (error) {
      console.error('복사 실패:', error);
      toast({
        title: '복사 실패',
        description: '내용을 복사하는 데 실패했습니다.',
        duration: 3000,
      });
    }
  };

  return (
    <div className="space-y-4 text-left">
      {/* 헤더 */}
      <div className="mb-6">
        <Title as="h2" className="text-xl font-bold">
          {note.title || '상담 노트'}
        </Title>
      </div>

      {/* 블럭화된 섹션들 */}
      <div className="space-y-4">
        {sections.length > 0 ? (
          sections.map((section, index) => (
            <Card key={index} className="relative overflow-visible">
              <Card.Body className="p-6">
                {/* 섹션 헤더 */}
                <div className="mb-4 flex items-start justify-between">
                  <Title as="h3" className="text-base font-semibold text-fg">
                    {section.title}
                  </Title>

                  {/* 복사 버튼 */}
                  <button
                    type="button"
                    onClick={() => handleCopy(section.content, index)}
                    className="group relative flex-shrink-0 rounded-lg p-2 text-fg-muted transition-all hover:bg-surface-contrast hover:text-fg"
                    aria-label="복사"
                  >
                    {copiedIndex === index ? (
                      <CheckIcon size={18} className="text-success" />
                    ) : (
                      <CopyIcon size={18} />
                    )}

                    {/* 툴팁 */}
                    <span className="pointer-events-none absolute -top-8 right-0 whitespace-nowrap rounded-md bg-fg px-2 py-1 text-xs text-bg opacity-0 transition-opacity group-hover:opacity-100">
                      {copiedIndex === index ? '복사됨' : '복사'}
                    </span>
                  </button>
                </div>

                {/* 섹션 내용 */}
                <Text className="whitespace-pre-wrap text-sm leading-relaxed text-fg">
                  {section.content || '내용이 없습니다.'}
                </Text>
              </Card.Body>
            </Card>
          ))
        ) : (
          <Card>
            <Card.Body className="p-6">
              <Text className="text-center text-fg-muted">내용이 없습니다.</Text>
            </Card.Body>
          </Card>
        )}
      </div>
    </div>
  );
};

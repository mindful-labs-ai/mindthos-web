import React, { useState } from 'react';

import { Text } from '@/components/ui/atoms/Text';
import { Title } from '@/components/ui/atoms/Title';
import { MarkdownRenderer } from '@/components/ui/composites/MarkdownRenderer';
import { useToast } from '@/components/ui/composites/Toast';
import { trackEvent } from '@/lib/mixpanel';
import { CheckIcon } from '@/shared/icons';
import { removeNonverbalTags } from '@/shared/utils/removeNonverbalTag';

import type { ProgressNote } from '../types';

interface ProgressNoteViewProps {
  note: ProgressNote;
  onRegenerate?: () => void;
  isRegenerating?: boolean;
  isReadOnly?: boolean;
}

// 상담노트 섹션 블럭 타입
interface NoteSection {
  title: string;
  content: string;
}

export const ProgressNoteView: React.FC<ProgressNoteViewProps> = ({
  note,
  onRegenerate,
  isRegenerating = false,
  isReadOnly = false,
}) => {
  const { toast } = useToast();
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [copiedAll, setCopiedAll] = useState(false);

  // 진행 중 또는 대기 중 상태 확인
  const isProcessing =
    note.processing_status === 'pending' ||
    note.processing_status === 'in_progress';
  const isFailed = note.processing_status === 'failed';

  // summary를 섹션별로 파싱
  const parseSummary = (summary: string): NoteSection[] => {
    const sections: NoteSection[] = [];
    // 먼저 전체 summary에서 특수 태그 제거
    const cleanedSummary = removeNonverbalTags(summary);
    const lines = cleanedSummary.split('\n');
    let currentSection: NoteSection | null = null;

    // 제목에서 ** 마크다운 볼드를 제거하는 헬퍼 함수
    const removeBoldMarkers = (text: string): string => {
      return text.replace(/\*\*/g, '').trim();
    };

    lines.forEach((line) => {
      // 마크다운 헤딩 (#, ##, ###, ####)으로 시작하는 섹션 제목
      if (/^#{1,4}\s/.test(line)) {
        if (currentSection) {
          sections.push(currentSection);
        }
        // # 제거 후 ** 볼드 마커도 제거
        const rawTitle = line.replace(/^#{1,4}\s*/, '').trim();
        currentSection = {
          title: removeBoldMarkers(rawTitle),
          content: '',
        };
      }
      // 숫자로 시작하는 섹션 제목 (예: 1. 상담 주제, 0. 적용된 상담 이론)
      // ** 유무와 관계없이 "숫자. 제목" 형태를 인식
      else if (/^\*{0,2}\d+\.\s+/.test(line)) {
        if (currentSection) {
          sections.push(currentSection);
        }
        // **와 숫자. 제거하고 제목 추출
        const rawTitle = line.replace(/^\*{0,2}\d+\.\s*/, '').trim();
        currentSection = {
          title: removeBoldMarkers(rawTitle),
          content: '',
        };
      }
      // S (Subjective): 형태의 섹션 제목 (SOAP) - 줄 시작이 정확히 이 패턴일 때만
      else if (/^[A-Z]\s*\([^)]+\)\s*:\s/.test(line)) {
        if (currentSection) {
          sections.push(currentSection);
        }
        // 첫 번째 ): 이후의 내용을 content로 사용
        const colonIndex = line.indexOf('):');
        currentSection = {
          title: line.substring(0, colonIndex + 1).trim(),
          content: line.substring(colonIndex + 2).trim(),
        };
      }
      // 내용 줄 (빈 줄도 포함하여 테이블 구조 유지)
      else if (currentSection) {
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

      trackEvent('progress_note_copy', { section_index: index });

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

  // 전체 내용 복사
  const handleCopyAll = async () => {
    if (!note.summary) return;

    try {
      await navigator.clipboard.writeText(note.summary);
      setCopiedAll(true);

      trackEvent('progress_note_copy_all');

      toast({
        title: '복사 완료',
        description: '전체 내용이 클립보드에 복사되었습니다.',
        duration: 2000,
      });

      // 2초 후 체크 아이콘 리셋
      setTimeout(() => {
        setCopiedAll(false);
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

  // 진행 중 상태 UI
  if (isProcessing) {
    return (
      <div className="space-y-4 text-left">
        {/* 헤더 */}
        <div className="mb-6 flex items-center justify-between">
          <Title as="h2" className="text-base font-bold text-fg-muted">
            {note.title || '상담 노트'}
          </Title>
        </div>

        {/* 진행 중 상태 표시 */}
        <div className="flex min-h-[400px] flex-col items-center justify-center gap-4">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-surface-strong border-t-primary"></div>
          <div className="text-center">
            <Text className="text-lg font-medium text-fg">
              상담노트 작성 중...
            </Text>
            <Text className="mt-2 text-sm text-fg-muted">
              {note.processing_status === 'pending'
                ? '대기 중입니다. 잠시만 기다려주세요.'
                : 'AI가 상담 내용을 분석하고 있습니다.'}
            </Text>
          </div>
        </div>
      </div>
    );
  }

  // 실패 상태 UI
  if (isFailed) {
    return (
      <div className="space-y-4 text-left">
        {/* 헤더 */}
        <div className="mb-6 flex items-center justify-between">
          <Title as="h2" className="text-base font-bold text-fg-muted">
            {note.title || '상담 노트'}
          </Title>
        </div>

        {/* 실패 상태 표시 */}
        <div className="flex min-h-[400px] flex-col items-center justify-center gap-4">
          <svg
            width="48"
            height="48"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="text-danger"
          >
            <path
              d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"
              fill="currentColor"
            />
          </svg>
          <div className="text-center">
            <Text className="text-lg font-medium text-danger">
              상담노트 작성 실패
            </Text>
            <Text className="mt-2 text-sm text-fg-muted">
              {note.error_message || '상담노트 작성 중 오류가 발생했습니다.'}
            </Text>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 text-left">
      {/* 헤더 */}
      <div className="mb-6 flex items-center justify-between">
        <Title as="h2" className="text-base font-bold text-fg-muted">
          {note.title || '상담 노트'}
        </Title>
        <div className="flex items-center gap-2">
          {/* 재생성 버튼 */}
          {onRegenerate && (
            <button
              type="button"
              onClick={onRegenerate}
              disabled={isReadOnly || isRegenerating}
              className={`flex items-center gap-1.5 rounded-xl border border-border bg-surface px-3 py-1.5 text-sm text-fg-muted transition-colors ${
                isReadOnly || isRegenerating
                  ? 'cursor-not-allowed opacity-50'
                  : 'hover:bg-surface-contrast'
              }`}
              aria-label="노트 재생성"
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 20 20"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className={isRegenerating ? 'animate-spin' : ''}
              >
                <path
                  d="M8.33447 13.3333H4.16781V17.5M11.6678 6.66667H15.8345V2.5M3.82031 7.50284C4.28755 6.34638 5.06984 5.3442 6.07826 4.61019C7.08669 3.87618 8.28185 3.4396 9.52593 3.35042C10.77 3.26125 12.0134 3.52284 13.1162 4.10551C14.219 4.68819 15.1355 5.56878 15.7629 6.64677M16.1824 12.4976C15.7152 13.654 14.9329 14.6562 13.9245 15.3902C12.9161 16.1242 11.7221 16.5602 10.478 16.6494C9.23395 16.7386 7.98953 16.477 6.88672 15.8944C5.78391 15.3117 4.86682 14.4313 4.23942 13.3533"
                  stroke="#A2A2A2"
                  stroke-width="1.5"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
              </svg>

              <span>{isRegenerating ? '재생성 중...' : '노트 재생성'}</span>
            </button>
          )}
          {/* 전체 복사 버튼 */}
          <button
            type="button"
            onClick={handleCopyAll}
            className="flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-fg-muted transition-all hover:bg-surface-contrast hover:text-fg"
            aria-label="전체 복사"
          >
            {copiedAll ? (
              <>
                <CheckIcon size={18} className="text-success" />
                <span className="text-success">복사됨</span>
              </>
            ) : (
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M13 4C13 4.26522 13.1054 4.51957 13.2929 4.70711C13.4804 4.89464 13.7348 5 14 5H17.966C17.8924 4.35068 17.6074 3.74354 17.155 3.272L14.871 0.913C14.3714 0.406548 13.7085 0.0933745 13 0.029V4ZM11 4V0H7C5.67441 0.00158786 4.40356 0.528882 3.46622 1.46622C2.52888 2.40356 2.00159 3.67441 2 5V15C2.00159 16.3256 2.52888 17.5964 3.46622 18.5338C4.40356 19.4711 5.67441 19.9984 7 20H13C14.3256 19.9984 15.5964 19.4711 16.5338 18.5338C17.4711 17.5964 17.9984 16.3256 18 15V7H14C13.2044 7 12.4413 6.68393 11.8787 6.12132C11.3161 5.55871 11 4.79565 11 4ZM17 24H8C7.73478 24 7.48043 23.8946 7.29289 23.7071C7.10536 23.5196 7 23.2652 7 23C7 22.7348 7.10536 22.4804 7.29289 22.2929C7.48043 22.1054 7.73478 22 8 22H17C17.7956 22 18.5587 21.6839 19.1213 21.1213C19.6839 20.5587 20 19.7956 20 19V8C20 7.73478 20.1054 7.48043 20.2929 7.29289C20.4804 7.10536 20.7348 7 21 7C21.2652 7 21.5196 7.10536 21.7071 7.29289C21.8946 7.48043 22 7.73478 22 8V19C21.9984 20.3256 21.4711 21.5964 20.5338 22.5338C19.5964 23.4711 18.3256 23.9984 17 24Z"
                  fill="#BABAC0"
                />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* 마크다운 문서 렌더링 */}
      {note.summary ? (
        <div className="relative">
          {/* 섹션별 렌더링 */}
          <div className="space-y-6">
            {sections.map((section, index) => (
              <div
                key={index}
                className="group relative rounded-lg px-2 py-1 hover:bg-surface-contrast"
              >
                {/* 섹션 헤더와 복사 버튼 */}
                <div className="mb-3 flex items-start justify-between">
                  <Title as="h3" className="text-lg font-semibold text-fg">
                    {section.title}
                  </Title>

                  {/* 복사 버튼 */}
                  <button
                    type="button"
                    onClick={() => handleCopy(section.content, index)}
                    className="relative flex-shrink-0 rounded-lg p-2 text-fg-muted opacity-0 transition-all hover:bg-surface-contrast hover:text-fg group-hover:opacity-100"
                    aria-label="복사"
                  >
                    {copiedIndex === index ? (
                      <CheckIcon size={18} className="text-success" />
                    ) : (
                      <svg
                        width="18"
                        height="18"
                        viewBox="0 0 24 24"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          d="M13 4C13 4.26522 13.1054 4.51957 13.2929 4.70711C13.4804 4.89464 13.7348 5 14 5H17.966C17.8924 4.35068 17.6074 3.74354 17.155 3.272L14.871 0.913C14.3714 0.406548 13.7085 0.0933745 13 0.029V4ZM11 4V0H7C5.67441 0.00158786 4.40356 0.528882 3.46622 1.46622C2.52888 2.40356 2.00159 3.67441 2 5V15C2.00159 16.3256 2.52888 17.5964 3.46622 18.5338C4.40356 19.4711 5.67441 19.9984 7 20H13C14.3256 19.9984 15.5964 19.4711 16.5338 18.5338C17.4711 17.5964 17.9984 16.3256 18 15V7H14C13.2044 7 12.4413 6.68393 11.8787 6.12132C11.3161 5.55871 11 4.79565 11 4ZM17 24H8C7.73478 24 7.48043 23.8946 7.29289 23.7071C7.10536 23.5196 7 23.2652 7 23C7 22.7348 7.10536 22.4804 7.29289 22.2929C7.48043 22.1054 7.73478 22 8 22H17C17.7956 22 18.5587 21.6839 19.1213 21.1213C19.6839 20.5587 20 19.7956 20 19V8C20 7.73478 20.1054 7.48043 20.2929 7.29289C20.4804 7.10536 20.7348 7 21 7C21.2652 7 21.5196 7.10536 21.7071 7.29289C21.8946 7.48043 22 7.73478 22 8V19C21.9984 20.3256 21.4711 21.5964 20.5338 22.5338C19.5964 23.4711 18.3256 23.9984 17 24Z"
                          fill="#BABAC0"
                        />
                      </svg>
                    )}

                    {/* 툴팁 */}
                    <span className="pointer-events-none absolute -top-8 right-0 whitespace-nowrap rounded-md bg-fg px-2 py-1 text-xs text-bg opacity-0 transition-opacity hover:opacity-100">
                      {copiedIndex === index ? '복사됨' : '복사'}
                    </span>
                  </button>
                </div>

                {/* 마크다운 렌더링된 내용 */}
                <MarkdownRenderer
                  content={section.content || '내용이 없습니다.'}
                  disableHeadings
                />
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="flex min-h-[200px] items-center justify-center">
          <Text className="text-center text-fg-muted">내용이 없습니다.</Text>
        </div>
      )}
    </div>
  );
};

/**
 * 축어록/직접 입력 텍스트 복사 기능 훅
 */

import { useToast } from '@/shared/ui/composites/Toast';

import type { Speaker, TranscribeSegment } from '../types';
import { getSpeakerCopyName } from '../utils/getSpeakerInfo';
import {
  createAdvancedNvRegex,
  createDeidRegex,
  createLegacyNvRegex,
  NONVERBAL_DEFAULT_LABELS,
  parseNvEntries,
  type NonverbalTagType,
} from '../utils/transcriptTags';

interface UseTranscriptCopyOptions {
  isReadOnly: boolean;
}

interface UseTranscriptCopyReturn {
  /**
   * 축어록 세그먼트를 클립보드에 복사
   */
  handleCopyTranscript: (
    segments: TranscribeSegment[],
    speakers: Speaker[],
    isAnonymized: boolean,
    showDeid?: boolean
  ) => Promise<void>;
  /**
   * 직접 입력 텍스트를 클립보드에 복사
   */
  handleCopyHandwritten: (content: string) => Promise<void>;
}

export function useTranscriptCopy({
  isReadOnly,
}: UseTranscriptCopyOptions): UseTranscriptCopyReturn {
  const { toast } = useToast();

  const handleCopyTranscript = async (
    segments: TranscribeSegment[],
    speakers: Speaker[],
    isAnonymized: boolean,
    showDeid = false
  ) => {
    if (isReadOnly) {
      toast({
        title: '읽기 전용',
        description: '실제 상담 기록에서 복사할 수 있어요.',
        duration: 3000,
      });
      return;
    }

    try {
      // 화자별 발언 카운터 (화자 ID -> 발언 횟수)
      const speakerCounters: Record<number, number> = {};

      // 세그먼트를 포맷팅: 화자별 발언 번호. 발화자 : 내용
      const formattedText = segments
        .map((segment) => {
          // 화자별 발언 카운터 증가
          const speakerId = segment.speaker;
          speakerCounters[speakerId] = (speakerCounters[speakerId] || 0) + 1;
          const speakerIndex = speakerCounters[speakerId];

          // 비언어 태그 변환
          let cleanedText = segment.text;

          // 신규 ⟪nv:KEY⟫ + nv[] 배열 처리 → (라벨)
          if (segment.nv && segment.nv.length > 0) {
            const nvMap = parseNvEntries(segment.nv);
            cleanedText = cleanedText.replace(
              createAdvancedNvRegex(),
              (_, key: string) => {
                const label = nvMap.get(key)?.label;
                return label ? `(${label})` : '';
              }
            );
          }

          // 레거시 {%X%내용%} 또는 {%X%} → (내용) / (침묵)·(겹침) / 제거
          cleanedText = cleanedText.replace(
            createLegacyNvRegex(),
            (_, tagType: string, content?: string) => {
              if (content) return `(${content})`;
              const fallback =
                NONVERBAL_DEFAULT_LABELS[tagType as NonverbalTagType];
              return fallback ? `(${fallback})` : '';
            }
          );

          // 비식별화 태그: showDeid ON이면 라벨로, OFF면 원본으로 치환
          if (showDeid && segment.deid) {
            const deidMap = segment.deid;
            cleanedText = cleanedText.replace(
              createDeidRegex(),
              (_, key: string) => `[${deidMap[key] || key}]`
            );
          } else {
            cleanedText = cleanedText.replace(createDeidRegex(), '$2');
          }

          // 익명화 모드일 경우 화자 정보 제외
          if (isAnonymized) {
            return `#${speakerIndex} : ${cleanedText}`;
          } else {
            const speakerName = getSpeakerCopyName(segment.speaker, speakers);
            return `${speakerName} #${speakerIndex} : ${cleanedText}`;
          }
        })
        .join('\n');

      await navigator.clipboard.writeText(formattedText);
      toast({
        title: '복사 완료',
        description: '축어록을 복사했어요.',
        duration: 3000,
      });
    } catch {
      toast({
        title: '복사 실패 — 다시 시도해 주세요.',
        description: '클립보드에 복사할 수 없어요.',
        duration: 3000,
      });
    }
  };

  const handleCopyHandwritten = async (content: string) => {
    if (isReadOnly) {
      toast({
        title: '읽기 전용',
        description: '실제 상담 기록에서 복사할 수 있어요.',
        duration: 3000,
      });
      return;
    }

    try {
      await navigator.clipboard.writeText(content);
      toast({
        title: '복사 완료',
        description: '입력한 텍스트를 복사했어요.',
        duration: 3000,
      });
    } catch {
      toast({
        title: '복사 실패 — 다시 시도해 주세요.',
        description: '클립보드에 복사할 수 없어요.',
        duration: 3000,
      });
    }
  };

  return {
    handleCopyTranscript,
    handleCopyHandwritten,
  };
}

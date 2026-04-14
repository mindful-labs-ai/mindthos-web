/**
 * 축어록/직접 입력 텍스트 복사 기능 훅
 */

import { useToast } from '@/shared/ui/composites/Toast';

import type { Speaker, TranscribeSegment } from '../types';
import { getSpeakerDisplayName } from '../utils/speakerUtils';

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
        description: '예시에서는 복사 기능이 비활성화됩니다.',
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

          // 신규 ⟪nv:KEY⟫ + nv[] 배열 처리
          if (segment.nv && segment.nv.length > 0) {
            const nvMap = new Map<string, string>();
            for (const entry of segment.nv) {
              const colonIdx = entry.indexOf(':');
              if (colonIdx !== -1) {
                nvMap.set(entry.slice(0, colonIdx), entry.slice(colonIdx + 1));
              }
            }
            cleanedText = cleanedText.replace(/⟪nv:([^⟫]+)⟫/g, (_, key) => {
              const label = nvMap.get(key);
              return label ? `(${label})` : '';
            });
          }

          // 레거시 {%X%내용%} 또는 {%X%} 형태 처리
          cleanedText = cleanedText.replace(
            /\{%[SAEO]%([^%]+)%\}/g,
            '($1)'
          );
          cleanedText = cleanedText.replace(/\{%S%\}/g, '(침묵)');
          cleanedText = cleanedText.replace(/\{%O%\}/g, '(겹침)');
          cleanedText = cleanedText.replace(/\{%[AE]%\}/g, '');

          // 비식별화 태그: showDeid ON이면 라벨로, OFF면 원본으로 치환
          if (showDeid && segment.deid) {
            const deidMap = segment.deid;
            cleanedText = cleanedText.replace(
              /⟪deid:(\w+)\|([^⟫]+)⟫/g,
              (_, key) => `[${deidMap[key] || key}]`
            );
          } else {
            cleanedText = cleanedText.replace(/⟪deid:\w+\|([^⟫]+)⟫/g, '$1');
          }

          // 익명화 모드일 경우 화자 정보 제외
          if (isAnonymized) {
            return `#${speakerIndex} : ${cleanedText}`;
          } else {
            const speakerName = getSpeakerDisplayName(
              segment.speaker,
              speakers
            );
            return `${speakerName} #${speakerIndex} : ${cleanedText}`;
          }
        })
        .join('\n');

      await navigator.clipboard.writeText(formattedText);
      toast({
        title: '복사 완료',
        description: '축어록이 클립보드에 복사되었습니다.',
        duration: 3000,
      });
    } catch {
      toast({
        title: '복사 실패',
        description: '클립보드에 복사할 수 없습니다.',
        duration: 3000,
      });
    }
  };

  const handleCopyHandwritten = async (content: string) => {
    if (isReadOnly) {
      toast({
        title: '읽기 전용',
        description: '예시에서는 복사 기능이 비활성화됩니다.',
        duration: 3000,
      });
      return;
    }

    try {
      await navigator.clipboard.writeText(content);
      toast({
        title: '복사 완료',
        description: '입력된 텍스트가 클립보드에 복사되었습니다.',
        duration: 3000,
      });
    } catch {
      toast({
        title: '복사 실패',
        description: '클립보드에 복사할 수 없습니다.',
        duration: 3000,
      });
    }
  };

  return {
    handleCopyTranscript,
    handleCopyHandwritten,
  };
}

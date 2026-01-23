/**
 * 축어록/직접 입력 텍스트 복사 기능 훅
 */

import { useToast } from '@/components/ui/composites/Toast';

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
    isAnonymized: boolean
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
    isAnonymized: boolean
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

          // {%X%내용%} 또는 {%X%} 형태의 비언어적 표현을 (내용) 로 변환
          // {%A%웃음%} -> (웃음), {%S%} -> (침묵), {%E%강조%} -> (강조)
          let cleanedText = segment.text.replace(
            /\{%[SAEO]%([^%]+)%\}/g,
            '($1)'
          );
          // {%X%} 형태 처리 (내용 없는 경우)
          cleanedText = cleanedText.replace(/\{%S%\}/g, '(침묵)');
          cleanedText = cleanedText.replace(/\{%O%\}/g, '(겹침)');
          cleanedText = cleanedText.replace(/\{%[AE]%\}/g, ''); // A, E는 내용 없으면 제거

          // 익명화 모드일 경우 화자 정보 제외
          if (isAnonymized) {
            return `${speakerIndex}. ${cleanedText}`;
          } else {
            const speakerName = getSpeakerDisplayName(
              segment.speaker,
              speakers
            );
            return `${speakerIndex}. ${speakerName} : ${cleanedText}`;
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

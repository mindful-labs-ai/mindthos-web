/**
 * Transcript Parser
 * 새로운 TranscriptJson 구조 및 레거시 형식 모두 지원
 */

import type {
  Speaker,
  Transcribe,
  TranscribeSegment,
  TranscriptJson,
} from '../types';

/**
 * 숫자 ID를 역할 문자열로 변환
 * @param id - 화자 ID (0, 1, 2, ...)
 * @returns 역할 문자열
 */
function mapSpeakerIdToRole(
  id: number
): 'counselor' | 'client1' | 'client2' | string {
  if (id === 0) return 'counselor';
  if (id === 1) return 'client1';
  if (id === 2) return 'client2';
  return `client${id}`;
}

/**
 * Type guard to check if contents is TranscriptJson
 */
function isTranscriptJson(contents: any): contents is TranscriptJson {
  return (
    contents &&
    typeof contents === 'object' &&
    'stt_model' in contents &&
    'segments' in contents &&
    Array.isArray(contents.segments)
  );
}

/**
 * 전사 데이터를 파싱하여 segments와 speakers 반환
 * DB에 저장된 TranscriptJson 구조만 지원
 */
export function getTranscriptData(transcribe: Transcribe | null): {
  segments: TranscribeSegment[];
  speakers: Speaker[];
} | null {
  if (!transcribe?.contents) {
    return null;
  }

  const contents = transcribe.contents;

  // TranscriptJson 구조 처리
  if (isTranscriptJson(contents)) {
    const rawSegments = contents.segments;
    const sttModel = contents.stt_model;

    // DB의 원본 데이터를 그대로 사용 (ID는 0부터 시작)
    const processedSegments: TranscribeSegment[] = rawSegments.map((seg) => {
      const speakerId = typeof seg.speaker === 'number' ? seg.speaker : 0;

      if (sttModel === 'gemini-3') {
        // Gemini: start/end는 null
        return {
          id: seg.id,
          start: null,
          end: null,
          speaker: speakerId,
          text: seg.text || '',
        };
      } else {
        // Whisper: start/end는 number
        return {
          id: seg.id,
          start: seg.start ?? 0,
          end: seg.end ?? 0,
          speaker: speakerId,
          text: seg.text || '',
        };
      }
    });

    // 화자 목록 생성
    // contents.speakers가 있으면 사용 (customName 보존), 없으면 자동 생성
    const speakers: Speaker[] =
      contents.speakers ||
      (() => {
        const speakerSet = new Set<number>();
        rawSegments.forEach((seg) => {
          const speakerId = typeof seg.speaker === 'number' ? seg.speaker : 0;
          speakerSet.add(speakerId);
        });

        return Array.from(speakerSet)
          .sort((a, b) => a - b)
          .map((id) => ({
            id,
            role: mapSpeakerIdToRole(id),
          }));
      })();

    return { segments: processedSegments, speakers };
  }

  // 레거시 객체 구조 (result만 지원)
  if (typeof contents === 'object' && contents !== null) {
    if ('result' in contents && contents.result) {
      return contents.result;
    }
  }

  return null;
}

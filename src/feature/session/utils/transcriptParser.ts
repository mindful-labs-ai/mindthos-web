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
 * Gemini 화자 문자열을 숫자 ID로 변환
 * @param speakerStr - "C", "P1", "P2" 등
 * @returns 숫자 ID (C -> 0, P1 -> 1, P2 -> 2)
 */
function mapSpeakerStringToId(speakerStr: string): number {
  if (speakerStr === 'C') return 0;

  const match = speakerStr.match(/^P(\d+)$/);
  if (match) {
    return parseInt(match[1], 10);
  }

  // 예상치 못한 형식은 0으로 매핑
  console.warn(`[Parser] Unexpected speaker format: ${speakerStr}`);
  return 0;
}

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
 * Gemini 응답 문자열의 내부 타임스탬프 파싱
 * @param timeStr - "HH:MM:SS" 형식 (소수점 없음, 초 단위)
 * @returns 초 단위 숫자
 */
function parseTimeToSeconds(timeStr: string): number {
  const [hours, minutes, seconds] = timeStr.split(':');
  const totalSeconds =
    parseInt(hours, 10) * 3600 +
    parseInt(minutes, 10) * 60 +
    parseInt(seconds, 10); // parseFloat → parseInt로 변경

  return totalSeconds;
}

/**
 * Gemini 응답 문자열을 JSON으로 파싱
 * 정규표현식을 사용하여 구조화된 데이터로 변환
 *
 * 입력 형식:
 * %T%00:00:05||C||안녕하세요
 * %T%00:00:08||P1||반갑습니다
 * %T%00:00:12||P2||저도 왔어요
 *
 * 화자 코드:
 * - C: 상담자 (counselor)
 * - P1, P2, P3: 내담자들 (등장 순서대로)
 */
export function parseGeminiTranscriptResponse(rawOutput: string): {
  segments: TranscribeSegment[];
  speakers: Speaker[];
} {
  const lines = rawOutput.trim().split('\n');
  const segments: TranscribeSegment[] = [];
  const speakers: Speaker[] = [];

  // 화자 코드를 ID로 매핑하기 위한 Map (예: "C" -> 0, "P1" -> 1, "P2" -> 2)
  const speakerMap = new Map<string, number>();

  // 정규식: 타임스탬프는 HH:MM:SS (소수점 없음), 화자 코드는 C, P1, P2, P3 형식
  const regex = /^%T%(\d{2}:\d{2}:\d{2})\|\|([A-Z0-9]+)\|\|(.*)$/;

  let segmentIdCounter = 0;
  let previousEndTime = 0;

  for (const line of lines) {
    const match = line.match(regex);
    if (!match) continue;

    const [, timeStr, speakerCode, textContent] = match;

    // 1. 화자 ID 관리 (동적 등록)
    let speakerId: number;

    if (speakerMap.has(speakerCode)) {
      // 이미 등록된 화자라면 ID 가져오기
      speakerId = speakerMap.get(speakerCode)!;
    } else {
      // 처음 등장한 화자라면 새로 등록
      speakerId = speakers.length; // 0, 1, 2 순차 부여
      speakerMap.set(speakerCode, speakerId);

      // role 이름 자동 생성
      let roleName = speakerCode;
      if (speakerCode === 'C') {
        roleName = 'counselor'; // 상담자
      } else if (speakerCode.startsWith('P')) {
        roleName = `client${speakerCode.substring(1)}`; // P1 -> client1, P2 -> client2
      }

      speakers.push({
        id: speakerId,
        role: roleName,
      });
    }

    // 2. 세그먼트 생성
    const startSeconds = parseTimeToSeconds(timeStr);

    segments.push({
      id: segmentIdCounter++,
      speaker: speakerId,
      start: startSeconds,
      end: previousEndTime, // 다음 세그먼트가 시작될 때 업데이트됨
      text: textContent.trim(),
    });

    // 이전 세그먼트의 end 시간 업데이트
    if (segmentIdCounter > 1) {
      segments[segmentIdCounter - 2].end = startSeconds;
    }

    previousEndTime = startSeconds;
  }

  // 마지막 세그먼트의 end 시간은 start + 예상 길이로 설정
  if (segments.length > 0) {
    const lastSegment = segments[segments.length - 1];
    lastSegment.end = lastSegment.start + 5; // 기본 5초 추가
  }

  return {
    segments,
    speakers,
  };
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
 *
 * 우선순위:
 * 1. 새로운 TranscriptJson 구조 (stt_model 포함)
 * 2. 레거시 TranscribeContents (result 또는 raw_output)
 * 3. 레거시 문자열 데이터
 */
export function getTranscriptData(transcribe: Transcribe | null): {
  segments: TranscribeSegment[];
  speakers: Speaker[];
} | null {
  if (!transcribe?.contents) {
    return null;
  }

  const contents = transcribe.contents;

  // 1. 새로운 TranscriptJson 구조 처리
  if (isTranscriptJson(contents)) {
    const sttModel = contents.stt_model;
    const rawSegments = contents.segments;

    const processedSegments: TranscribeSegment[] = [];
    const speakerSet = new Set<number>();

    rawSegments.forEach((seg: any, index: number) => {
      if (sttModel === 'gemini-3') {
        // Gemini: 문자열 화자를 숫자로 변환
        const speakerId =
          typeof seg.speaker === 'string'
            ? mapSpeakerStringToId(seg.speaker)
            : seg.speaker || 0;

        speakerSet.add(speakerId);

        processedSegments.push({
          id: index + 1,
          start: null,
          end: null,
          speaker: speakerId,
          text: seg.text || '',
        });
      } else {
        // Whisper: 숫자 화자 사용
        const speakerId = typeof seg.speaker === 'number' ? seg.speaker : 0;
        speakerSet.add(speakerId);

        processedSegments.push({
          id: seg.id || index + 1,
          start: seg.start || 0,
          end: seg.end || 0,
          speaker: speakerId,
          text: seg.text || '',
        });
      }
    });

    // 화자 목록 생성
    const speakers: Speaker[] = Array.from(speakerSet)
      .sort((a, b) => a - b)
      .map((id) => ({
        id,
        role: mapSpeakerIdToRole(id),
      }));

    return { segments: processedSegments, speakers };
  }

  // 2. 레거시 객체 구조 (TranscribeContents)
  if (typeof contents === 'object' && contents !== null) {
    // 2-1. result가 있으면 바로 반환
    if ('result' in contents && contents.result) {
      return contents.result;
    }

    // 2-2. raw_output 파싱
    if ('raw_output' in contents && contents.raw_output?.includes('%T%')) {
      try {
        return parseGeminiTranscriptResponse(contents.raw_output);
      } catch (error) {
        console.error('[Parser] raw_output 파싱 실패:', error);
      }
    }
  }

  // 3. 레거시 문자열 데이터 (예상치 못한 케이스)
  // TypeScript는 위 조건들로 인해 여기서 contents가 never 타입이지만
  // 런타임에서는 문자열이 올 수 있으므로 체크
  if (typeof contents === 'string') {
    const contentsStr = contents as string;
    if (contentsStr.includes('%T%')) {
      try {
        return parseGeminiTranscriptResponse(contentsStr);
      } catch (error) {
        console.error('[Parser] 레거시 문자열 파싱 실패:', error);
      }
    }
  }

  return null;
}

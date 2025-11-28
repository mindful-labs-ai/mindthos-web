/**
 * Gemini STT Raw Output Parser
 * Gemini의 원본 응답을 UI에서 사용할 수 있는 구조화된 데이터로 변환
 */

import type { Speaker, TranscribeSegment } from '../types';

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
 * 백엔드에서 파싱된 데이터를 우선 사용하고, 없으면 클라이언트에서 파싱 (폴백)
 *
 * 우선순위:
 * 1. 백엔드에서 파싱된 result (있으면 바로 반환)
 * 2. raw_output 클라이언트 파싱 (백엔드 파싱 실패 시)
 * 3. 레거시 데이터 처리 (contents가 문자열인 경우)
 */
export function getTranscriptData(
  transcribe: {
    contents:
      | {
          raw_output?: string;
          result?: {
            segments: TranscribeSegment[];
            speakers: Speaker[];
          };
        }
      | string
      | null;
  } | null
): {
  segments: TranscribeSegment[];
  speakers: Speaker[];
} | null {
  if (!transcribe?.contents) {
    return null;
  }

  // 1. contents가 객체인 경우 (새로운 JSONB 형식)
  if (typeof transcribe.contents === 'object' && transcribe.contents !== null) {
    // 1-1. 백엔드에서 파싱된 result가 있으면 바로 반환 (최우선)
    if (transcribe.contents.result) {
      return transcribe.contents.result;
    }

    // 1-2. raw_output만 있으면 클라이언트에서 파싱 (폴백)
    if (transcribe.contents.raw_output?.includes('%T%')) {
      try {
        return parseGeminiTranscriptResponse(transcribe.contents.raw_output);
      } catch (error) {
        console.error('[Parser] 클라이언트 파싱 실패:', error);
      }
    }
  }

  // 2. contents가 문자열인 경우 (레거시 데이터, text 타입 시절)
  if (typeof transcribe.contents === 'string') {
    if (transcribe.contents.includes('%T%')) {
      try {
        return parseGeminiTranscriptResponse(transcribe.contents);
      } catch (error) {
        console.error('[Parser] 레거시 데이터 파싱 실패:', error);
      }
    }
  }

  return null;
}

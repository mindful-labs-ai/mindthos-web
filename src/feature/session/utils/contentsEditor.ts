/**
 * 축어록 contents 편집 유틸리티
 * 듀얼 포맷(TranscriptJson / TranscribeContents)을 한 곳에서 처리하는 순수 함수 모음
 */

import type {
  Speaker,
  TranscribeContents,
  TranscribeSegment,
  TranscriptJson,
} from '../types';

/** DB에 저장되는 contents 타입 */
export type Contents = TranscriptJson | TranscribeContents;

/** contents에서 segments 배열 추출 */
export function getSegments(contents: Contents): TranscribeSegment[] {
  if ('segments' in contents && Array.isArray(contents.segments)) {
    return contents.segments;
  }
  if ('result' in contents && contents.result?.segments) {
    return contents.result.segments;
  }
  return [];
}

/** contents에서 speakers 배열 추출 (없으면 세그먼트에서 자동 생성) */
export function getSpeakers(contents: Contents): Speaker[] {
  if ('segments' in contents && Array.isArray(contents.segments)) {
    const speakers = (contents as TranscriptJson).speakers;
    if (speakers && speakers.length > 0) return speakers;
    // speakers가 없으면 세그먼트에서 자동 생성
    return generateSpeakersFromSegments(contents.segments);
  }
  if ('result' in contents && contents.result?.speakers) {
    return contents.result.speakers;
  }
  if ('result' in contents && contents.result?.segments) {
    return generateSpeakersFromSegments(contents.result.segments);
  }
  return [];
}

/** 세그먼트에서 화자 목록 자동 생성 */
function generateSpeakersFromSegments(
  segments: TranscribeSegment[]
): Speaker[] {
  const speakerIds = new Set<number>();
  segments.forEach((seg) => {
    speakerIds.add(typeof seg.speaker === 'number' ? seg.speaker : 0);
  });
  return Array.from(speakerIds)
    .sort((a, b) => a - b)
    .map((id) => ({
      id,
      role: id === 0 ? 'counselor' : id === 1 ? 'client1' : `client${id}`,
    }));
}

/** 특정 세그먼트의 텍스트 수정 */
export function updateSegmentText(
  contents: Contents,
  segmentId: number,
  newText: string
): Contents {
  return mapSegments(contents, (seg) =>
    seg.id === segmentId ? { ...seg, text: newText } : seg
  );
}

/** 특정 세그먼트의 화자 수정 */
export function updateSegmentSpeaker(
  contents: Contents,
  segmentId: number,
  newSpeakerId: number
): Contents {
  return mapSegments(contents, (seg) =>
    seg.id === segmentId ? { ...seg, speaker: newSpeakerId } : seg
  );
}

/** speakers 정의 업데이트 */
export function updateSpeakerDefinitions(
  contents: Contents,
  speakers: Speaker[]
): Contents {
  if ('segments' in contents && Array.isArray(contents.segments)) {
    return { ...contents, speakers };
  }
  if ('result' in contents && contents.result) {
    return {
      ...contents,
      result: { ...contents.result, speakers },
    };
  }
  return contents;
}

/** afterSegmentId 뒤에 새 세그먼트 삽입 */
export function addSegmentAfter(
  contents: Contents,
  afterSegmentId: number,
  newSegment: TranscribeSegment
): Contents {
  return transformSegments(contents, (segments) => {
    const idx = segments.findIndex((s) => s.id === afterSegmentId);
    if (idx === -1) return segments;
    const updated = [...segments];
    updated.splice(idx + 1, 0, newSegment);
    return updated;
  });
}

/** 세그먼트 삭제 */
export function removeSegment(contents: Contents, segmentId: number): Contents {
  return transformSegments(contents, (segments) =>
    segments.filter((s) => s.id !== segmentId)
  );
}

/** 다수 텍스트 편집 일괄 적용 */
export function applyBulkTextEdits(
  contents: Contents,
  edits: Record<number, string>
): Contents {
  if (Object.keys(edits).length === 0) return contents;
  return mapSegments(contents, (seg) =>
    seg.id in edits ? { ...seg, text: edits[seg.id] } : seg
  );
}

/** 다수 화자 변경 + speaker 정의 일괄 적용 */
export function applyBulkSpeakerChanges(
  contents: Contents,
  changes: Record<number, number>,
  speakers: Speaker[]
): Contents {
  let updated = mapSegments(contents, (seg) =>
    seg.id in changes ? { ...seg, speaker: changes[seg.id] } : seg
  );
  updated = updateSpeakerDefinitions(updated, speakers);
  return updated;
}

/** contents 깊은 복사 */
export function deepCloneContents(contents: Contents): Contents {
  return JSON.parse(JSON.stringify(contents));
}

// ── 내부 헬퍼 ──

/** 모든 세그먼트에 mapper 적용 (듀얼 포맷 지원) */
function mapSegments(
  contents: Contents,
  mapper: (seg: TranscribeSegment) => TranscribeSegment
): Contents {
  if ('segments' in contents && Array.isArray(contents.segments)) {
    return { ...contents, segments: contents.segments.map(mapper) };
  }
  if ('result' in contents && contents.result?.segments) {
    return {
      ...contents,
      result: {
        ...contents.result,
        segments: contents.result.segments.map(mapper),
      },
    };
  }
  return contents;
}

/** 세그먼트 배열을 변환 함수로 교체 (듀얼 포맷 지원) */
function transformSegments(
  contents: Contents,
  transformer: (segments: TranscribeSegment[]) => TranscribeSegment[]
): Contents {
  if ('segments' in contents && Array.isArray(contents.segments)) {
    return { ...contents, segments: transformer(contents.segments) };
  }
  if ('result' in contents && contents.result?.segments) {
    return {
      ...contents,
      result: {
        ...contents.result,
        segments: transformer(contents.result.segments),
      },
    };
  }
  return contents;
}

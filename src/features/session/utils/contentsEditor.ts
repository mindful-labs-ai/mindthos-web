/**
 * 축어록 contents 편집 유틸리티
 * 듀얼 포맷(TranscriptJson / TranscribeContents)을 한 곳에서 처리하는 순수 함수 모음
 */

import type {
  Speaker,
  TranscribeContents,
  TranscribeSegment,
  TranscriptJson,
  WhisperSegment,
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

/** 세그먼트에서 화자 목록 자동 생성 (0→상담사, 1부터 내담자) */
export function generateSpeakersFromSegments(
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

/** 특정 세그먼트의 시간(start/end) 수정 — null 타임 세그먼트도 유효 타임 부여 */
export function updateSegmentTime(
  contents: Contents,
  segmentId: number,
  start: number,
  end: number
): Contents {
  return mapSegments(contents, (seg) =>
    seg.id === segmentId ? ({ ...seg, start, end } as WhisperSegment) : seg
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

/** 저장텍스트의 특정 슬라이스에 속한 nv만 추출 (완전 토큰 매칭 → 키 충돌 방지) */
function partitionNv(
  nv: string[] | undefined,
  sliceText: string
): string[] | undefined {
  if (!nv || nv.length === 0) return undefined;
  const part = nv.filter((entry) => {
    const key = entry.slice(0, entry.indexOf(':'));
    return sliceText.includes(`⟪nv:${key}⟫`);
  });
  return part.length > 0 ? part : undefined;
}

/** 저장텍스트의 특정 슬라이스에 속한 deid만 추출 (⟪deid:key| 완전 매칭) */
function partitionDeid(
  deid: Record<string, string> | undefined,
  sliceText: string
): Record<string, string> | undefined {
  if (!deid) return undefined;
  const part: Record<string, string> = {};
  for (const key of Object.keys(deid)) {
    if (sliceText.includes(`⟪deid:${key}|`)) part[key] = deid[key];
  }
  return Object.keys(part).length > 0 ? part : undefined;
}

/**
 * 세그먼트를 경계(offset)들로 분리하고 각 조각에 화자를 배정
 * - boundaries: 저장텍스트 기준 정렬된 분리 지점들 (N개 → N+1 조각)
 * - sliceSpeakers: 각 조각의 화자 id (길이 = N+1)
 * 첫 비어있지 않은 조각은 원본 id/start/end 유지, 나머지는 maxId+1.. / start·end=null.
 * nv/deid는 조각별로 파티션. 유효 조각이 2개 미만이면 no-op.
 */
export function splitSegmentByBoundaries(
  contents: Contents,
  segmentId: number,
  boundaries: number[],
  sliceSpeakers: number[]
): Contents {
  return transformSegments(contents, (segments) => {
    const idx = segments.findIndex((s) => s.id === segmentId);
    if (idx === -1) return segments;
    const seg = segments[idx];

    const points = [0, ...boundaries, seg.text.length];
    const rawSlices = [];
    for (let i = 0; i < points.length - 1; i += 1) {
      rawSlices.push({
        text: seg.text.slice(points[i], points[i + 1]).trim(),
        speaker: sliceSpeakers[i] ?? seg.speaker,
      });
    }
    const slices = rawSlices.filter((s) => s.text.length > 0);
    if (slices.length <= 1) return segments; // 분리 불가

    const maxId = segments.reduce((m, s) => Math.max(m, s.id), 0);
    let nextId = maxId + 1;
    const newSegs: TranscribeSegment[] = slices.map((slc, i) => {
      const nv = partitionNv(seg.nv, slc.text);
      const deid = partitionDeid(seg.deid, slc.text);
      if (i === 0) {
        // 첫 조각: 원본 id/start/end 유지
        return { ...seg, text: slc.text, speaker: slc.speaker, nv, deid };
      }
      return {
        id: nextId++,
        start: null as null,
        end: null as null,
        text: slc.text,
        speaker: slc.speaker,
        nv,
        deid,
      };
    });

    const updated = [...segments];
    updated.splice(idx, 1, ...newSegs);
    return updated;
  });
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

/** 다수 nv 편집 일괄 적용 */
export function applyBulkNvEdits(
  contents: Contents,
  edits: Record<number, string[]>
): Contents {
  if (Object.keys(edits).length === 0) return contents;
  return mapSegments(contents, (seg) =>
    seg.id in edits ? { ...seg, nv: edits[seg.id] } : seg
  );
}

/** 세그먼트 내 유일한 새 nv 키 생성 (타입별 접두 s/e/a + 다음 번호) */
export function generateNvKey(
  existingNv: string[] | undefined,
  type: 'S' | 'E' | 'A'
): string {
  const prefix = type === 'S' ? 's' : type === 'E' ? 'e' : 'a';
  let maxNum = 0;
  for (const entry of existingNv ?? []) {
    const key = entry.slice(0, entry.indexOf(':'));
    if (key.startsWith(prefix)) {
      const num = parseInt(key.slice(prefix.length), 10);
      if (Number.isFinite(num) && num > maxNum) maxNum = num;
    }
  }
  return `${prefix}${maxNum + 1}`;
}

/** 다수 deid 편집 일괄 적용 */
export function applyBulkDeidEdits(
  contents: Contents,
  edits: Record<number, Record<string, string>>
): Contents {
  if (Object.keys(edits).length === 0) return contents;
  return mapSegments(contents, (seg) =>
    seg.id in edits ? { ...seg, deid: edits[seg.id] } : seg
  );
}

/** contents 깊은 복사 */
export function deepCloneContents(contents: Contents): Contents {
  return JSON.parse(JSON.stringify(contents));
}

// ── 찾기 · 바꾸기 (태그 안전) ──

export interface ReplaceOptions {
  /** 대소문자 구분 (기본 false) */
  caseSensitive?: boolean;
}

/** 정규식 특수문자 이스케이프 */
function escapeRegExp(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * 태그 토큰: 신규 nv(⟪nv:...⟫), deid(⟪deid:...⟫), 레거시 비언어({%S%} 등)
 * 이 토큰 "안"은 절대 치환하지 않음 — 태그 키·deid 원문 보호
 */
const TAG_TOKEN_REGEX = /⟪nv:[^⟫]+⟫|⟪deid:[^⟫]+⟫|\{%[SAEO]%(?:[^%]+%)?}/g;

/**
 * 저장 텍스트에서 태그 토큰을 건너뛰고 일반 텍스트 구간만 치환
 * @returns 치환된 텍스트와 치환 횟수
 */
export function replaceInStoredText(
  text: string,
  find: string,
  replaceWith: string,
  opts: ReplaceOptions = {}
): { text: string; count: number } {
  if (!find) return { text, count: 0 };

  const flags = opts.caseSensitive ? 'g' : 'gi';
  let count = 0;
  const replaceGap = (gap: string): string => {
    if (!gap) return gap;
    const re = new RegExp(escapeRegExp(find), flags);
    return gap.replace(re, () => {
      count += 1;
      return replaceWith;
    });
  };

  let result = '';
  let lastIndex = 0;
  for (const match of text.matchAll(TAG_TOKEN_REGEX)) {
    const idx = match.index ?? 0;
    result += replaceGap(text.slice(lastIndex, idx)); // 토큰 앞 일반 구간
    result += match[0]; // 토큰은 그대로
    lastIndex = idx + match[0].length;
  }
  result += replaceGap(text.slice(lastIndex)); // 마지막 토큰 이후 구간

  return { text: result, count };
}

/**
 * 전체 세그먼트에 찾기·바꾸기 적용
 * @returns 변경된 세그먼트별 새 텍스트(edits)와 총 치환 횟수
 */
export function findReplaceAllSegments(
  segments: TranscribeSegment[],
  find: string,
  replaceWith: string,
  opts: ReplaceOptions = {}
): { edits: Record<number, string>; totalCount: number } {
  const edits: Record<number, string> = {};
  let totalCount = 0;
  for (const seg of segments) {
    const { text, count } = replaceInStoredText(
      seg.text,
      find,
      replaceWith,
      opts
    );
    if (count > 0) {
      edits[seg.id] = text;
      totalCount += count;
    }
  }
  return { edits, totalCount };
}

/** 전체 세그먼트에서 태그 밖 매치 개수만 계산 */
export function countMatchesInSegments(
  segments: TranscribeSegment[],
  find: string,
  opts: ReplaceOptions = {}
): number {
  if (!find) return 0;
  let total = 0;
  for (const seg of segments) {
    total += replaceInStoredText(seg.text, find, find, opts).count;
  }
  return total;
}

/**
 * 태그 밖 n번째(0-based) 매치 하나만 치환 (하나씩 바꾸기용)
 */
export function replaceNthInStoredText(
  text: string,
  find: string,
  replaceWith: string,
  n: number,
  opts: ReplaceOptions = {}
): { text: string; replaced: boolean } {
  if (!find || n < 0) return { text, replaced: false };

  const flags = opts.caseSensitive ? 'g' : 'gi';
  let counter = 0;
  let replaced = false;
  const replaceGap = (gap: string): string => {
    if (!gap || replaced) return gap;
    const re = new RegExp(escapeRegExp(find), flags);
    return gap.replace(re, (m) => {
      if (replaced) return m;
      if (counter === n) {
        counter += 1;
        replaced = true;
        return replaceWith;
      }
      counter += 1;
      return m;
    });
  };

  let result = '';
  let lastIndex = 0;
  for (const match of text.matchAll(TAG_TOKEN_REGEX)) {
    const idx = match.index ?? 0;
    result += replaceGap(text.slice(lastIndex, idx));
    result += match[0];
    lastIndex = idx + match[0].length;
  }
  result += replaceGap(text.slice(lastIndex));

  return { text: result, replaced };
}

/**
 * 전체 세그먼트의 태그 밖 매치를 순서대로 나열
 * occ = 해당 세그먼트 내 몇 번째 매치인지(0-based)
 */
export function listMatchesInSegments(
  segments: TranscribeSegment[],
  find: string,
  opts: ReplaceOptions = {}
): { segmentId: number; occ: number }[] {
  if (!find) return [];
  const result: { segmentId: number; occ: number }[] = [];
  for (const seg of segments) {
    const count = replaceInStoredText(seg.text, find, find, opts).count;
    for (let occ = 0; occ < count; occ += 1) {
      result.push({ segmentId: seg.id, occ });
    }
  }
  return result;
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

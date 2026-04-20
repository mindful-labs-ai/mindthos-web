import { useMemo } from 'react';

import type { ProgressNote } from '@/features/session/types';

import { tryParseNoteV2 } from '../NoteV2Renderer';
import type { NoteV2Output } from '../NoteV2Renderer';

import { parseSummary } from './parseSummary';
import type { NoteSection } from './parseSummary';

export type ProgressNoteFormat =
  | { kind: 'v2'; noteV2: NoteV2Output; sections: [] }
  | { kind: 'v1'; noteV2: null; sections: NoteSection[] };

/** ProgressNote의 summary를 v1(마크다운) / v2(JSON) 포맷으로 분기 */
export function useProgressNoteFormat(note: ProgressNote): ProgressNoteFormat {
  const noteV2 = useMemo(
    () => (note.summary ? tryParseNoteV2(note.summary) : null),
    [note.summary]
  );

  const sections = useMemo(
    () => (!noteV2 && note.summary ? parseSummary(note.summary) : []),
    [note.summary, noteV2]
  );

  if (noteV2) {
    return { kind: 'v2', noteV2, sections: [] };
  }
  return { kind: 'v1', noteV2: null, sections };
}

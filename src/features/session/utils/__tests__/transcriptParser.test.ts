import { describe, expect, it } from 'vitest';

import type { Transcribe, TranscriptJson } from '../../types';
import { getTranscriptData } from '../transcriptParser';

const makeTranscribe = (
  contents: Transcribe['contents'],
  sttModel: Transcribe['stt_model'] = 'advanced'
): Transcribe => ({
  id: 't1',
  session_id: 's1',
  user_id: 1,
  title: null,
  counsel_date: null,
  contents,
  stt_model: sttModel,
  parsed_text: null,
  preview: null,
  created_at: '2026-01-01T00:00:00Z',
});

const makeTranscriptJson = (
  overrides: Partial<TranscriptJson> = {}
): TranscriptJson => ({
  language: 'ko',
  segments: [
    { id: 0, start: 0, end: 3.2, speaker: 0, text: '안녕하세요.' },
    { id: 1, start: 3.2, end: 7.5, speaker: 1, text: '네, 안녕하세요.' },
  ],
  text: '',
  raw_output: '',
  stt_model: 'advanced',
  ...overrides,
});

describe('getTranscriptData — TranscriptJson 구조', () => {
  it('advanced: start/end·nv·deid를 보존해 세그먼트를 정규화한다', () => {
    const contents = makeTranscriptJson({
      segments: [
        {
          id: 0,
          start: 0,
          end: 3,
          speaker: 0,
          text: '⟪nv:s1⟫안녕',
          nv: ['s1:침묵 3초'],
          deid: { d1: '인물1' },
        },
      ],
    });
    const result = getTranscriptData(makeTranscribe(contents));
    expect(result?.segments).toEqual([
      {
        id: 0,
        start: 0,
        end: 3,
        speaker: 0,
        text: '⟪nv:s1⟫안녕',
        nv: ['s1:침묵 3초'],
        deid: { d1: '인물1' },
      },
    ]);
  });

  it('advanced: start/end가 없으면 0으로 보정한다', () => {
    const contents = makeTranscriptJson({
      segments: [{ id: 0, start: null, end: null, speaker: 0, text: '텍스트' }],
    });
    const result = getTranscriptData(makeTranscribe(contents));
    expect(result?.segments[0]).toMatchObject({ start: 0, end: 0 });
  });

  it('gemini-3(레거시): start/end를 null로 정규화한다', () => {
    const contents = makeTranscriptJson({
      stt_model: 'gemini-3',
      segments: [{ id: 0, start: 1, end: 2, speaker: 0, text: '텍스트' }],
    });
    const result = getTranscriptData(makeTranscribe(contents, 'gemini-3'));
    expect(result?.segments[0]).toMatchObject({ start: null, end: null });
  });

  it('speakers가 없으면 세그먼트에서 자동 생성한다 (0→상담사, 1→내담자)', () => {
    const result = getTranscriptData(makeTranscribe(makeTranscriptJson()));
    expect(result?.speakers).toEqual([
      { id: 0, role: 'counselor' },
      { id: 1, role: 'client1' },
    ]);
  });

  it('contents.speakers가 있으면 customName을 보존한 채 그대로 사용한다', () => {
    const contents = makeTranscriptJson({
      speakers: [
        { id: 0, role: 'counselor', customName: '김상담' },
        { id: 1, role: 'client1' },
      ],
    });
    const result = getTranscriptData(makeTranscribe(contents));
    expect(result?.speakers[0]).toEqual({
      id: 0,
      role: 'counselor',
      customName: '김상담',
    });
  });
});

describe('getTranscriptData — 레거시·경계 입력', () => {
  it('transcribe가 null이거나 contents가 없으면 null을 반환한다', () => {
    expect(getTranscriptData(null)).toBeNull();
    expect(getTranscriptData(makeTranscribe(null))).toBeNull();
  });

  it('레거시 객체 구조({result})는 result를 그대로 반환한다', () => {
    const legacyResult = {
      segments: [{ id: 0, start: 0, end: 1, speaker: 0, text: '레거시' }],
      speakers: [{ id: 0, role: 'counselor' }],
    };
    const result = getTranscriptData(
      makeTranscribe({
        audio_uuid: 'a1',
        status: 'completed',
        result: legacyResult,
      })
    );
    expect(result).toEqual(legacyResult);
  });

  it('알 수 없는 구조는 null을 반환한다', () => {
    const result = getTranscriptData(
      makeTranscribe({
        audio_uuid: 'a1',
        status: 'processing',
      })
    );
    expect(result).toBeNull();
  });
});

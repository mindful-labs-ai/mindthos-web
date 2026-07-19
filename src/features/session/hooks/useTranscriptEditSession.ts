/**
 * 축어록 편집 세션 통합 훅
 *
 * 편집 시작 시 contents 스냅샷을 생성하고,
 * 모든 변경(텍스트, 화자, 세그먼트 추가/삭제)을 스냅샷에서 관리합니다.
 * 저장 시 일괄 전송, 취소 시 스냅샷 폐기.
 *
 * 비편집 모드에서의 화자 변경은 기존처럼 즉시 서버에 저장돼요.
 */

import React from 'react';

import { useQueryClient } from '@tanstack/react-query';

import { trackError, trackEvent } from '@/lib/mixpanel';
import { updateTranscript } from '@/shared/api/server/transcriptServerApi';
import {
  MixpanelError,
  MixpanelEvent,
} from '@/shared/constants/mixpanelEvents';
import { sessionQueryKeys } from '@/shared/constants/queryKeys';
import { useToast } from '@/shared/ui/composites/Toast';

import type {
  ProgressNote,
  Session,
  Speaker,
  Transcribe,
  TranscribeSegment,
} from '../types';
import {
  addSegmentAfter,
  applyBulkDeidEdits,
  applyBulkNvEdits,
  applyBulkSpeakerChanges,
  applyBulkTextEdits,
  type Contents,
  countMatchesInSegments,
  deepCloneContents,
  findReplaceAllSegments,
  getSegments,
  listMatchesInSegments,
  removeSegment,
  replaceNthInStoredText,
  type ReplaceOptions,
  splitSegmentByBoundaries,
  updateSegmentTime,
  updateSpeakerDefinitions,
} from '../utils/contentsEditor';

// ── 타입 ──

interface SpeakerChangeUpdate {
  speakerChanges: Record<number, number>;
  speakerDefinitions: Speaker[];
}

interface UseTranscriptEditSessionOptions {
  sessionId: string;
  transcribeId: string | undefined;
  isDummySession: boolean;
  isReadOnly: boolean;
  checkIsGuideLevel?: (level: number) => boolean;
  nextGuideLevel?: () => void;
  scrollToTop?: () => void;
  /** 편집기 remount(분리/치환/undo 등) 직전 호출 — DOM이 아직 이전 상태일 때
   *  스크롤 앵커 캡처용 */
  onBeforeEditorRemount?: () => void;
}

interface UseTranscriptEditSessionReturn {
  isEditing: boolean;
  hasEdits: boolean;
  isSaving: boolean;
  handleEditStart: () => void;
  /** 저장 요청이 이미 전송된 경우 false를 반환해 화면 이탈을 막는다. */
  handleCancelEdit: () => boolean;
  handleSaveAllEdits: () => Promise<void>;
  handleTextEdit: (segmentId: number, newText: string) => void;
  handleNvEdit: (segmentId: number, nv: string[]) => void;
  handleDeidEdit: (segmentId: number, deid: Record<string, string>) => void;
  handleSpeakerChange: (updates: SpeakerChangeUpdate) => Promise<void>;
  handleAddSegment: (afterSegmentId: number, speaker: number) => void;
  handleDeleteSegment: (segmentId: number) => void;
  /** 세그먼트 시간(start/end) 수정 */
  handleSegmentTimeChange: (
    segmentId: number,
    start: number,
    end: number
  ) => void;
  /** 세그먼트 분리/화자 전환 (boundaries로 나누고 조각별 화자 배정) */
  handleSplitSegment: (
    segmentId: number,
    boundaries: number[],
    sliceSpeakers: number[],
    speakerDefinitions?: Speaker[]
  ) => void;
  /** 편집 되돌리기/다시 실행 (화자·추가·삭제·찾기바꾸기·텍스트/태그) */
  canUndo: boolean;
  canRedo: boolean;
  handleUndo: () => void;
  handleRedo: () => void;
  /** 찾기·바꾸기 (편집 모드) — 반환값은 총 치환 횟수 */
  handleReplaceAll: (
    find: string,
    replaceWith: string,
    opts?: ReplaceOptions
  ) => number;
  /** 현재 검색어의 태그 밖 매치 개수 */
  getMatchCount: (find: string, opts?: ReplaceOptions) => number;
  /** 매치 목록(세그먼트+occ) — 찾기 이동/하나씩 바꾸기용 */
  getMatchList: (
    find: string,
    opts?: ReplaceOptions
  ) => { segmentId: number; occ: number }[];
  /** occ번째 매치 하나만 치환 — 성공 여부 반환 */
  replaceOne: (
    segmentId: number,
    occ: number,
    find: string,
    replaceWith: string,
    opts?: ReplaceOptions
  ) => boolean;
  /** 세그먼트 편집기 강제 remount 버전 (텍스트가 밖에서 바뀔 때 증가) */
  editorVersion: number;
  /** 편집 중이면 스냅샷 기반 contents, 아니면 null */
  editingContents: Contents | null;
}

interface EditTarget {
  sessionId: string;
  transcribeId: string;
  baseRevision: number;
  baseContentsFingerprint: string;
  baseContents: Contents;
  generation: number;
}

interface InFlightTarget {
  sessionId: string;
  transcribeId: string;
  generation?: number;
}

type CachedSessionData = {
  session: Session;
  transcribe: Transcribe | null;
  progressNotes: ProgressNote[];
};

// ── 훅 ──

export function useTranscriptEditSession({
  sessionId,
  transcribeId,
  isDummySession,
  isReadOnly,
  checkIsGuideLevel,
  nextGuideLevel,
  scrollToTop,
  onBeforeEditorRemount,
}: UseTranscriptEditSessionOptions): UseTranscriptEditSessionReturn {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [isEditing, setIsEditing] = React.useState(false);
  const [hasEdits, setHasEdits] = React.useState(false);
  const [isSaving, setIsSaving] = React.useState(false);
  // 편집 중 UI에 반영할 스냅샷 (화자/추가/삭제는 state로 관리)
  const [editingContents, setEditingContents] = React.useState<Contents | null>(
    null
  );
  // 텍스트 편집은 ref로 관리 (리렌더링 없이 타이핑 성능 유지)
  const textEditsRef = React.useRef<Record<number, string>>({});
  const nvEditsRef = React.useRef<Record<number, string[]>>({});
  const deidEditsRef = React.useRef<Record<number, Record<string, string>>>({});
  // contents와 저장 대상의 provenance를 한 묶음으로 고정한다.
  const editTargetRef = React.useRef<EditTarget | null>(null);
  // 이전 route/save 응답이 새 편집 세션의 state를 지우지 못하게 하는 세대 번호.
  const editGenerationRef = React.useRef(0);
  const mutationInFlightRef = React.useRef(false);
  const mutationInFlightTargetRef = React.useRef<InFlightTarget | null>(null);

  const isTargetMutationInFlight = React.useCallback(
    (target: InFlightTarget | null): boolean => {
      const inFlight = mutationInFlightTargetRef.current;
      if (!inFlight || !target) return false;
      return (
        inFlight.sessionId === target.sessionId &&
        inFlight.transcribeId === target.transcribeId &&
        (inFlight.generation === undefined ||
          target.generation === undefined ||
          inFlight.generation === target.generation)
      );
    },
    []
  );

  // 편집 undo/redo 히스토리 + 편집기 remount 버전
  // 스냅샷은 버퍼(텍스트/nv/deid)를 병합(materialize)한 contents를 저장하므로
  // 구조적 편집(화자/추가/삭제)·찾기바꾸기·텍스트/태그 편집 모두 되돌릴 수 있다.
  const editingContentsRef = React.useRef<Contents | null>(null);
  const pastRef = React.useRef<Contents[]>([]);
  const futureRef = React.useRef<Contents[]>([]);
  // 텍스트/nv/deid 편집 버스트 추적 — 같은 세그먼트 연속 편집을 하나의 undo 단위로 묶음
  const lastEditBurstSegmentRef = React.useRef<number | null>(null);
  const [canUndo, setCanUndo] = React.useState(false);
  const [canRedo, setCanRedo] = React.useState(false);
  // 세그먼트 편집기(contentEditable)를 밖에서 강제 rebuild할 때 증가
  // (찾기·바꾸기/undo/redo로 텍스트가 바뀌면 편집기를 remount해 반영)
  const [editorVersion, setEditorVersion] = React.useState(0);

  // remount 직전 훅(스크롤 앵커 캡처)을 태우고 버전 증가 — 모든 bump는 이걸 경유
  const bumpEditorVersion = React.useCallback(() => {
    onBeforeEditorRemount?.();
    setEditorVersion((v) => v + 1);
  }, [onBeforeEditorRemount]);

  // editingContents를 ref에 동기화 (히스토리 스냅샷 소스)
  React.useEffect(() => {
    editingContentsRef.current = editingContents;
  }, [editingContents]);

  // 버퍼된 텍스트/nv/deid 편집을 contents에 병합
  const materializeBuffers = React.useCallback((base: Contents): Contents => {
    let merged = applyBulkTextEdits(base, textEditsRef.current);
    merged = applyBulkNvEdits(merged, nvEditsRef.current);
    merged = applyBulkDeidEdits(merged, deidEditsRef.current);
    return merged;
  }, []);

  const clearBuffers = React.useCallback(() => {
    textEditsRef.current = {};
    nvEditsRef.current = {};
    deidEditsRef.current = {};
    lastEditBurstSegmentRef.current = null;
  }, []);

  // ref + state 동시 갱신
  const setEditing = React.useCallback((next: Contents | null) => {
    editingContentsRef.current = next;
    setEditingContents(next);
  }, []);

  const resetHistory = React.useCallback(() => {
    pastRef.current = [];
    futureRef.current = [];
    setCanUndo(false);
    setCanRedo(false);
  }, []);

  // 편집 직전 materialize된 스냅샷을 past에 저장하고 redo 스택 비움
  const pushHistorySnapshot = React.useCallback((snapshot: Contents) => {
    pastRef.current = [...pastRef.current, snapshot];
    futureRef.current = [];
    setCanUndo(true);
    setCanRedo(false);
  }, []);

  // 텍스트/nv/deid 편집 버스트 시작 시 체크포인트 저장
  // (같은 세그먼트 연속 편집은 하나의 undo 단위. 세그먼트가 바뀌면 새 체크포인트)
  const startEditBurst = React.useCallback(
    (segmentId: number) => {
      if (lastEditBurstSegmentRef.current === segmentId) return;
      const base = editingContentsRef.current;
      if (base) pushHistorySnapshot(materializeBuffers(base));
      lastEditBurstSegmentRef.current = segmentId;
    },
    [materializeBuffers, pushHistorySnapshot]
  );

  // 구조적 편집 공통 처리:
  // 버퍼 병합 → 스냅샷 저장 → 버퍼 비움 → 변경 적용
  // opts.remount=true면 편집기 강제 remount(기존 세그먼트 텍스트가 밖에서 바뀔 때, 예: 분리)
  const applyStructuralEdit = React.useCallback(
    (
      transform: (materialized: Contents) => Contents,
      opts?: { remount?: boolean }
    ) => {
      if (isTargetMutationInFlight(editTargetRef.current)) return;
      const base = editingContentsRef.current;
      if (!base) return;
      const materialized = materializeBuffers(base);
      pushHistorySnapshot(materialized);
      clearBuffers();
      setEditing(transform(materialized));
      if (opts?.remount) bumpEditorVersion();
      setHasEdits(true);
    },
    [
      materializeBuffers,
      pushHistorySnapshot,
      clearBuffers,
      setEditing,
      bumpEditorVersion,
      isTargetMutationInFlight,
    ]
  );

  const sessionQueryKey = React.useMemo(
    () => sessionQueryKeys.detail(sessionId, isDummySession),
    [sessionId, isDummySession]
  );

  /** 캐시가 현재 route/transcribe와 정확히 일치할 때만 반환한다. */
  const getTranscribeFromCache = React.useCallback((): Transcribe | null => {
    const cached = queryClient.getQueryData(sessionQueryKey) as
      | CachedSessionData
      | undefined;
    const transcribe = cached?.transcribe;
    if (
      !transcribe ||
      transcribe.id !== transcribeId ||
      transcribe.session_id !== sessionId
    ) {
      return null;
    }
    return transcribe;
  }, [queryClient, sessionId, sessionQueryKey, transcribeId]);

  const resetEditState = React.useCallback(() => {
    editGenerationRef.current += 1;
    editTargetRef.current = null;
    clearBuffers();
    setEditing(null);
    resetHistory();
    setHasEdits(false);
    setIsEditing(false);
  }, [clearBuffers, resetHistory, setEditing]);

  // 동일 컴포넌트 인스턴스가 다른 route를 렌더해도 이전 편집 스냅샷을 폐기한다.
  React.useEffect(() => {
    const target = editTargetRef.current;
    if (
      target &&
      (target.sessionId !== sessionId || target.transcribeId !== transcribeId)
    ) {
      resetEditState();
    }
  }, [resetEditState, sessionId, transcribeId]);

  // ── 편집 시작 ──

  const handleEditStart = React.useCallback(() => {
    if (isReadOnly) {
      toast({
        title: '읽기 전용',
        description: '실제 상담 기록에서 편집할 수 있어요.',
        duration: 3000,
      });
      return;
    }

    const inFlightTarget = mutationInFlightTargetRef.current;
    if (
      inFlightTarget?.sessionId === sessionId &&
      inFlightTarget.transcribeId === transcribeId
    ) {
      toast({
        title: '저장 중이에요',
        description: '현재 축어록 저장이 끝난 뒤 다시 편집해 주세요.',
        duration: 3000,
      });
      return;
    }

    const transcribe = getTranscribeFromCache();
    const contents = transcribe?.contents as Contents | null | undefined;
    if (
      !transcribe ||
      !contents ||
      !Number.isInteger(transcribe.revision) ||
      !transcribe.contents_md5
    ) {
      toast({
        title: '편집 정보를 불러오지 못했어요',
        description: '페이지를 새로고침한 뒤 다시 시도해 주세요.',
        duration: 3000,
      });
      return;
    }

    trackEvent(MixpanelEvent.TranscriptEditStart, { session_id: sessionId });

    // contents와 대상 identity/revision/fingerprint를 같은 시점에 캡처한다.
    const baseContents = deepCloneContents(contents);
    editTargetRef.current = {
      sessionId,
      transcribeId: transcribe.id,
      baseRevision: transcribe.revision,
      baseContentsFingerprint: transcribe.contents_md5,
      baseContents,
      generation: editGenerationRef.current + 1,
    };
    editGenerationRef.current = editTargetRef.current.generation;
    setEditing(deepCloneContents(baseContents));
    clearBuffers();
    resetHistory();
    setHasEdits(false);
    setIsEditing(true);

    // 가이드 Level 1 → Level 2
    if (checkIsGuideLevel?.(1)) {
      nextGuideLevel?.();
    }
  }, [
    isReadOnly,
    sessionId,
    transcribeId,
    getTranscribeFromCache,
    checkIsGuideLevel,
    nextGuideLevel,
    toast,
    setEditing,
    clearBuffers,
    resetHistory,
  ]);

  // ── 편집 취소 ──

  const handleCancelEdit = React.useCallback(() => {
    if (isTargetMutationInFlight(editTargetRef.current)) {
      toast({
        title: '저장 중이에요',
        description: '저장이 끝난 뒤 이동해 주세요.',
        duration: 3000,
      });
      return false;
    }
    trackEvent(MixpanelEvent.TranscriptEditCancel, { session_id: sessionId });

    resetEditState();

    // 서버 원본으로 복원 — 상세 + 리스트(paginated/allByClient 등) 모두 무효화
    queryClient.invalidateQueries({ queryKey: sessionQueryKey });
    queryClient.invalidateQueries({ queryKey: ['sessions'] });
    return true;
  }, [
    sessionId,
    queryClient,
    resetEditState,
    sessionQueryKey,
    toast,
    isTargetMutationInFlight,
  ]);

  // ── 텍스트 편집 (편집 모드 전용, ref 기반) ──

  const handleTextEdit = React.useCallback(
    (segmentId: number, newText: string) => {
      if (
        isReadOnly ||
        !isEditing ||
        isTargetMutationInFlight(editTargetRef.current)
      )
        return;

      startEditBurst(segmentId);
      textEditsRef.current[segmentId] = newText;
      if (!hasEdits) {
        setHasEdits(true);
      }
    },
    [
      isReadOnly,
      isEditing,
      hasEdits,
      isTargetMutationInFlight,
      startEditBurst,
    ]
  );

  // ── nv 편집 (편집 모드 전용, ref 기반) ──

  const handleNvEdit = React.useCallback(
    (segmentId: number, nv: string[]) => {
      if (
        isReadOnly ||
        !isEditing ||
        isTargetMutationInFlight(editTargetRef.current)
      )
        return;
      startEditBurst(segmentId);
      nvEditsRef.current[segmentId] = nv;
      if (!hasEdits) setHasEdits(true);
    },
    [
      isReadOnly,
      isEditing,
      hasEdits,
      isTargetMutationInFlight,
      startEditBurst,
    ]
  );

  // ── deid 편집 (편집 모드 전용, ref 기반) ──

  const handleDeidEdit = React.useCallback(
    (segmentId: number, deid: Record<string, string>) => {
      if (
        isReadOnly ||
        !isEditing ||
        isTargetMutationInFlight(editTargetRef.current)
      )
        return;
      startEditBurst(segmentId);
      deidEditsRef.current[segmentId] = deid;
      if (!hasEdits) setHasEdits(true);
    },
    [
      isReadOnly,
      isEditing,
      hasEdits,
      isTargetMutationInFlight,
      startEditBurst,
    ]
  );

  // ── 화자 변경 (듀얼 모드) ──

  const handleSpeakerChange = React.useCallback(
    async (updates: SpeakerChangeUpdate) => {
      if (isReadOnly) {
        toast({
          title: '읽기 전용',
          description: '실제 상담 기록에서 편집할 수 있어요.',
          duration: 3000,
        });
        return;
      }

      if (!transcribeId || !sessionId) {
        toast({
          title: '문제가 생겼어요',
          description: '전사 데이터를 찾을 수 없어요.',
          duration: 3000,
        });
        return;
      }

      if (isEditing) {
        if (isTargetMutationInFlight(editTargetRef.current)) return;
        // ── 편집 모드: 스냅샷에만 적용 ──
        applyStructuralEdit((c) =>
          applyBulkSpeakerChanges(
            c,
            updates.speakerChanges,
            updates.speakerDefinitions
          )
        );
      } else {
        // ── 비편집 모드: 현재 캐시의 identity/version을 고정해 즉시 저장 ──
        if (mutationInFlightRef.current) return;
        mutationInFlightRef.current = true;
        setIsSaving(true);
        try {
          const transcribe = getTranscribeFromCache();
          if (
            !transcribe?.contents ||
            !Number.isInteger(transcribe.revision) ||
            !transcribe.contents_md5
          ) {
            throw new Error('현재 축어록의 편집 버전을 확인할 수 없어요.');
          }

          const target = {
            sessionId,
            transcribeId: transcribe.id,
            expectedRevision: transcribe.revision,
            expectedContentsFingerprint: transcribe.contents_md5,
            baseContents: deepCloneContents(transcribe.contents as Contents),
          };
          mutationInFlightTargetRef.current = target;
          const updatedContents = applyBulkSpeakerChanges(
            transcribe.contents as Contents,
            updates.speakerChanges,
            updates.speakerDefinitions
          );

          const response = await updateTranscript({
            ...target,
            contents: updatedContents,
          });

          queryClient.setQueryData(
            sessionQueryKey,
            (oldData: CachedSessionData | undefined) => {
              if (
                oldData?.session.id !== target.sessionId ||
                oldData.transcribe?.id !== target.transcribeId
              ) {
                return oldData;
              }
              return {
                ...oldData,
                transcribe: {
                  ...oldData.transcribe,
                  contents: updatedContents,
                  revision: response.revision,
                  contents_md5: response.contentsFingerprint,
                },
              };
            }
          );
          await queryClient.invalidateQueries({ queryKey: ['sessions'] });
          await queryClient.invalidateQueries({ queryKey: sessionQueryKey });

          toast({
            title: '화자 변경 완료',
            description: '축어록을 수정했어요.',
            duration: 3000,
          });
        } catch (error) {
          await queryClient.invalidateQueries({
            queryKey: sessionQueryKey,
          });
          await queryClient.invalidateQueries({ queryKey: ['sessions'] });

          trackError(MixpanelError.SpeakerChangeError, error, {
            session_id: sessionId,
            transcribe_id: transcribeId,
          });
          toast({
            title: '화자 변경 실패',
            description:
              '화자를 변경하지 못했어요. 잠시 후 다시 시도해 주세요.',
            duration: 3000,
          });
        } finally {
          mutationInFlightRef.current = false;
          mutationInFlightTargetRef.current = null;
          setIsSaving(false);
        }
      }
    },
    [
      isReadOnly,
      isEditing,
      transcribeId,
      sessionId,
      queryClient,
      sessionQueryKey,
      getTranscribeFromCache,
      isTargetMutationInFlight,
      toast,
      applyStructuralEdit,
    ]
  );

  // ── 세그먼트 추가 (편집 모드 전용) ──

  const handleAddSegment = React.useCallback(
    (afterSegmentId: number, speaker: number) => {
      if (
        isReadOnly ||
        !isEditing ||
        isTargetMutationInFlight(editTargetRef.current)
      )
        return;

      applyStructuralEdit((c) => {
        const segments = getSegments(c);
        const maxId = segments.reduce((max, seg) => Math.max(max, seg.id), 0);
        const newSegment: TranscribeSegment = {
          id: maxId + 1,
          start: null as null,
          end: null as null,
          text: '',
          speaker,
        };
        return addSegmentAfter(c, afterSegmentId, newSegment);
      });
    },
    [isReadOnly, isEditing, isTargetMutationInFlight, applyStructuralEdit]
  );

  // ── 세그먼트 삭제 (편집 모드 전용) ──

  const handleDeleteSegment = React.useCallback(
    (segmentId: number) => {
      if (isReadOnly || !isEditing) return;
      // materialize가 삭제 세그먼트 텍스트도 흡수 후 removeSegment로 제거
      applyStructuralEdit((c) => removeSegment(c, segmentId));
    },
    [isReadOnly, isEditing, applyStructuralEdit]
  );

  // ── 세그먼트 시간 수정 (편집 모드 전용) ──

  const handleSegmentTimeChange = React.useCallback(
    (segmentId: number, start: number, end: number) => {
      if (isReadOnly || !isEditing) return;
      applyStructuralEdit((c) => updateSegmentTime(c, segmentId, start, end));
    },
    [isReadOnly, isEditing, applyStructuralEdit]
  );

  // ── 세그먼트 분리 / 화자 전환 (편집 모드 전용) ──
  // boundaries=분리 지점(offset)들, sliceSpeakers=각 조각 화자. 텍스트가 잘리므로 remount.
  const handleSplitSegment = React.useCallback(
    (
      segmentId: number,
      boundaries: number[],
      sliceSpeakers: number[],
      speakerDefinitions?: Speaker[]
    ) => {
      if (isReadOnly || !isEditing) return;
      applyStructuralEdit(
        (c) => {
          let next = splitSegmentByBoundaries(
            c,
            segmentId,
            boundaries,
            sliceSpeakers
          );
          if (speakerDefinitions) {
            next = updateSpeakerDefinitions(next, speakerDefinitions);
          }
          return next;
        },
        { remount: true }
      );
    },
    [isReadOnly, isEditing, applyStructuralEdit]
  );

  // ── 되돌리기 (undo) ──

  const handleUndo = React.useCallback(() => {
    if (isTargetMutationInFlight(editTargetRef.current)) return;
    if (pastRef.current.length === 0) return;
    const base = editingContentsRef.current;
    const current = base ? materializeBuffers(base) : null;
    const previous = pastRef.current[pastRef.current.length - 1];
    pastRef.current = pastRef.current.slice(0, -1);
    if (current) futureRef.current = [...futureRef.current, current];
    clearBuffers();
    setEditing(previous);
    bumpEditorVersion(); // 편집기 rebuild로 텍스트 변화 반영
    setCanUndo(pastRef.current.length > 0);
    setCanRedo(futureRef.current.length > 0);
    setHasEdits(true);
  }, [
    materializeBuffers,
    clearBuffers,
    setEditing,
    bumpEditorVersion,
    isTargetMutationInFlight,
  ]);

  // ── 다시 실행 (redo) ──

  const handleRedo = React.useCallback(() => {
    if (isTargetMutationInFlight(editTargetRef.current)) return;
    if (futureRef.current.length === 0) return;
    const base = editingContentsRef.current;
    const current = base ? materializeBuffers(base) : null;
    const next = futureRef.current[futureRef.current.length - 1];
    futureRef.current = futureRef.current.slice(0, -1);
    if (current) pastRef.current = [...pastRef.current, current];
    clearBuffers();
    setEditing(next);
    bumpEditorVersion();
    setCanUndo(pastRef.current.length > 0);
    setCanRedo(futureRef.current.length > 0);
    setHasEdits(true);
  }, [
    materializeBuffers,
    clearBuffers,
    setEditing,
    bumpEditorVersion,
    isTargetMutationInFlight,
  ]);

  // ── 찾기 · 바꾸기 (이 축어록 한정, 편집 모드) ──

  const handleReplaceAll = React.useCallback(
    (find: string, replaceWith: string, opts?: ReplaceOptions): number => {
      if (
        isReadOnly ||
        !isEditing ||
        isTargetMutationInFlight(editTargetRef.current)
      )
        return 0;
      const base = editingContentsRef.current;
      if (!base || !find) return 0;
      const materialized = materializeBuffers(base);
      const { edits, totalCount } = findReplaceAllSegments(
        getSegments(materialized),
        find,
        replaceWith,
        opts
      );
      if (totalCount === 0) return 0;
      pushHistorySnapshot(materialized); // 되돌리기용 (치환 직전 상태)
      clearBuffers();
      setEditing(applyBulkTextEdits(materialized, edits));
      bumpEditorVersion(); // 편집기 rebuild로 치환 결과 반영
      setHasEdits(true);
      return totalCount;
    },
    [
      isReadOnly,
      isEditing,
      materializeBuffers,
      pushHistorySnapshot,
      clearBuffers,
      setEditing,
      bumpEditorVersion,
      isTargetMutationInFlight,
    ]
  );

  const getMatchCount = React.useCallback(
    (find: string, opts?: ReplaceOptions): number => {
      const base = editingContentsRef.current;
      if (!base || !find) return 0;
      return countMatchesInSegments(
        getSegments(materializeBuffers(base)),
        find,
        opts
      );
    },
    [materializeBuffers]
  );

  // 매치 목록(세그먼트+occ) — 찾기 이동/하나씩 바꾸기용. editingContents 변경 즉시 반영
  const getMatchList = React.useCallback(
    (find: string, opts?: ReplaceOptions) => {
      const base = editingContentsRef.current;
      if (!base || !find) return [];
      return listMatchesInSegments(
        getSegments(materializeBuffers(base)),
        find,
        opts
      );
    },
    [materializeBuffers]
  );

  // 특정 세그먼트의 occ번째 매치 하나만 치환 (하나씩 바꾸기)
  const replaceOne = React.useCallback(
    (
      segmentId: number,
      occ: number,
      find: string,
      replaceWith: string,
      opts?: ReplaceOptions
    ): boolean => {
      if (
        isReadOnly ||
        !isEditing ||
        isTargetMutationInFlight(editTargetRef.current)
      )
        return false;
      const base = editingContentsRef.current;
      if (!base || !find) return false;
      const materialized = materializeBuffers(base);
      const seg = getSegments(materialized).find((s) => s.id === segmentId);
      if (!seg) return false;
      const { text, replaced } = replaceNthInStoredText(
        seg.text,
        find,
        replaceWith,
        occ,
        opts
      );
      if (!replaced) return false;
      pushHistorySnapshot(materialized); // 되돌리기용
      clearBuffers();
      setEditing(applyBulkTextEdits(materialized, { [segmentId]: text }));
      bumpEditorVersion();
      setHasEdits(true);
      return true;
    },
    [
      isReadOnly,
      isEditing,
      materializeBuffers,
      pushHistorySnapshot,
      clearBuffers,
      setEditing,
      bumpEditorVersion,
      isTargetMutationInFlight,
    ]
  );

  // ── 모든 편집 저장 ──

  const handleSaveAllEdits = React.useCallback(async () => {
    if (isReadOnly) {
      toast({
        title: '읽기 전용',
        description: '실제 상담 기록에서 편집할 수 있어요.',
        duration: 3000,
      });
      return;
    }

    if (!transcribeId || !sessionId) {
      toast({
        title: '문제가 생겼어요',
        description: '전사 데이터를 찾을 수 없어요.',
        duration: 3000,
      });
      return;
    }

    const target = editTargetRef.current;
    if (
      !target ||
      target.sessionId !== sessionId ||
      target.transcribeId !== transcribeId
    ) {
      const snapshotSessionId = target?.sessionId;
      const snapshotTranscribeId = target?.transcribeId;
      trackError(
        MixpanelError.TranscriptSaveError,
        new Error('편집 스냅샷과 현재 route의 대상이 일치하지 않아요.'),
        {
          session_id: sessionId,
          transcribe_id: transcribeId,
          snapshot_session_id: snapshotSessionId,
          snapshot_transcribe_id: snapshotTranscribeId,
          blocked_reason: 'edit_target_mismatch',
        }
      );
      toast({
        title: '이전 편집을 저장하지 않았어요',
        description:
          '다른 상담 기록으로 이동해 편집 내용을 안전하게 취소했어요.',
        duration: 3000,
      });
      return;
    }

    if (!editingContents) {
      toast({
        title: '문제가 생겼어요',
        description: '편집 데이터를 찾을 수 없어요.',
        duration: 3000,
      });
      return;
    }

    if (!hasEdits) {
      resetEditState();
      return;
    }

    if (mutationInFlightRef.current) return;

    // 가이드 Level 3 → Level 4
    if (checkIsGuideLevel?.(3)) {
      scrollToTop?.();
      nextGuideLevel?.();
    }

    mutationInFlightRef.current = true;
    mutationInFlightTargetRef.current = target;
    setIsSaving(true);
    try {
      // 텍스트 편집을 스냅샷에 병합
      const textEdits = textEditsRef.current;
      let finalContents = applyBulkTextEdits(editingContents, textEdits);
      finalContents = applyBulkNvEdits(finalContents, nvEditsRef.current);
      finalContents = applyBulkDeidEdits(finalContents, deidEditsRef.current);

      // 검증된 스냅샷 target으로만 저장한다. 성공 전에는 편집 상태를 유지한다.
      const response = await updateTranscript({
        sessionId: target.sessionId,
        transcribeId: target.transcribeId,
        expectedRevision: target.baseRevision,
        expectedContentsFingerprint: target.baseContentsFingerprint,
        baseContents: target.baseContents,
        contents: finalContents,
      });

      queryClient.setQueryData(
        sessionQueryKey,
        (oldData: CachedSessionData | undefined) => {
          if (
            oldData?.session.id !== target.sessionId ||
            oldData.transcribe?.id !== target.transcribeId
          ) {
            return oldData;
          }
          return {
            ...oldData,
            transcribe: {
              ...oldData.transcribe,
              contents: finalContents,
              revision: response.revision,
              contents_md5: response.contentsFingerprint,
            },
          };
        }
      );
      const isCurrentEdit =
        editTargetRef.current?.generation === target.generation;
      if (isCurrentEdit) {
        resetEditState();
      }

      // 서버가 정규화한 contents/parsed_text/preview/updated_at으로 상세 캐시도 맞춘다.
      await queryClient.invalidateQueries({ queryKey: sessionQueryKey });
      await queryClient.invalidateQueries({ queryKey: ['sessions'] });

      trackEvent(MixpanelEvent.TranscriptEditComplete, {
        session_id: target.sessionId,
        transcribe_id: target.transcribeId,
        edited_segments_count: Object.keys(textEdits).length,
      });

      if (isCurrentEdit) {
        toast({
          title: '저장 완료',
          description: '축어록을 수정했어요.',
          duration: 3000,
        });
      }
    } catch (error) {
      // 충돌이면 stale 스냅샷을 폐기하고, 네트워크 오류면 사용자의 편집을 유지한다.
      const isConflict =
        typeof error === 'object' &&
        error !== null &&
        'status' in error &&
        error.status === 409;
      const isCurrentEdit =
        editTargetRef.current?.generation === target.generation;
      if (isConflict && isCurrentEdit) {
        resetEditState();
      }
      await queryClient.invalidateQueries({
        queryKey: sessionQueryKey,
      });
      await queryClient.invalidateQueries({ queryKey: ['sessions'] });

      trackError(MixpanelError.TranscriptSaveError, error, {
        session_id: target.sessionId,
        transcribe_id: target.transcribeId,
        base_revision: target.baseRevision,
      });
      if (isCurrentEdit) {
        toast({
          title: isConflict ? '최신 내용을 다시 불러왔어요' : '저장 실패',
          description: isConflict
            ? '다른 곳에서 축어록이 변경되어 이전 편집은 저장하지 않았어요.'
            : '축어록을 저장하지 못했어요. 잠시 후 다시 시도해 주세요.',
          duration: 3000,
        });
      }
    } finally {
      mutationInFlightRef.current = false;
      mutationInFlightTargetRef.current = null;
      setIsSaving(false);
    }
  }, [
    isReadOnly,
    transcribeId,
    sessionId,
    editingContents,
    hasEdits,
    checkIsGuideLevel,
    scrollToTop,
    nextGuideLevel,
    queryClient,
    sessionQueryKey,
    resetEditState,
    toast,
  ]);

  return {
    isEditing,
    hasEdits,
    isSaving:
      isSaving &&
      isTargetMutationInFlight({
        sessionId,
        transcribeId: transcribeId ?? '',
      }),
    handleEditStart,
    handleCancelEdit,
    handleSaveAllEdits,
    handleTextEdit,
    handleNvEdit,
    handleDeidEdit,
    handleSpeakerChange,
    handleAddSegment,
    handleDeleteSegment,
    handleSegmentTimeChange,
    handleSplitSegment,
    canUndo,
    canRedo,
    handleUndo,
    handleRedo,
    handleReplaceAll,
    getMatchCount,
    getMatchList,
    replaceOne,
    editorVersion,
    editingContents,
  };
}

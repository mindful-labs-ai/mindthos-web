import {
  useMutation,
  useQueryClient,
  type QueryClient,
} from '@tanstack/react-query';

import { useToast } from '@/shared/ui/composites/Toast';

import { calendarDataSource } from '../adapters';
import type {
  CalendarEvent,
  CalendarEventInput,
  CalendarEventScope,
} from '../types';

/** 낙관적 임시 일정 id 접두사 — 서버 재조회로 교체되기 전 캐시에 잠깐 얹는 표식. */
export const TEMP_EVENT_PREFIX = '__temp__';

/** 일정 캐시 쿼리 키 — 현재 뷰 포함 모든 창을 매칭. */
const EVENTS_QUERY_KEY = ['calendar', 'events'] as const;

/** 일정 캐시 쿼리들(현재 뷰 포함)에 대한 낙관적 갱신용 스냅샷 엔트리. */
type EventsCacheEntry = [readonly unknown[], CalendarEvent[] | undefined];

interface EventMutationContext {
  previous: EventsCacheEntry[];
}

interface SubmitEventVars {
  input: CalendarEventInput;
  editing: CalendarEvent | null;
  scope?: CalendarEventScope;
  occurrenceDate: string | null;
}

interface DeleteEventVars {
  id: string;
  scope: CalendarEventScope;
  occurrenceDate: string | null;
}

/** 서버 입력(CalendarEventInput) → 캐시 표시용 이벤트 필드(id 제외). 낙관적 생성/수정 공용. */
function eventFieldsFromInput(
  input: CalendarEventInput
): Omit<CalendarEvent, 'id'> {
  return {
    title: input.title,
    kind: input.kind,
    colorKey: input.colorKey,
    start: input.start,
    end: input.end,
    eventTimeKind: input.eventTimeKind,
    categoryId: input.categoryId,
    clientId: input.clientId,
    counselMethod: input.counselMethod,
  };
}

/**
 * 수정 낙관 반영 — scope에 맞춰 즉시 갱신할 회차를 고른다.
 * 마스터의 가상 회차들은 행 id(마스터 id)를 공유하므로 id만으로 매칭하면 시리즈 전체가
 * 통째로 바뀌어 보인다. this=그 회차만 전체 필드, all/following=시리즈에 비시간 필드만
 * (시각은 회차별 계산값 — 시각 변경·분할·override 생성은 onSettled 재조회가 확정).
 */
function applyEditForScope(
  events: CalendarEvent[],
  editing: CalendarEvent,
  input: CalendarEventInput,
  scope: CalendarEventScope | undefined,
  occurrenceDate: string | null
): CalendarEvent[] {
  const fields = eventFieldsFromInput(input);
  const seriesId = editing.seriesId ?? null;
  // 단일 일정 — 기존처럼 id 매칭 행 전체 교체.
  if (!seriesId) {
    return events.map((e) => (e.id === editing.id ? { ...e, ...fields } : e));
  }
  if (scope === 'this') {
    return events.map((e) =>
      e.id === editing.id && (e.occurrenceDate ?? null) === occurrenceDate
        ? { ...e, ...fields }
        : e
    );
  }
  const sharedFields = {
    title: fields.title,
    kind: fields.kind,
    colorKey: fields.colorKey,
    categoryId: fields.categoryId,
    clientId: fields.clientId,
    counselMethod: fields.counselMethod,
  };
  if (scope === 'following' && occurrenceDate) {
    return events.map((e) =>
      e.seriesId === seriesId && (e.occurrenceDate ?? '') >= occurrenceDate
        ? { ...e, ...sharedFields }
        : e
    );
  }
  // all (또는 occurrenceDate 없는 following 방어) — 시리즈 전체.
  return events.map((e) =>
    e.seriesId === seriesId ? { ...e, ...sharedFields } : e
  );
}

/**
 * 삭제 낙관 반영 — scope에 맞춰 즉시 제거할 회차를 고른다(수정과 동일한 id 공유 전제).
 * this=그 회차 하나, following=그 회차부터 같은 시리즈, all=시리즈 전체, 단일=그 행.
 */
function removeEventsForScope(
  events: CalendarEvent[],
  id: string,
  scope: CalendarEventScope,
  occurrenceDate: string | null
): CalendarEvent[] {
  const target =
    events.find(
      (e) =>
        e.id === id &&
        (occurrenceDate === null || e.occurrenceDate === occurrenceDate)
    ) ?? events.find((e) => e.id === id);
  const seriesId = target?.seriesId ?? null;
  // 단일 일정(시리즈 없음) — 그 행만.
  if (!seriesId) return events.filter((e) => e.id !== id);
  if (scope === 'all') return events.filter((e) => e.seriesId !== seriesId);
  if (scope === 'following') {
    // 회차 날짜가 없으면(방어) 시리즈 전체로 근사 — onSettled 재조회가 확정.
    if (!occurrenceDate) return events.filter((e) => e.seriesId !== seriesId);
    return events.filter(
      (e) =>
        !(e.seriesId === seriesId && (e.occurrenceDate ?? '') >= occurrenceDate)
    );
  }
  // this — 그 회차 하나(마스터 인스턴스는 id+회차날짜, override는 고유 id로 특정).
  return events.filter(
    (e) => !(e.id === id && (e.occurrenceDate ?? null) === occurrenceDate)
  );
}

/** 진행 중 refetch 취소 + 현재 events 캐시 스냅샷(롤백용). cancel은 상위 키(['calendar'])까지 안전하게 취소. */
async function snapshotEvents(
  queryClient: QueryClient
): Promise<EventsCacheEntry[]> {
  await queryClient.cancelQueries({ queryKey: ['calendar'] });
  return queryClient.getQueriesData<CalendarEvent[]>({
    queryKey: EVENTS_QUERY_KEY,
  });
}

/** onError 스냅샷 롤백. */
function rollbackEvents(
  queryClient: QueryClient,
  context: EventMutationContext | undefined
): void {
  context?.previous.forEach(([key, data]) =>
    queryClient.setQueryData(key, data)
  );
}

/** onSettled — 서버 진실로 재조정(근사 낙관치를 여기서 정확히 교정). */
function invalidateEvents(queryClient: QueryClient): void {
  queryClient.invalidateQueries({ queryKey: EVENTS_QUERY_KEY });
}

/**
 * 일정 생성/수정·삭제 낙관적 뮤테이션.
 *  onMutate: refetch 취소 + 캐시 스냅샷 → 즉시 반영(생성=temp 추가 / 수정·삭제=scope별 회차 매칭 —
 *    applyEditForScope/removeEventsForScope). 반복 생성은 회차 전개가 서버 몫이라 낙관 추가를 스킵.
 *  onError: 스냅샷 롤백 + 실패 토스트. onSettled: invalidate로 서버 진실 재조정.
 * 반환한 mutate 함수는 호출부에서 per-call onSuccess(트래킹·패널 닫기)를 넘겨 오케스트레이션한다.
 */
export function useCalendarEventMutations() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { mutate: submitEvent, isPending: isSubmitting } = useMutation<
    unknown,
    unknown,
    SubmitEventVars,
    EventMutationContext
  >({
    mutationFn: ({ input, editing, scope, occurrenceDate }) => {
      if (editing) {
        // 편집 — 반복(시리즈)이면 scope(this/following/all). this/following은 회차(occurrenceDate)로
        // 어느 회차인지 서버에 알린다(EXDATE+override / 분할). 단일은 scope 무시.
        return (
          calendarDataSource.updateEvent?.(editing.id, input, {
            scope,
            occurrenceDate,
          }) ?? Promise.resolve()
        );
      }
      return calendarDataSource.createEvent?.(input) ?? Promise.resolve();
    },
    onMutate: async ({ input, editing, scope, occurrenceDate }) => {
      const previous = await snapshotEvents(queryClient);
      if (editing) {
        queryClient.setQueriesData<CalendarEvent[]>(
          { queryKey: EVENTS_QUERY_KEY },
          (old) =>
            old && applyEditForScope(old, editing, input, scope, occurrenceDate)
        );
      } else if (!input.repeat) {
        const temp: CalendarEvent = {
          id: `${TEMP_EVENT_PREFIX}${Date.now()}`,
          ...eventFieldsFromInput(input),
          // 진행 중 생성 — 재조회가 실제 이벤트로 대체할 때까지 read-only로 표시한다.
          // (temp를 클릭/편집/삭제하면 존재하지 않는 temp id로 서버 호출되어 404·헛토스트가 난다.)
          isDraft: true,
        };
        queryClient.setQueriesData<CalendarEvent[]>(
          { queryKey: EVENTS_QUERY_KEY },
          (old) => (old ? [...old, temp] : old)
        );
      }
      return { previous };
    },
    onError: (_err, _vars, context) => {
      rollbackEvents(queryClient, context);
      toast({
        title: '일정 저장 실패',
        description: '잠시 후 다시 시도해 주세요.',
      });
    },
    onSettled: () => invalidateEvents(queryClient),
  });

  const { mutate: deleteEvent, isPending: isDeleting } = useMutation<
    unknown,
    unknown,
    DeleteEventVars,
    EventMutationContext
  >({
    mutationFn: ({ id, scope, occurrenceDate }) =>
      calendarDataSource.deleteEvent?.(id, scope, occurrenceDate) ??
      Promise.resolve(),
    onMutate: async ({ id, scope, occurrenceDate }) => {
      const previous = await snapshotEvents(queryClient);
      // scope에 맞춰 즉시 제거(EXDATE/override/분할의 정확한 결과는 onSettled 재조회가 확정).
      queryClient.setQueriesData<CalendarEvent[]>(
        { queryKey: EVENTS_QUERY_KEY },
        (old) => old && removeEventsForScope(old, id, scope, occurrenceDate)
      );
      return { previous };
    },
    onError: (_err, _vars, context) => {
      rollbackEvents(queryClient, context);
      toast({
        title: '일정 삭제 실패',
        description: '잠시 후 다시 시도해 주세요.',
      });
    },
    onSettled: () => invalidateEvents(queryClient),
  });

  return { submitEvent, deleteEvent, isSubmitting, isDeleting };
}

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
 *  onMutate: refetch 취소 + 캐시 스냅샷 → 즉시 반영(생성=temp 추가 / 수정=id 매칭 교체 / 삭제=id 제거).
 *    반복 생성은 회차 전개가 서버 몫이라 낙관 추가를 스킵(onSettled 재조회에 의존).
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
    onMutate: async ({ input, editing }) => {
      const previous = await snapshotEvents(queryClient);
      if (editing) {
        const id = editing.id;
        queryClient.setQueriesData<CalendarEvent[]>(
          { queryKey: EVENTS_QUERY_KEY },
          (old) =>
            old?.map((e) =>
              e.id === id ? { ...e, ...eventFieldsFromInput(input) } : e
            )
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
    onMutate: async ({ id }) => {
      const previous = await snapshotEvents(queryClient);
      // 반복(all/following)은 한 행만 지워 근사 — onSettled 재조회로 EXDATE/override/분할을 정확히 맞춘다.
      queryClient.setQueriesData<CalendarEvent[]>(
        { queryKey: EVENTS_QUERY_KEY },
        (old) => old?.filter((e) => e.id !== id)
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

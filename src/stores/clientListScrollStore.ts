import { create } from 'zustand';

/**
 * 내담자 목록 페이지에서 특정 카드로 스크롤하라는 의도를 전역으로 전달.
 *
 * - 모바일 헤더("+" 버튼) → 글로벌 AddClientModal → ClientListContainer
 *   처럼 컴포넌트 트리가 분리된 경로에서 스크롤 신호를 한 방향으로 흘려보내기 위해 사용.
 * - 데스크탑(로컬 AddClientModal) 경로는 상위 컨테이너 state로 충분해서 본 스토어를 거치지 않음.
 */
interface ClientListScrollStore {
  pendingClientId: string | null;
  requestScrollToClient: (clientId: string) => void;
  clearPendingScroll: () => void;
}

export const useClientListScrollStore = create<ClientListScrollStore>(
  (set) => ({
    pendingClientId: null,
    requestScrollToClient: (clientId) => set({ pendingClientId: clientId }),
    clearPendingScroll: () => set({ pendingClientId: null }),
  })
);

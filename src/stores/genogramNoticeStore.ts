import { create } from 'zustand';

interface GenogramNoticeState {
  shown: boolean;
  markShown: () => void;
}

export const useGenogramNoticeStore = create<GenogramNoticeState>((set) => ({
  shown: false,
  markShown: () => set({ shown: true }),
}));

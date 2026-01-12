import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';

import { callEdgeFunction } from '@/shared/utils/edgeFunctionClient';

export interface PatchContentItem {
  title: string;
  image: string;
  description: string;
}

export interface Patch {
  id: string;
  version: string;
  content: PatchContentItem[];
  applyDate: string;
}

interface PatchHistoryResponse {
  success: boolean;
  patch: Patch | null;
  error?: string;
  message?: string;
}

interface UpdateState {
  patch: Patch | null;
  isOpen: boolean;
  dismissedVersion: string | null;
}

interface UpdateActions {
  initialize: () => Promise<void>;
  open: () => void;
  close: () => void;
  setOpen: (isOpen: boolean) => void;
  dismiss: () => void;
  reset: () => void;
}

type UpdateStore = UpdateState & UpdateActions;

const initialState: UpdateState = {
  patch: null,
  isOpen: false,
  dismissedVersion: null,
};

export const useUpdateStore = create<UpdateStore>()(
  devtools(
    persist(
      (set, get) => ({
        ...initialState,

        initialize: async () => {
          try {
            const response = await callEdgeFunction<PatchHistoryResponse>(
              'patch-history',
              {}
            );

            if (response.success && response.patch) {
              const { dismissedVersion } = get();
              const shouldShowModal =
                response.patch.version !== dismissedVersion;

              set(
                { patch: response.patch, isOpen: shouldShowModal },
                false,
                'initialize'
              );
            }
          } catch (error) {
            console.error('Failed to fetch patch history:', error);
          }
        },

        open: () => set({ isOpen: true }, false, 'open'),

        close: () => set({ isOpen: false }, false, 'close'),

        setOpen: (isOpen) => set({ isOpen }, false, 'setOpen'),

        dismiss: () => {
          const { patch } = get();
          set(
            { isOpen: false, dismissedVersion: patch?.version ?? null },
            false,
            'dismiss'
          );
        },

        reset: () => set(initialState, false, 'reset'),
      }),
      {
        name: 'update-storage',
        partialize: (state) => ({ dismissedVersion: state.dismissedVersion }),
      }
    ),
    { name: 'UpdateStore' }
  )
);

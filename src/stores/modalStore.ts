import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

/**
 * 전역 모달 타입 정의
 * 새로운 모달 추가 시 여기에 타입을 추가
 */
export type ModalType =
  | 'questMission'
  | 'completeMission'
  | 'userEdit'
  | 'missionPanel'
  | 'planChange'
  | 'createMultiSession'
  | 'comingSoon'
  | 'couponModal';

/**
 * 모달별 데이터 타입 정의
 */
export interface ModalData {
  questMission: undefined;
  completeMission: undefined;
  userEdit: undefined;
  missionPanel: undefined;
  planChange: undefined;
  createMultiSession: undefined;
  comingSoon: { source: string };
  couponModal: undefined;
}

interface ModalState {
  /** 현재 열린 모달들 (스택 형태로 관리) */
  openModals: ModalType[];
  /** 각 모달의 데이터 */
  modalData: Partial<Record<ModalType, unknown>>;
}

interface ModalActions {
  /** 모달 열기 */
  openModal: <T extends ModalType>(type: T, data?: ModalData[T]) => void;
  /** 모달 닫기 */
  closeModal: (type: ModalType) => void;
  /** 특정 모달이 열려있는지 확인 */
  isModalOpen: (type: ModalType) => boolean;
  /** 모든 모달 닫기 */
  closeAllModals: () => void;
  /** 모달 토글 */
  toggleModal: <T extends ModalType>(type: T, data?: ModalData[T]) => void;
}

type ModalStore = ModalState & ModalActions;

export const useModalStore = create<ModalStore>()(
  devtools(
    (set, get) => ({
      openModals: [],
      modalData: {},

      openModal: (type, data) => {
        const { openModals } = get();

        // 이미 열려있으면 무시
        if (openModals.includes(type)) return;

        set(
          (state) => ({
            openModals: [...state.openModals, type],
            modalData:
              data !== undefined
                ? { ...state.modalData, [type]: data }
                : state.modalData,
          }),
          false,
          `openModal/${type}`
        );
      },

      closeModal: (type) => {
        set(
          (state) => ({
            openModals: state.openModals.filter((t) => t !== type),
            modalData: (() => {
              const newData = { ...state.modalData };
              delete newData[type];
              return newData;
            })(),
          }),
          false,
          `closeModal/${type}`
        );
      },

      isModalOpen: (type) => {
        return get().openModals.includes(type);
      },

      closeAllModals: () => {
        set({ openModals: [], modalData: {} }, false, 'closeAllModals');
      },

      toggleModal: (type, data) => {
        const { openModals, openModal, closeModal } = get();

        if (openModals.includes(type)) {
          closeModal(type);
        } else {
          openModal(type, data);
        }
      },
    }),
    { name: 'ModalStore' }
  )
);

/**
 * 모달 관련 편의 훅
 * 특정 모달의 열림/닫힘 상태와 제어 함수를 반환
 */
export const useModal = <T extends ModalType>(type: T) => {
  const isOpen = useModalStore((state) => state.openModals.includes(type));
  const data = useModalStore(
    (state) => state.modalData[type] as ModalData[T] | undefined
  );
  const openModal = useModalStore((state) => state.openModal);
  const closeModal = useModalStore((state) => state.closeModal);
  const toggleModal = useModalStore((state) => state.toggleModal);

  return {
    isOpen,
    data,
    open: (modalData?: ModalData[T]) => openModal(type, modalData),
    close: () => closeModal(type),
    toggle: (modalData?: ModalData[T]) => toggleModal(type, modalData),
  };
};

import type { FC, ReactNode } from 'react';

export interface GenogramClientViewProps {
  header: ReactNode;
  content: ReactNode;
  addClientModal: ReactNode;
  resetModal: ReactNode;
  exportModal: ReactNode;
  guideModal: ReactNode;
  reportModal: ReactNode;
}

export const GenogramClientView: FC<GenogramClientViewProps> = ({
  header,
  content,
  addClientModal,
  resetModal,
  exportModal,
  guideModal,
  reportModal,
}) => {
  return (
    <div className="relative h-full">
      {/* 캔버스 위 오버레이: 드롭다운 + 액션 버튼 */}
      {header}

      {/* 콘텐츠 영역 */}
      {content}

      {/* 클라이언트 추가 모달 */}
      {addClientModal}

      {/* 가계도 초기화 확인 모달 */}
      {resetModal}

      {/* 이미지 내보내기 모달 */}
      {exportModal}

      {/* 가계도 안내 모달 */}
      {guideModal}

      {/* 가계도 분석 보고서 모달 */}
      {reportModal}
    </div>
  );
};

import React from 'react';

import { Panel } from '@xyflow/react';
import { Plus } from 'lucide-react';

interface EmptyStatePanelProps {
  /** 하단에 표시할 커스텀 액션 영역 */
  actions?: React.ReactNode;
}

/** 노드가 없을 때 표시되는 빈 상태 안내 */
export const EmptyStatePanel: React.FC<EmptyStatePanelProps> = ({
  actions,
}) => {
  return (
    <Panel
      position="top-left"
      className="pointer-events-none !absolute !inset-0 !z-[4] !m-0 flex items-center justify-center"
    >
      <div className="pointer-events-none flex w-[512px] flex-col justify-center rounded-lg border border-dashed border-grey-40 bg-white/80 p-8 text-center backdrop-blur-sm">
        <div className="mb-4 flex justify-center">
          <Plus size={32} className="text-grey-70" />
        </div>
        <p className="mb-2 font-medium text-grey-100">가계도를 시작하세요</p>
        <p className="text-sm text-grey-70">
          하단 도구에서 구성원 추가를 선택한 후
          <br />
          캔버스를 클릭해서 추가하세요
        </p>
        {actions && (
          <div className="pointer-events-auto mt-4 flex justify-center border-t border-grey-40 pt-4">
            {actions}
          </div>
        )}
      </div>
    </Panel>
  );
};

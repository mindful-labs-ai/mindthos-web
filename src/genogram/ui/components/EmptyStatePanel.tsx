import React from 'react';

import { Panel } from '@xyflow/react';
import { Plus } from 'lucide-react';

/** 노드가 없을 때 표시되는 빈 상태 안내 */
export const EmptyStatePanel: React.FC = () => {
  return (
    <Panel
      position="top-left"
      className="!absolute !inset-0 !m-0 flex items-center justify-center pointer-events-none"
    >
      <div className="h-[200px] w-[280px] rounded-lg border border-dashed border-border bg-white/80 p-8 text-center backdrop-blur-sm flex flex-col justify-center">
        <div className="mb-4 flex justify-center">
          <Plus size={32} className="text-fg-muted" />
        </div>
        <p className="mb-2 font-medium text-fg">가계도를 시작하세요</p>
        <p className="text-sm text-fg-muted">
          하단 도구에서 구성원 추가를 선택한 후
          <br />
          캔버스를 클릭하여 추가합니다
        </p>
      </div>
    </Panel>
  );
};

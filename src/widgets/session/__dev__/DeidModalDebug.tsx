/**
 * [DEV ONLY] 비식별화 모달 디버그 도구
 * 각 phase를 수동으로 전환하며 UI 확인 가능
 * 사용: 아무 페이지에 <DeidModalDebug /> 추가
 * 삭제: 이 파일과 import 제거
 */
import React, { useState } from 'react';

import {
  DeidentificationModal,
  type DeidModalPhase,
  type DeidStats,
} from '../DeidentificationModal';

const MOCK_STATS: DeidStats = {
  total_segments: 150,
  deid_segments: 12,
  deid_tags: 18,
  consistency_rate: 100,
  nv_preserve_rate: 100,
};

export const DeidModalDebug: React.FC = () => {
  const [open, setOpen] = useState(false);
  const [phase, setPhase] = useState<DeidModalPhase>('confirm');

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 16,
        left: 16,
        zIndex: 99999,
        background: '#1a1a1a',
        color: '#fff',
        borderRadius: 8,
        padding: 12,
        fontSize: 12,
        display: 'flex',
        flexDirection: 'column',
        gap: 6,
        boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
      }}
    >
      <span style={{ fontWeight: 700, marginBottom: 4 }}>
        Deid Modal Debug
      </span>
      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
        {(['confirm', 'loading', 'complete', 'error'] as DeidModalPhase[]).map(
          (p) => (
            <button
              key={p}
              onClick={() => {
                setPhase(p);
                setOpen(true);
              }}
              style={{
                padding: '4px 8px',
                borderRadius: 4,
                border: 'none',
                cursor: 'pointer',
                fontSize: 11,
                fontWeight: 600,
                background:
                  p === 'confirm'
                    ? '#44CE4B'
                    : p === 'loading'
                      ? '#3B82F6'
                      : p === 'complete'
                        ? '#22C55E'
                        : '#EF4444',
                color: '#fff',
              }}
            >
              {p}
            </button>
          )
        )}
      </div>

      <DeidentificationModal
        open={open}
        onOpenChange={setOpen}
        onConfirm={() => {
          setPhase('loading');
          setTimeout(() => setPhase('complete'), 2000);
        }}
        phase={phase}
        stats={phase === 'complete' ? MOCK_STATS : null}
        errorMessage={
          phase === 'error'
            ? '비식별화에 필요한 크레딧이 부족합니다.'
            : undefined
        }
      />
    </div>
  );
};

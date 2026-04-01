import React, { useEffect, useState } from 'react';

import type {
  InfluenceStatus,
  ParentChildStatus,
  RelationStatus,
} from '@/genogram/core/types/enums';

import { FamilyIcon } from './icons/FamilyIcon';
import { ParentChildIcon } from './icons/ParentChildIcon';
import { PartnerIcon } from './icons/PartnerIcon';
import { RelationIcon } from './icons/RelationIcon';

interface ConnectionCursorProps {
  connectionKind: 'relation' | 'influence' | 'partner' | 'child' | 'parent';
  relationStatus?: (typeof RelationStatus)[keyof typeof RelationStatus];
  influenceStatus?: (typeof InfluenceStatus)[keyof typeof InfluenceStatus];
  childStatus?: (typeof ParentChildStatus)[keyof typeof ParentChildStatus];
  visible: boolean;
}

export const ConnectionCursor: React.FC<ConnectionCursorProps> = ({
  connectionKind,
  relationStatus,
  influenceStatus,
  childStatus,
  visible,
}) => {
  const [pos, setPos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    if (!visible) return;

    const handleMouseMove = (e: MouseEvent) => {
      setPos({ x: e.clientX, y: e.clientY });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [visible]);

  if (!visible) return null;

  // relation/influence → RelationIcon (status별 세부 아이콘)
  // partner/child → 전용 아이콘
  const renderIcon = () => {
    if (connectionKind === 'relation' && relationStatus) {
      return <RelationIcon value={relationStatus} />;
    }
    if (connectionKind === 'influence' && influenceStatus) {
      return <RelationIcon value={influenceStatus} />;
    }
    if (connectionKind === 'partner') {
      return <PartnerIcon value="Marriage" />;
    }
    if (connectionKind === 'child') {
      return <ParentChildIcon value={childStatus ?? 'Biological_Child'} />;
    }
    if (connectionKind === 'parent') {
      return <FamilyIcon size={24} />;
    }
    // fallback: 기본 관계 연결 아이콘
    return (
      <svg width="20" height="20" viewBox="0 0 32 32" fill="none">
        <path
          d="M3 17.5156L17.5185 2.99711"
          stroke="#3C3C3C"
          strokeWidth="2"
          strokeLinecap="round"
        />
        <path
          d="M12 28.5938L28.5926 12.0012"
          stroke="#3C3C3C"
          strokeWidth="2"
          strokeLinecap="round"
          strokeDasharray="4 4"
        />
        <path
          d="M6 22H8.30303H11.1818V19.5V17H13.4848H15.7879V14.5V12H18.0909H20.3939V9.5V7H22.697H25"
          stroke="#3C3C3C"
          strokeWidth="2"
          strokeLinecap="round"
        />
      </svg>
    );
  };

  return (
    <div
      className="pointer-events-none fixed z-[9999]"
      style={{
        left: pos.x + 14,
        top: pos.y + 14,
      }}
    >
      <div className="flex items-center justify-center rounded-md bg-white/90 p-1 shadow-sm ring-1 ring-grey-30">
        {renderIcon()}
      </div>
    </div>
  );
};

import React, { useEffect, useState } from 'react';

import type {
  InfluenceStatus,
  ParentChildStatus,
  RelationStatus,
} from '@/genogram/core/types/enums';

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
      return (
        <svg width="24" height="24" viewBox="0 0 32 32" fill="none">
          <g clipPath="url(#cursor-family-clip)">
            <path
              d="M2 3.77789V10.2223C2 10.8446 2 11.1553 2.1211 11.393C2.22763 11.6021 2.39748 11.7725 2.60655 11.879C2.844 12 3.155 12 3.77606 12H10.2239C10.845 12 11.1556 12 11.393 11.879C11.6021 11.7725 11.7725 11.6021 11.879 11.393C12 11.1556 12 10.845 12 10.2239V3.77606C12 3.155 12 2.844 11.879 2.60655C11.7725 2.39748 11.6021 2.22763 11.393 2.1211C11.1553 2 10.8446 2 10.2223 2H3.77789C3.15561 2 2.84423 2 2.60655 2.1211C2.39748 2.22763 2.22763 2.39748 2.1211 2.60655C2 2.84423 2 3.15561 2 3.77789Z"
              stroke="#3C3C3C"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M20 7C20 9.76142 22.2386 12 25 12C27.7614 12 30 9.76142 30 7C30 4.23858 27.7614 2 25 2C22.2386 2 20 4.23858 20 7Z"
              stroke="#3C3C3C"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M11 25C11 27.7614 13.2386 30 16 30C18.7614 30 21 27.7614 21 25C21 22.2386 18.7614 20 16 20C13.2386 20 11 22.2386 11 25Z"
              stroke="#3C3C3C"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path d="M7 13V16H25V13" stroke="#3C3C3C" strokeWidth="2" />
            <path d="M16 16V19" stroke="#3C3C3C" strokeWidth="2" />
          </g>
          <defs>
            <clipPath id="cursor-family-clip">
              <rect width="32" height="32" fill="white" />
            </clipPath>
          </defs>
        </svg>
      );
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

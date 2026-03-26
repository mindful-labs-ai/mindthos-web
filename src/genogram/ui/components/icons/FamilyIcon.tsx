import React from 'react';

/** 가족 아이콘: 사각형(남) + 원(여) 수평 연결, 아래 작은 원(자녀) */
export const FamilyIcon: React.FC<{ size?: number }> = ({ size = 24 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 32 32"
    fill="none"
  >
    <g clipPath="url(#family-icon-clip)">
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
      <clipPath id="family-icon-clip">
        <rect width="32" height="32" fill="white" />
      </clipPath>
    </defs>
  </svg>
);

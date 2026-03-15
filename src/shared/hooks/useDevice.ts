import { useState, useEffect } from 'react';

export type DeviceType = 'mobile' | 'tablet' | 'desktop';

export interface UseDeviceReturn {
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  deviceType: DeviceType;
}

// Tailwind breakpoints
const BREAKPOINTS = {
  sm: 640, // mobile → sm
  md: 768, // tablet → md
} as const;

function getDeviceType(width: number): DeviceType {
  if (width < BREAKPOINTS.sm) return 'mobile';
  if (width < BREAKPOINTS.md) return 'tablet';
  return 'desktop';
}

function checkIsMobileUserAgent(): boolean {
  if (typeof navigator === 'undefined') return false;
  return /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini|mobile/i.test(
    navigator.userAgent.toLowerCase()
  );
}

export function useDevice(): UseDeviceReturn {
  const [deviceType, setDeviceType] = useState<DeviceType>(() => {
    if (typeof window === 'undefined') return 'desktop';
    return getDeviceType(window.innerWidth);
  });

  useEffect(() => {
    // matchMedia를 primary로 브레이크포인트 경계 감지
    const mobileQuery = window.matchMedia(
      `(max-width: ${BREAKPOINTS.sm - 1}px)`
    );
    const tabletQuery = window.matchMedia(
      `(min-width: ${BREAKPOINTS.sm}px) and (max-width: ${BREAKPOINTS.md - 1}px)`
    );

    // innerWidth를 보조로 정확한 값 동기화
    const updateDeviceType = () => {
      setDeviceType(getDeviceType(window.innerWidth));
    };

    mobileQuery.addEventListener('change', updateDeviceType);
    tabletQuery.addEventListener('change', updateDeviceType);

    return () => {
      mobileQuery.removeEventListener('change', updateDeviceType);
      tabletQuery.removeEventListener('change', updateDeviceType);
    };
  }, []);

  const isMobileByUserAgent = checkIsMobileUserAgent();
  const isMobile = deviceType === 'mobile' || isMobileByUserAgent;
  const isTablet = deviceType === 'tablet';
  const isDesktop = deviceType === 'desktop' && !isMobileByUserAgent;

  return {
    isMobile,
    isTablet,
    isDesktop,
    deviceType: isMobile ? 'mobile' : isTablet ? 'tablet' : 'desktop',
  };
}

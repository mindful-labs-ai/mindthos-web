import { useEffect, useState } from 'react';

/**
 * 모바일 브라우저에서 동적으로 변하는 viewport 높이를 추적하는 훅
 * 주소창/툴바가 나타나거나 사라질 때 높이가 변경됨
 */
export const useViewportHeight = () => {
  const [viewportHeight, setViewportHeight] = useState(
    typeof window !== 'undefined' ? window.innerHeight : 0
  );

  useEffect(() => {
    const updateHeight = () => {
      setViewportHeight(window.innerHeight);
    };

    // 초기 높이 설정
    updateHeight();

    // resize 이벤트 리스너
    window.addEventListener('resize', updateHeight);

    // visualViewport API 지원 시 (모바일 키보드, 주소창 등 대응)
    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', updateHeight);
    }

    return () => {
      window.removeEventListener('resize', updateHeight);
      if (window.visualViewport) {
        window.visualViewport.removeEventListener('resize', updateHeight);
      }
    };
  }, []);

  return viewportHeight;
};

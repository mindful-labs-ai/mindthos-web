/**
 * 가계도 안내 모달의 스텝 정의
 */
export interface GuideStep {
  /** 스텝 고유 ID */
  id: string;
  /** 이미지 URL (public 폴더 기준 경로) */
  imageSrc: string;
  /** 이미지 alt 텍스트 */
  imageAlt: string;
  /** 메인 텍스트 (강조할 부분은 **text** 형식) */
  mainText: string;
  /** 서브 텍스트 */
  subText: string;
}

/**
 * 가계도 안내 모달 Props
 */
export interface GenogramGuideModalProps {
  /** 모달 열림 상태 */
  open: boolean;
  /** 모달 열림 상태 변경 핸들러 */
  onOpenChange: (open: boolean) => void;
  /** 스텝 데이터 배열 (확장 가능) */
  steps: GuideStep[];
  /** 완료 콜백 */
  onComplete?: () => void;
  /** "다시 보지 않기" 클릭 콜백 */
  onDontShowAgain?: () => void;
}

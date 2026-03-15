/**
 * 가계도 이미지 캡처 훅
 *
 * PDF 보고서 생성 시 genogram_image 섹션의 graphData를
 * 실제 이미지로 캡처하는 과정을 관리한다.
 *
 * [사용법]
 * const { processReport, isCapturing } = useGenogramCapture(genogramRef);
 * const resolvedSections = await processReport(sections);
 */

import { useCallback, useState } from 'react';
import type { RefObject } from 'react';

import type { GenogramPageHandle } from '@/genogram';

import type { ReportSection } from '../types/reportSchema';
import { captureGenogramImages } from '../utils/captureGenogramImages';

export function useGenogramCapture(
  genogramRef: RefObject<GenogramPageHandle | null>
) {
  const [isCapturing, setIsCapturing] = useState(false);

  /**
   * report sections 내의 graphData를 캡처하여 imageData로 변환
   * 캡처 완료 후 가계도는 원본 상태로 복원됨
   */
  const processReport = useCallback(
    async (sections: ReportSection[]): Promise<ReportSection[]> => {
      setIsCapturing(true);
      try {
        return await captureGenogramImages(sections, genogramRef);
      } finally {
        setIsCapturing(false);
      }
    },
    [genogramRef]
  );

  return { processReport, isCapturing };
}

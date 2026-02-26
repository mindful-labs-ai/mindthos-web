/**
 * 가계도 이미지 캡처 유틸리티
 *
 * AI JSON 응답의 genogram_image 섹션에 graphData가 포함된 경우,
 * 백그라운드 GenogramPage에서 렌더링 → 캡처 → imageData로 변환한다.
 *
 * [흐름]
 * 1. 원본 가계도 상태 저장 (toJSON)
 * 2. 각 graphData에 대해: loadJSON → 렌더 대기 → captureImage
 * 3. 원본 복원 (loadJSON)
 * 4. 캡처된 이미지가 채워진 sections 반환
 */

import type { RefObject } from 'react';

import type { GenogramPageHandle } from '@/genogram';

import type {
  GenogramImageSection,
  RelationPatternSection,
  ReportSection,
} from '../types/reportSchema';

/** 렌더링 완료 대기 (ms) */
const RENDER_DELAY = 400;

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * report sections 내의 genogram_image 섹션 중 graphData가 있는 것을 캡처하여 imageData로 변환
 *
 * @param sections - AI가 반환한 report sections
 * @param genogramRef - 마운트된 GenogramPage의 ref
 * @returns graphData가 imageData로 변환된 sections (원본 배열은 변경하지 않음)
 */
export async function captureGenogramImages(
  sections: ReportSection[],
  genogramRef: RefObject<GenogramPageHandle | null>,
): Promise<ReportSection[]> {
  const handle = genogramRef.current;
  if (!handle) return sections;

  // graphData가 있는 섹션 인덱스 수집
  const targets: {
    index: number;
    section: GenogramImageSection | RelationPatternSection;
  }[] = [];
  sections.forEach((section, index) => {
    if (
      (section.type === 'genogram_image' ||
        section.type === 'relation_pattern') &&
      section.graphData &&
      !section.imageData
    ) {
      targets.push({ index, section });
    }
  });

  if (targets.length === 0) return sections;

  // 원본 상태 저장
  const originalJson = handle.toJSON();

  // 결과 배열 (불변)
  const result = [...sections];

  try {
    for (const { index, section } of targets) {
      // 부분 그래프 데이터 로드
      handle.loadJSON(section.graphData!);

      // 렌더링 완료 대기
      await delay(RENDER_DELAY);

      // 캡처
      const imageData = await handle.captureImage();

      if (imageData) {
        result[index] = {
          ...section,
          imageData,
        };
      }
    }
  } finally {
    // 원본 복원 (에러 발생해도 반드시 실행)
    handle.loadJSON(originalJson);
  }

  return result;
}

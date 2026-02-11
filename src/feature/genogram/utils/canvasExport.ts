import html2canvas from 'html2canvas';

import {
  BACKGROUND_OPTIONS,
  DEFAULT_WATERMARK_OPACITY,
  type BackgroundOptionId,
} from '../components/export/constants';

export interface ExportOptions {
  backgroundId: BackgroundOptionId;
  showWatermark: boolean;
  watermarkSrc?: string;
}

// 워터마크 타일 설정
const WATERMARK_TILE_WIDTH = 1200;
const WATERMARK_ROTATION_DEG = -30;
const WATERMARK_GAP_X = 750;
const WATERMARK_GAP_Y = 500;

/**
 * ReactFlow 컨테이너를 캡처하여 이미지 데이터 URL로 반환
 */
export async function captureGenogramCanvas(
  element: HTMLElement
): Promise<string> {
  const canvas = await html2canvas(element, {
    backgroundColor: null,
    scale: 2,
    useCORS: true,
    logging: false,
  });

  return canvas.toDataURL('image/png');
}

/**
 * 이미지에 배경색과 워터마크를 적용하여 새 이미지 URL 반환
 */
export async function applyExportOptions(
  imageDataUrl: string,
  options: ExportOptions
): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        reject(new Error('Canvas context not available'));
        return;
      }

      canvas.width = img.width;
      canvas.height = img.height;

      // 배경 그리기
      const bgOption = BACKGROUND_OPTIONS.find(
        (opt) => opt.id === options.backgroundId
      );
      if (bgOption && bgOption.color !== 'transparent') {
        ctx.fillStyle = bgOption.color;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }

      // 원본 이미지 그리기
      ctx.drawImage(img, 0, 0);

      // 워터마크 그리기 (타일 패턴)
      if (options.showWatermark && options.watermarkSrc) {
        const watermark = new Image();
        watermark.onload = () => {
          const wmWidth = WATERMARK_TILE_WIDTH;
          const wmHeight = (watermark.height / watermark.width) * wmWidth;
          const rotationRad = (WATERMARK_ROTATION_DEG * Math.PI) / 180;

          ctx.globalAlpha = DEFAULT_WATERMARK_OPACITY;

          // 타일 패턴으로 반복 배치
          const stepX = wmWidth + WATERMARK_GAP_X;
          const stepY = wmHeight + WATERMARK_GAP_Y;

          // 회전을 고려해 더 넓은 영역 커버
          const diagonal = Math.sqrt(
            canvas.width * canvas.width + canvas.height * canvas.height
          );
          const startOffset = -diagonal / 2;

          for (let y = startOffset; y < diagonal; y += stepY) {
            for (let x = startOffset; x < diagonal; x += stepX) {
              ctx.save();
              ctx.translate(canvas.width / 2, canvas.height / 2);
              ctx.rotate(rotationRad);
              ctx.drawImage(
                watermark,
                x - wmWidth / 2,
                y - wmHeight / 2,
                wmWidth,
                wmHeight
              );
              ctx.restore();
            }
          }

          ctx.globalAlpha = 1;
          resolve(canvas.toDataURL('image/png'));
        };
        watermark.onerror = () => {
          resolve(canvas.toDataURL('image/png'));
        };
        watermark.src = options.watermarkSrc;
      } else {
        resolve(canvas.toDataURL('image/png'));
      }
    };

    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = imageDataUrl;
  });
}

/**
 * 이미지 다운로드
 */
export function downloadImage(dataUrl: string, fileName: string): void {
  const link = document.createElement('a');
  link.download = `${fileName}.png`;
  link.href = dataUrl;
  link.click();
}

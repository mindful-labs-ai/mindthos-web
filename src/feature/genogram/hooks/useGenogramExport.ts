import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { type BackgroundOptionId } from '../components/export/constants';
import {
  applyExportOptions,
  downloadImage,
  type ExportOptions,
} from '../utils/canvasExport';

interface UseGenogramExportOptions {
  rawImageData: string | null;
  watermarkSrc?: string;
}

export function useGenogramExport({
  rawImageData,
  watermarkSrc,
}: UseGenogramExportOptions) {
  const [backgroundId, setBackgroundId] =
    useState<BackgroundOptionId>('transparent');
  const [showWatermark, setShowWatermark] = useState(true);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // 요청 취소를 위한 ref
  const abortControllerRef = useRef<AbortController | null>(null);

  // 옵션 키 (변경 감지용)
  const optionsKey = useMemo(
    () =>
      `${rawImageData?.slice(0, 100)}-${backgroundId}-${showWatermark}-${watermarkSrc}`,
    [rawImageData, backgroundId, showWatermark, watermarkSrc]
  );

  // 옵션 변경 시 미리보기 재생성
  useEffect(() => {
    // 이전 요청 취소
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // rawImageData가 없으면 처리하지 않음
    if (!rawImageData) {
      return;
    }

    const controller = new AbortController();
    abortControllerRef.current = controller;

    const options: ExportOptions = {
      backgroundId,
      showWatermark,
      watermarkSrc,
    };

    // 비동기 처리 시작
    const processImage = async () => {
      setIsProcessing(true);
      try {
        const url = await applyExportOptions(rawImageData, options);
        if (!controller.signal.aborted) {
          setPreviewUrl(url);
        }
      } catch {
        if (!controller.signal.aborted) {
          setPreviewUrl(null);
        }
      } finally {
        if (!controller.signal.aborted) {
          setIsProcessing(false);
        }
      }
    };

    processImage();

    return () => {
      controller.abort();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [optionsKey]);

  // rawImageData가 null이면 previewUrl도 null로 표시
  const effectivePreviewUrl = rawImageData ? previewUrl : null;

  // 이미지 다운로드
  const download = useCallback(
    (fileName: string) => {
      if (!effectivePreviewUrl) return;
      downloadImage(effectivePreviewUrl, fileName);
    },
    [effectivePreviewUrl]
  );

  return {
    backgroundId,
    setBackgroundId,
    showWatermark,
    setShowWatermark,
    previewUrl: effectivePreviewUrl,
    isProcessing,
    download,
  };
}

import { useEffect, useState } from 'react';

import { X } from 'lucide-react';

import { useCreditInfo } from '@/feature/settings/hooks/useCreditInfo';
import { isProPlan } from '@/feature/settings/utils/planUtils';
import { useModalStore } from '@/stores/modalStore';

import { useGenogramExport } from '../../hooks/useGenogramExport';

import { BackgroundSelector } from './BackgroundSelector';
import { ExportPreview } from './ExportPreview';

interface GenogramExportModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  imageData: string | null;
  defaultFileName: string;
  watermarkSrc?: string;
}

export function GenogramExportModal({
  open,
  onOpenChange,
  imageData,
  defaultFileName,
  watermarkSrc,
}: GenogramExportModalProps) {
  const [fileName, setFileName] = useState(defaultFileName);
  const [showUpgradeTooltip, setShowUpgradeTooltip] = useState(false);

  const { creditInfo } = useCreditInfo();
  const openModal = useModalStore((state) => state.openModal);
  const isPro = isProPlan(creditInfo?.plan.type);

  const {
    backgroundId,
    setBackgroundId,
    showWatermark,
    setShowWatermark,
    previewUrl,
    isProcessing,
    download,
  } = useGenogramExport({
    rawImageData: imageData,
    watermarkSrc,
  });

  const handleWatermarkClick = () => {
    if (isPro) {
      setShowWatermark(!showWatermark);
    } else {
      setShowUpgradeTooltip(true);
    }
  };

  // 파일명: 사용자 입력이 없으면 defaultFileName 사용
  const displayFileName = fileName || defaultFileName;

  // ESC 키로 닫기
  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onOpenChange(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open, onOpenChange]);

  // 스크롤 방지
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = '';
      };
    }
  }, [open]);

  const handleDownload = () => {
    download(displayFileName);
    onOpenChange(false);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        role="presentation"
        className="absolute inset-0 bg-black/50"
        onClick={() => onOpenChange(false)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            onOpenChange(false);
          }
        }}
      />

      {/* Modal */}
      <div className="relative z-10 max-h-[90vh] w-full max-w-[512px] overflow-y-auto rounded-2xl bg-white shadow-xl">
        {/* 헤더 */}
        <div className="sticky top-0 z-10 bg-white px-6 pt-8">
          <h2 className="select-none text-center text-2xl font-semibold text-fg">
            가계도 이미지 출력하기
          </h2>
          <button
            type="button"
            className="absolute right-4 top-4 rounded-lg p-2 text-fg-muted transition-colors hover:bg-surface-contrast hover:text-fg"
            onClick={() => onOpenChange(false)}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* 콘텐츠 */}
        <div className="flex flex-col gap-6 px-10 py-6">
          {/* 파일명 */}
          <div>
            <label
              htmlFor="export-filename"
              className="mb-2 block select-none text-base font-semibold text-fg"
            >
              파일명
            </label>
            <input
              id="export-filename"
              type="text"
              value={fileName}
              onChange={(e) => setFileName(e.target.value)}
              placeholder={defaultFileName}
              className="w-full rounded-lg border border-border bg-surface-contrast px-4 py-3 text-sm outline-none transition-colors focus:border-primary"
            />
          </div>

          {/* 미리보기 */}
          <ExportPreview imageUrl={previewUrl} isLoading={isProcessing} />

          {/* 이미지 배경 */}
          <BackgroundSelector value={backgroundId} onChange={setBackgroundId} />

          {/* 워터마크 제거 */}
          <div className="relative">
            <div className="flex items-center justify-between">
              <div className="flex select-none items-center gap-2">
                <span className="text-base font-semibold text-fg">
                  워터마크 제거
                </span>
                <span className="rounded-full bg-primary px-2 py-0.5 text-xs font-medium text-white">
                  프로
                </span>
              </div>
              <button
                type="button"
                onClick={handleWatermarkClick}
                className={`relative flex h-6 w-6 cursor-pointer items-center justify-center rounded-full border-2 transition-colors ${
                  !showWatermark
                    ? 'border-primary bg-primary'
                    : 'border-border bg-surface-strong'
                } ${!isPro ? 'opacity-50' : ''}`}
              >
                <span
                  className={`text-sm font-bold text-white transition-opacity ${
                    !showWatermark ? 'opacity-100' : 'opacity-0'
                  }`}
                >
                  ✓
                </span>
              </button>
            </div>

            {/* 업그레이드 팝업 */}
            {showUpgradeTooltip && !isPro && (
              <div className="absolute bottom-full right-1 z-20 mb-3 w-fit rounded-lg border border-border bg-white p-4 shadow-md">
                <button
                  type="button"
                  className="absolute right-2 top-2 text-fg-muted hover:text-fg"
                  onClick={() => setShowUpgradeTooltip(false)}
                >
                  <X className="h-4 w-4" />
                </button>
                <p className="flex gap-[7px] pr-4 text-sm text-fg">
                  플랜 업그레이드 후 이용 가능합니다.
                  <button
                    type="button"
                    onClick={() => openModal('planChange')}
                    className="font-semibold text-primary underline"
                  >
                    플랜 보기
                  </button>
                </p>
                <p className="mt-1 text-xs text-fg-muted">
                  마음토스의 더 많은 기능을 만나보세요.
                </p>
              </div>
            )}
          </div>

          {/* 출력 버튼 */}
          <button
            type="button"
            onClick={handleDownload}
            disabled={!previewUrl || isProcessing}
            className="mt-2 w-full rounded-lg bg-primary py-4 text-base font-medium text-white transition-colors hover:bg-primary-400 disabled:cursor-not-allowed"
          >
            이미지 출력하기
          </button>
        </div>
      </div>
    </div>
  );
}

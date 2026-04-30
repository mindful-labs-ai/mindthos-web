import { useEffect, useState } from 'react';

import { X } from 'lucide-react';

import { useGenogramExport } from '@/features/genogram/hooks/useGenogramExport';
import { useCreditInfo } from '@/features/settings/hooks/useCreditInfo';
import { isPlusOrAbove } from '@/features/settings/utils/planUtils';
import { trackEvent } from '@/lib/mixpanel';
import { MixpanelEvent } from '@/shared/constants/mixpanelEvents';
import { useDevice } from '@/shared/hooks/useDevice';
import { Button } from '@/shared/ui/atoms/Button';
import { Modal } from '@/shared/ui/composites/Modal';
import { useModalStore } from '@/stores/modalStore';

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
  const { isMobile, isTablet } = useDevice();
  const isMobileView = isMobile || isTablet;

  const { creditInfo } = useCreditInfo();
  const openModal = useModalStore((state) => state.openModal);
  const isPro = isPlusOrAbove(creditInfo?.plan.type);

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

  useEffect(() => {
    if (open) {
      trackEvent(MixpanelEvent.GenogramExportModalOpen);
    }
  }, [open]);

  const handleWatermarkClick = () => {
    if (isPro) {
      const nextValue = !showWatermark;
      setShowWatermark(nextValue);
      trackEvent(MixpanelEvent.GenogramExportWatermarkToggle, {
        enabled: !nextValue,
      });
    } else {
      setShowUpgradeTooltip(true);
    }
  };

  // 파일명: 사용자 입력이 없으면 defaultFileName 사용
  const displayFileName = fileName || defaultFileName;

  const handleDownload = () => {
    trackEvent(MixpanelEvent.GenogramExportDownload);
    download(displayFileName);
    onOpenChange(false);
  };

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      className="max-w-[512px] border-none p-0"
    >
      {/* 헤더 */}
      <div className="px-6 pt-8">
        <h2 className="typo-xl select-none text-center font-emphasize text-fg">
          가계도 이미지 출력하기
        </h2>
      </div>

      {/* 콘텐츠 */}
      <div className="flex flex-col gap-6 px-10 py-6">
        {/* 파일명 */}
        <div>
          <label
            htmlFor="export-filename"
            className="typo-m mb-2 block select-none font-emphasize text-fg"
          >
            파일명
          </label>
          <input
            id="export-filename"
            type="text"
            value={fileName}
            onChange={(e) => setFileName(e.target.value)}
            placeholder={defaultFileName}
            className="typo-sm w-full rounded-lg border border-border bg-surface-contrast px-4 py-3 outline-none transition-colors focus:border-primary"
          />
        </div>

        {/* 미리보기 */}
        <ExportPreview imageUrl={previewUrl} isLoading={isProcessing} />

        {/* 이미지 배경 */}
        <BackgroundSelector
          value={backgroundId}
          onChange={(id) => {
            setBackgroundId(id);
            trackEvent(MixpanelEvent.GenogramExportBackgroundChange, {
              background: id,
            });
          }}
        />

        {/* 워터마크 제거 */}
        <div className="relative">
          <div className="flex items-center justify-between">
            <div className="flex select-none items-center gap-2">
              <span className="typo-m font-emphasize text-fg">
                워터마크 제거
              </span>
              <span className="typo-xs rounded-full bg-primary px-2 py-0.5 font-medium text-primary-fg">
                플러스
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
                className={`typo-sm font-headline text-primary-fg transition-opacity ${
                  !showWatermark ? 'opacity-100' : 'opacity-0'
                }`}
              >
                ✓
              </span>
            </button>
          </div>

          {/* 업그레이드 팝업 */}
          {showUpgradeTooltip && !isPro && !isMobileView && (
            <div className="absolute bottom-full right-1 z-20 mb-3 w-fit rounded-lg border border-border bg-surface p-4 shadow-md">
              <button
                type="button"
                className="absolute right-2 top-2 text-fg-muted lg:hover:text-fg"
                onClick={() => setShowUpgradeTooltip(false)}
              >
                <X className="h-4 w-4" />
              </button>
              <p className="typo-sm flex gap-[7px] pr-4 text-fg">
                상위 플랜에서 이용할 수 있어요.
                <button
                  type="button"
                  onClick={() => openModal('planChange')}
                  className="font-emphasize text-primary underline"
                >
                  플랜 보기
                </button>
              </p>
              <p className="typo-xs mt-1 text-fg-muted">
                마음토스의 더 많은 기능을 만나보세요.
              </p>
            </div>
          )}

          {/* 모바일/태블릿: 업그레이드 모달 */}
          {isMobileView && (
            <Modal
              open={showUpgradeTooltip && !isPro}
              onOpenChange={setShowUpgradeTooltip}
              disableHistory
              className="mx-4 max-w-sm px-6 py-8"
            >
              <div className="flex flex-col items-center gap-6 text-center">
                <h2 className="text-xl font-emphasize text-grey-100">
                  플러스 기능 안내
                </h2>
                <div className="flex flex-col gap-2">
                  <p className="text-m font-emphasize text-grey-100">
                    상위 플랜에서 이용할 수 있어요.
                  </p>
                  <p className="text-sm text-grey-60">
                    상위 플랜으로 변경하고
                    <br />
                    마음토스의 더 많은 기능을 만나보세요.
                  </p>
                </div>
                <Button
                  variant="solid"
                  tone="primary"
                  size="lg"
                  onClick={() => {
                    setShowUpgradeTooltip(false);
                    openModal('planChange');
                  }}
                  className="w-full"
                >
                  플랜 보기
                </Button>
              </div>
            </Modal>
          )}
        </div>

        {/* 출력 버튼 */}
        <button
          type="button"
          onClick={handleDownload}
          disabled={!previewUrl || isProcessing}
          className="typo-m lg:hover:bg-primary-400 mt-2 w-full rounded-lg bg-primary py-4 font-medium text-primary-fg transition-colors disabled:cursor-not-allowed"
        >
          이미지 출력하기
        </button>
      </div>
    </Modal>
  );
}

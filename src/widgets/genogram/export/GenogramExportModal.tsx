import { useState } from 'react';

import { X } from 'lucide-react';

import { useGenogramExport } from '@/features/genogram/hooks/useGenogramExport';
import { useCreditInfo } from '@/features/settings/hooks/useCreditInfo';
import { isProPlan } from '@/features/settings/utils/planUtils';
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

  const handleDownload = () => {
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
        <h2 className="typo-2xl select-none text-center font-emphasize text-fg">
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
        <BackgroundSelector value={backgroundId} onChange={setBackgroundId} />

        {/* 워터마크 제거 */}
        <div className="relative">
          <div className="flex items-center justify-between">
            <div className="flex select-none items-center gap-2">
              <span className="typo-m font-emphasize text-fg">
                워터마크 제거
              </span>
              <span className="typo-xs rounded-full bg-primary px-2 py-0.5 font-medium text-primary-fg">
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
                className={`typo-sm font-headline text-primary-fg transition-opacity ${
                  !showWatermark ? 'opacity-100' : 'opacity-0'
                }`}
              >
                ✓
              </span>
            </button>
          </div>

          {/* 업그레이드 팝업 */}
          {showUpgradeTooltip && !isPro && (
            <div className="absolute bottom-full right-1 z-20 mb-3 w-fit rounded-lg border border-border bg-surface p-4 shadow-md">
              <button
                type="button"
                className="absolute right-2 top-2 text-fg-muted hover:text-fg"
                onClick={() => setShowUpgradeTooltip(false)}
              >
                <X className="h-4 w-4" />
              </button>
              <p className="typo-sm flex gap-[7px] pr-4 text-fg">
                플랜 업그레이드 후 이용 가능합니다.
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
        </div>

        {/* 출력 버튼 */}
        <button
          type="button"
          onClick={handleDownload}
          disabled={!previewUrl || isProcessing}
          className="typo-m hover:bg-primary-400 mt-2 w-full rounded-lg bg-primary py-4 font-medium text-primary-fg transition-colors disabled:cursor-not-allowed"
        >
          이미지 출력하기
        </button>
      </div>
    </Modal>
  );
}

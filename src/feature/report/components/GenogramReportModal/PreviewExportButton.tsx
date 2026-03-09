import { useEffect, useState } from 'react';

import { Check } from 'lucide-react';

interface PreviewExportButtonProps {
  disabled: boolean;
  onExport: () => void;
  onBackToList: () => void;
}

export function PreviewExportButton({
  disabled,
  onExport,
  onBackToList,
}: PreviewExportButtonProps) {
  const [countdown, setCountdown] = useState<number | null>(null);
  const isCountingDown = countdown !== null && countdown > 0;
  const isComplete = countdown === 0;

  useEffect(() => {
    if (countdown === null || countdown <= 0) return;
    const timer = setTimeout(() => setCountdown((c) => (c ?? 1) - 1), 1000);
    return () => clearTimeout(timer);
  }, [countdown]);

  const handleExport = () => {
    onExport();
    setCountdown(3);
  };

  if (isComplete) {
    return (
      <button
        type="button"
        onClick={onBackToList}
        className="w-full rounded-xl border border-primary py-3.5 text-center text-base font-semibold text-primary transition-colors hover:bg-primary hover:text-white"
      >
        목록으로 돌아가기
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={handleExport}
      disabled={disabled || isCountingDown}
      className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3.5 text-center text-base font-semibold text-white transition-colors hover:bg-primary-400 disabled:cursor-not-allowed disabled:opacity-50"
    >
      {isCountingDown ? (
        <>
          <Check className="h-5 w-5" />
          <span>출력 완료 ({countdown})</span>
        </>
      ) : (
        'PDF 출력하기'
      )}
    </button>
  );
}

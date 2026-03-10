import { useState } from 'react';

export function SeminarPromptStep() {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="flex flex-col items-center text-center">
      <p className="text-lg font-bold text-fg">
        가계도 보고서는 세미나 수료 후
        <br />
        이용할 수 있습니다.
      </p>
      <p className="mt-2 text-sm text-fg-muted">
        마음토스 홈페이지에서 가계도 세미나를
        <br />
        신청할 수 있습니다.
      </p>

      <button
        type="button"
        onClick={() => setIsExpanded(true)}
        className="my-6 w-full"
      >
        <img
          src="/genogram/genogram-seminar.png"
          alt="가계도 세미나 안내"
          className="w-full rounded-2xl border-2 border-border object-cover transition-opacity hover:opacity-90"
        />
      </button>

      {isExpanded && (
        <button
          type="button"
          onClick={() => setIsExpanded(false)}
          className="fixed inset-0 z-overlay flex items-center justify-center bg-black/70"
        >
          <img
            src="/genogram/genogram-seminar.png"
            alt="가계도 세미나 안내"
            className="max-h-[90vh] max-w-[90vw] rounded-2xl object-contain"
          />
        </button>
      )}

      <p className="mb-12 text-sm text-fg">
        마음토스 가계도 세미나는 가족 치료 학회의
        <br />
        가계도 권위자 이인수 교수님과 함께합니다.
      </p>
    </div>
  );
}

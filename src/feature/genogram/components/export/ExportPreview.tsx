interface ExportPreviewProps {
  imageUrl: string | null;
  isLoading?: boolean;
}

export function ExportPreview({ imageUrl, isLoading }: ExportPreviewProps) {
  return (
    <div>
      <span className="mb-2 block select-none text-base font-semibold text-fg">
        미리보기
      </span>
      <div
        className={`relative mx-auto flex aspect-[432/293] w-full max-w-[432px] items-center justify-center overflow-hidden rounded-lg border border-border transition-opacity duration-200 ${
          isLoading ? 'opacity-50' : 'opacity-100'
        }`}
      >
        <div
          style={{
            background:
              'repeating-conic-gradient(#E5E7EB 0% 25%, transparent 0% 50%) 50% / 20px 20px',
          }}
        >
          {imageUrl ? (
            <img
              src={imageUrl}
              alt="미리보기"
              className="block max-h-[300px] max-w-full"
            />
          ) : (
            <div className="flex items-center justify-center">
              <span className="text-fg-muted">
                {isLoading
                  ? '이미지 생성 중...'
                  : '이미지를 불러올 수 없습니다'}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

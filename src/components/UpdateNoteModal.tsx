import { useState } from 'react';

import DOMPurify from 'dompurify';

import { useUpdateStore, type PatchContentItem } from '@/stores/updateStore';

import { Button, Modal } from './ui';

/** 마크다운 볼드(**text**) -> HTML strong 태그 변환 (sanitized) */
const formatBold = (text: string) =>
  DOMPurify.sanitize(text.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>'));

interface UpdateContentProps {
  item: PatchContentItem;
  index: number;
}

function UpdateContent({ item, index }: UpdateContentProps) {
  return (
    <div className="mt-11 flex h-full flex-col items-center">
      <h3 className="mb-5 text-xl font-semibold leading-relaxed text-primary">
        {item.title}
      </h3>
      <img
        src={item.image}
        alt={`업데이트 이미지 - ${index + 1}`}
        className="pointer-events-none mb-9 aspect-[3/1.9] h-full max-h-[280px] w-full max-w-[428px] select-none rounded-2xl border object-cover"
      />
      <p
        className="max-w-[70%] text-base font-medium leading-relaxed text-fg [&>strong]:font-bold"
        dangerouslySetInnerHTML={{ __html: formatBold(item.description ?? '') }}
      />
    </div>
  );
}

interface PageIndicatorProps {
  total: number;
  current: number;
}

function PageIndicator({ total, current }: PageIndicatorProps) {
  if (total <= 1) return null;

  return (
    <div className="flex justify-center gap-2 pb-4">
      {Array.from({ length: total }, (_, idx) => (
        <div
          key={idx}
          className={`h-2 w-2 rounded-full ${
            idx === current ? 'bg-primary' : 'bg-gray-300'
          }`}
        />
      ))}
    </div>
  );
}

export function UpdateNoteModal() {
  const [currentPage, setCurrentPage] = useState(0);

  const isOpen = useUpdateStore((state) => state.isOpen);
  const dismiss = useUpdateStore((state) => state.dismiss);
  const patch = useUpdateStore((state) => state.patch);

  const contentList = patch?.content ?? [];

  const isFirstPage = currentPage === 0;
  const isLastPage = currentPage === contentList.length - 1;

  const handlePrev = () => setCurrentPage((prev) => prev - 1);
  const handleNext = () => setCurrentPage((prev) => prev + 1);

  const currentContent = contentList[currentPage];

  return (
    <Modal
      open={isOpen}
      onOpenChange={dismiss}
      className="flex h-[690px] max-w-[512px] flex-col border-none p-0"
    >
      <div className="flex flex-1 flex-col items-center py-6 text-center">
        <h2 className="text-2xl font-semibold text-fg">
          마음토스 새로운 기능 업데이트
        </h2>
        {currentContent && (
          <UpdateContent item={currentContent} index={currentPage} />
        )}
      </div>

      <PageIndicator total={contentList.length} current={currentPage} />

      <div className="flex gap-3 px-8 pb-6">
        <Button
          onClick={isFirstPage ? dismiss : handlePrev}
          variant="outline"
          tone="neutral"
          size="lg"
          className="flex-1"
        >
          <span className="font-semibold">{isFirstPage ? '확인' : '이전'}</span>
        </Button>
        <Button
          onClick={isLastPage ? dismiss : handleNext}
          tone="primary"
          size="lg"
          className="flex-1"
        >
          <span className="font-semibold">{isLastPage ? '확인' : '다음'}</span>
        </Button>
      </div>
    </Modal>
  );
}

export default UpdateNoteModal;

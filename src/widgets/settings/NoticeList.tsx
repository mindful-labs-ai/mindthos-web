import { useNotices } from '@/features/settings/hooks/useNotices';
import type { Notice, SpanBlock } from '@/features/settings/types/notice';
import { Text } from '@/shared/ui/atoms/Text';

interface NoticeListProps {
  onSelectNotice: (noticeId: string) => void;
}

/** content 블록에서 첫 번째 span 텍스트를 미리보기로 추출 */
function getPreviewText(notice: Notice): string {
  const spanBlock = notice.content.find(
    (block): block is SpanBlock => block.type === 'span'
  );
  if (!spanBlock) return '';
  return spanBlock.text
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/__(.*?)__/g, '$1')
    .replace(/--(.*?)--/g, '$1')
    .replace(/<br\/>/g, ' ');
}

function NoticeCard({
  notice,
  onClick,
}: {
  notice: Notice;
  onClick: () => void;
}) {
  const preview = getPreviewText(notice);

  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full cursor-pointer overflow-hidden rounded-2xl border border-border bg-surface text-left transition-colors hover:border-primary-500"
    >
      {notice.thumbnail && (
        <img
          src={notice.thumbnail}
          alt={notice.title}
          className="h-auto w-[200px] flex-shrink-0 object-cover"
        />
      )}
      <div className="flex flex-1 flex-col justify-center gap-2 p-6">
        <div className="flex items-start justify-between">
          <Text className="text-lg font-bold">{notice.title}</Text>
          <Text className="text-sm font-semibold text-primary">
            {notice.version}
          </Text>
        </div>
        {preview && (
          <Text className="line-clamp-2 text-sm text-fg">{preview}</Text>
        )}
        <Text className="text-xs text-fg-muted">{notice.date}</Text>
      </div>
    </button>
  );
}

export function NoticeList({ onSelectNotice }: NoticeListProps) {
  const { notices, isLoading, error } = useNotices();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Text className="text-fg-muted">공지사항을 불러오는 중...</Text>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center py-20">
        <Text className="text-fg-muted">공지사항을 불러오지 못했습니다.</Text>
      </div>
    );
  }

  if (notices.length === 0) {
    return (
      <div className="flex items-center justify-center py-20">
        <Text className="text-fg-muted">등록된 공지사항이 없습니다.</Text>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {notices.map((notice) => (
        <NoticeCard
          key={notice.id}
          notice={notice}
          onClick={() => onSelectNotice(notice.id)}
        />
      ))}
    </div>
  );
}

import { Button } from '@/components/ui/atoms/Button';
import { Text } from '@/components/ui/atoms/Text';
import { Title } from '@/components/ui/atoms/Title';

import { useNotices } from '../hooks/useNotices';

import { NoticeContentRenderer } from './NoticeContentRenderer';

interface NoticeDetailProps {
  noticeId: string;
  onBack: () => void;
}

export function NoticeDetail({ noticeId, onBack }: NoticeDetailProps) {
  const { notices, isLoading } = useNotices();
  const notice = notices.find((n) => n.id === noticeId);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Text className="text-fg-muted">공지사항을 불러오는 중...</Text>
      </div>
    );
  }

  if (!notice) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-20">
        <Text className="text-fg-muted">공지사항을 찾을 수 없습니다.</Text>
        <Button variant="outline" tone="primary" onClick={onBack}>
          공지사항으로 돌아가기
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col">
      {/* 헤더: 제목 + 날짜 */}
      <div className="py-10 text-center">
        <Title as="h1" className="text-2xl font-bold">
          {notice.title}
        </Title>
        <Text className="mt-2 text-sm text-fg-muted">{notice.date}</Text>
      </div>

      {/* 썸네일 */}
      {notice.thumbnail && (
        <div className="flex justify-center">
          <img
            src={notice.thumbnail}
            alt={notice.title}
            className="w-full max-w-[720px] rounded-2xl border object-cover"
          />
        </div>
      )}

      {/* 본문 콘텐츠 */}
      <div className="mx-auto w-full max-w-[720px] py-10">
        <NoticeContentRenderer blocks={notice.content} />
      </div>

      {/* 하단 버튼 */}
      <div className="flex justify-center border-t border-border py-10">
        <Button variant="outline" tone="primary" onClick={onBack}>
          공지사항으로 돌아가기
        </Button>
      </div>
    </div>
  );
}

import type { ProgressNote } from '@/features/session/types';
import { Text } from '@/shared/ui/atoms/Text';
import { Title } from '@/shared/ui/atoms/Title';

interface ProgressNoteStatusViewProps {
  status: 'processing' | 'failed';
  note: ProgressNote;
}

export function ProgressNoteStatusView({
  status,
  note,
}: ProgressNoteStatusViewProps) {
  return (
    <div className="space-y-4 text-left">
      <div className="mb-6 flex items-center justify-between">
        <Title as="h2" className="typo-m font-headline text-fg-muted">
          {note.title || '상담 노트'}
        </Title>
      </div>
      <div className="flex min-h-[400px] flex-col items-center justify-center gap-4">
        {status === 'processing' ? (
          <>
            <div className="h-12 w-12 animate-spin rounded-full border-4 border-surface-strong border-t-primary" />
            <div className="text-center">
              <Text className="typo-l font-medium text-fg">
                상담노트 작성 중...
              </Text>
              <Text className="typo-sm mt-2 text-fg-muted">
                {note.processing_status === 'pending'
                  ? '대기 중입니다. 잠시만 기다려주세요.'
                  : 'AI가 상담 내용을 분석하고 있습니다.'}
              </Text>
            </div>
          </>
        ) : (
          <>
            <svg
              width="48"
              height="48"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="text-danger"
            >
              <path
                d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"
                fill="currentColor"
              />
            </svg>
            <div className="text-center">
              <Text className="typo-l font-medium text-danger">
                상담노트 작성 실패
              </Text>
              <Text className="typo-sm mt-2 text-fg-muted">
                {note.error_message || '상담노트 작성 중 오류가 발생했습니다.'}
              </Text>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

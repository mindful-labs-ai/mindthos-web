import { Text } from '@/components/ui';

export function WritingEffect() {
  return (
    <div className="flex min-h-[200px] flex-col items-center justify-center gap-4">
      <div className="animate-bounce text-5xl">✍️</div>
      <Text className="animate-pulse text-center text-fg-muted">
        받아적는 중...
      </Text>
    </div>
  );
}

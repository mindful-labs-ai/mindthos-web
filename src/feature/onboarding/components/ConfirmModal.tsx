import { Text, Title } from '@/components/ui';
import { Button } from '@/components/ui/atoms/Button';
import { Modal } from '@/components/ui/composites/Modal';

interface ConfirmModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  type: 'name' | 'phone';
  value: string;
  onConfirm: () => void;
}

export function ConfirmModal({
  open,
  onOpenChange,
  type,
  value,
  onConfirm,
}: ConfirmModalProps) {
  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      closeOnOverlay={false}
      className="max-w-sm"
    >
      <div className="flex flex-col gap-6 py-2">
        <div className="text-center">
          <div className="mb-4 text-4xl">✍️</div>
          {type === 'name' ? (
            <Title as="h3" className="text-lg font-bold text-fg">
              성함이 <span className="text-primary underline">{value}</span>님
              맞으신가요?
            </Title>
          ) : (
            <Title as="h3" className="text-lg font-bold text-fg">
              <Text as="p" className="text-primary underline">
                {value}
              </Text>
              귀하의 연락처가 맞으신가요?
            </Title>
          )}
          <Text className="mt-2 text-sm text-fg-muted">
            확인을 누르시면 받아적을 준비를 하겠습니다.
          </Text>
        </div>

        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="flex-1"
          >
            수정하기
          </Button>
          <Button tone="primary" onClick={onConfirm} className="flex-1">
            확인
          </Button>
        </div>
      </div>
    </Modal>
  );
}

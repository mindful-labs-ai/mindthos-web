/**
 * 세그먼트 시간 편집 팝업
 * 이웃 세그먼트 사이 범위 [min,max]로 제한해 시간을 지정한다.
 */
import React from 'react';

import type { TranscribeSegment } from '@/features/session/types';
import { formatTime } from '@/features/session/utils/formatTime';
import {
  deriveSegmentEnd,
  getSegmentTimeBounds,
  parseTimeInput,
} from '@/features/session/utils/segmentTimeUtils';
import { useDevice } from '@/shared/hooks/useDevice';
import { Button } from '@/shared/ui/atoms/Button';
import { Input } from '@/shared/ui/atoms/Input';
import { Text } from '@/shared/ui/atoms/Text';
import { Modal } from '@/shared/ui/composites/Modal';
import { PopUp } from '@/shared/ui/composites/PopUp';
import { useToast } from '@/shared/ui/composites/Toast';

interface SegmentTimeEditPopupProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  segment: TranscribeSegment;
  allSegments: TranscribeSegment[];
  audioDuration: number;
  triggerElement: React.ReactNode;
  onApply: (segmentId: number, start: number, end: number) => void;
}

export const SegmentTimeEditPopup: React.FC<SegmentTimeEditPopupProps> = ({
  open,
  onOpenChange,
  segment,
  allSegments,
  audioDuration,
  triggerElement,
  onApply,
}) => {
  const { isMobile, isTablet } = useDevice();
  const isMobileView = isMobile || isTablet;
  const { toast } = useToast();

  const bounds = React.useMemo(
    () => getSegmentTimeBounds(allSegments, segment.id, audioDuration),
    [allSegments, segment.id, audioDuration]
  );

  const noRoom = bounds.max <= bounds.min;
  // seconds가 단일 소스 (슬라이더가 직접 읽고 씀 → 왕복 손실 없음)
  const [seconds, setSeconds] = React.useState(0);
  const [inputText, setInputText] = React.useState('');

  // 팝업 열릴 때 현재 시간 또는 범위 시작으로 초기화
  React.useEffect(() => {
    if (open) {
      const initial = segment.start != null ? segment.start : bounds.min;
      const clamped = Math.min(Math.max(initial, bounds.min), bounds.max);
      setSeconds(clamped);
      setInputText(formatTime(clamped));
    }
  }, [open, segment.start, bounds.min, bounds.max]);

  const handleApply = () => {
    if (noRoom) {
      toast({
        title: '지정할 수 없어요',
        description: '이전·다음 발화 사이에 여유 시간이 없어요.',
        duration: 3000,
      });
      return;
    }
    const start = parseTimeInput(inputText, bounds);
    if (start == null) {
      toast({
        title: '시간 형식 오류',
        description: 'MM:SS 또는 초 단위로 입력해 주세요.',
        duration: 3000,
      });
      return;
    }
    const end = deriveSegmentEnd(start, bounds);
    onApply(segment.id, start, end);
    onOpenChange(false);
  };

  const content = (
    <div className="w-[240px] space-y-3 p-4">
      <Text className="typo-sm font-emphasize text-fg">시간 지정</Text>
      <Text className="typo-xs text-fg-muted">
        {formatTime(bounds.min)} ~ {formatTime(bounds.max)} 사이
      </Text>
      <Input
        size="sm"
        value={inputText}
        onChange={(e) => {
          setInputText(e.target.value);
          const p = parseTimeInput(e.target.value, bounds);
          if (p != null) setSeconds(p);
        }}
        placeholder="MM:SS"
        className="w-full"
        // eslint-disable-next-line jsx-a11y/no-autofocus
        autoFocus
      />
      <input
        type="range"
        min={bounds.min}
        max={bounds.max}
        step="any"
        value={seconds}
        onChange={(e) => {
          const clamped = Math.min(
            Math.max(Number(e.target.value), bounds.min),
            bounds.max
          );
          setSeconds(clamped);
          setInputText(formatTime(clamped));
        }}
        disabled={noRoom}
        className="w-full accent-primary"
        aria-label="시간 슬라이더"
      />
      <Button
        variant="solid"
        tone="primary"
        onClick={handleApply}
        disabled={noRoom}
        className="w-full"
      >
        적용
      </Button>
    </div>
  );

  if (isMobileView) {
    return (
      <>
        <div
          role="button"
          tabIndex={0}
          onClick={() => onOpenChange(true)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') onOpenChange(true);
          }}
        >
          {triggerElement}
        </div>
        <Modal
          open={open}
          onOpenChange={onOpenChange}
          mobileVariant="bottomSheet"
        >
          {content}
        </Modal>
      </>
    );
  }

  return (
    <PopUp
      trigger={triggerElement}
      open={open}
      onOpenChange={onOpenChange}
      placement="bottom-right"
      triggerClassName=""
      content={content}
    />
  );
};

/**
 * Speaker Edit Popup Component
 * speaker 이름 및 구간 편집을 위한 PopUp 컴포넌트
 */

import React from 'react';

import { Button } from '@/components/ui/atoms/Button';
import { RadioGroup } from '@/components/ui/atoms/Radio';
import { Text } from '@/components/ui/atoms/Text';
import { PopUp } from '@/components/ui/composites/PopUp';
import { useToast } from '@/components/ui/composites/Toast';
import { useClientList } from '@/feature/client/hooks/useClientList';
import { trackEvent } from '@/lib/mixpanel';

import type { Speaker, TranscribeSegment } from '../types';
import type { SpeakerRangeOption } from '../utils/segmentRangeUtils';
import {
  calculateAffectedSegments,
  cleanupUnusedSpeakers,
} from '../utils/segmentRangeUtils';

interface SpeakerEditPopupProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  segment: TranscribeSegment;
  speakers: Speaker[];
  allSegments: TranscribeSegment[];
  clientId: string | null;
  triggerElement: React.ReactNode;
  onApply: (updates: {
    speakerChanges: Record<number, number>;
    speakerDefinitions: Speaker[];
  }) => Promise<void>;
}

export const SpeakerEditPopup: React.FC<SpeakerEditPopupProps> = ({
  open,
  onOpenChange,
  segment,
  speakers,
  allSegments,
  clientId,
  triggerElement,
  onApply,
}) => {
  const { clients } = useClientList();
  const { toast } = useToast();

  const [range, setRange] = React.useState<SpeakerRangeOption>('single');
  const [selectionType, setSelectionType] = React.useState<
    'client' | 'custom' | string
  >('client');
  const [customName, setCustomName] = React.useState('');
  const [isApplying, setIsApplying] = React.useState(false);

  // session과 연결된 client 찾기
  const sessionClient = React.useMemo(
    () => clients.find((c) => c.id === clientId),
    [clients, clientId]
  );

  // 기존 customName이 있는 speaker들 추출
  const existingCustomSpeakers = React.useMemo(
    () => speakers.filter((s) => s.customName),
    [speakers]
  );

  const handleApply = async () => {
    // 유효성 검사: custom 입력 시 이름 필수
    if (selectionType === 'custom' && !customName.trim()) {
      toast({
        title: '입력 오류',
        description: '이름을 입력해주세요.',
        duration: 3000,
      });
      return;
    }

    setIsApplying(true);

    try {
      // 1. 영향받을 세그먼트 ID 목록 계산
      const affectedSegmentIds = calculateAffectedSegments(
        segment.id,
        segment.speaker,
        range,
        allSegments
      );

      // 2. 대상 speaker 이름 결정
      let targetName: string;
      let targetSpeakerId: number | undefined;

      if (selectionType === 'default_counselor') {
        // 기본 참석자: 상담사
        targetName = '상담사';
      } else if (selectionType === 'default_client') {
        // 기본 참석자: 내담자
        targetName = '내담자';
      } else if (selectionType === 'client') {
        // session client 선택
        targetName = sessionClient?.name || '';
      } else if (selectionType === 'custom') {
        // 직접 입력
        targetName = customName.trim();
      } else if (selectionType.startsWith('existing_')) {
        // 기존 customName speaker 선택 (예: "existing_3")
        const speakerId = parseInt(selectionType.replace('existing_', ''), 10);
        const existingSpeaker = speakers.find((s) => s.id === speakerId);
        targetName = existingSpeaker?.customName || '';
        // 기존 speaker를 재사용하므로 ID도 미리 설정
        targetSpeakerId = speakerId;
      } else {
        targetName = '';
      }

      // 3. speaker ID 찾기 또는 생성
      let updatedSpeakers: Speaker[];
      let finalSpeakerId: number;

      // existing_ 선택 시 이미 targetSpeakerId가 설정됨
      if (targetSpeakerId !== undefined) {
        // existing_ 선택으로 이미 ID가 결정된 경우
        finalSpeakerId = targetSpeakerId;
        updatedSpeakers = speakers;
      } else {
        // client 또는 custom 선택 시
        const existingSpeaker = speakers.find(
          (s) => s.customName === targetName
        );

        if (existingSpeaker) {
          // 이미 존재하는 customName이면 해당 speaker ID 재사용
          finalSpeakerId = existingSpeaker.id;
          updatedSpeakers = speakers;
        } else {
          // 새로운 speaker 생성
          const maxId = Math.max(...speakers.map((s) => s.id), 0);
          finalSpeakerId = maxId + 1;
          updatedSpeakers = [
            ...speakers,
            {
              id: finalSpeakerId,
              role: `custom_${finalSpeakerId}`,
              customName: targetName,
            },
          ];
        }
      }

      // 4. 업데이트 payload 구성
      const speakerChanges: Record<number, number> = {};
      affectedSegmentIds.forEach((id) => {
        speakerChanges[id] = finalSpeakerId;
      });

      // 5. 업데이트 후 미사용 speaker cleanup
      // 임시로 업데이트된 세그먼트 계산
      const updatedSegments = allSegments.map((seg) => {
        if (speakerChanges[seg.id] !== undefined) {
          return { ...seg, speaker: speakerChanges[seg.id] };
        }
        return seg;
      });

      // cleanup 수행
      const cleanedSpeakers = cleanupUnusedSpeakers(
        updatedSpeakers,
        updatedSegments
      );

      // 6. 업데이트 적용 (cleaned speakers 사용)
      await onApply({
        speakerChanges,
        speakerDefinitions: cleanedSpeakers,
      });

      trackEvent('speaker_edit_apply', {
        range,
        selection_type: selectionType,
        affected_segments_count: affectedSegmentIds.length,
      });

      // 7. 성공 시 PopUp 닫기
      onOpenChange(false);

      // 8. 상태 초기화
      setCustomName('');
      setRange('single');
      setSelectionType('client');
    } catch {
      // 에러는 부모 컴포넌트에서 처리 (toast 표시)
    } finally {
      setIsApplying(false);
    }
  };

  return (
    <PopUp
      trigger={triggerElement}
      open={open}
      onOpenChange={onOpenChange}
      placement="bottom-right"
      triggerClassName="" // w-full 제거하여 flex 레이아웃 깨지지 않도록
      content={
        <div className="space-y-4 p-4">
          {/* Section 1: 참석자 선택 */}
          <div>
            <Text className="mb-2 text-sm font-semibold text-fg">
              참석자 선택
            </Text>
            <RadioGroup
              options={[
                // 기본 참석자 옵션
                { value: 'default_counselor', label: '상담사' },
                { value: 'default_client', label: '내담자' },
                // 세션에 연결된 내담자
                ...(sessionClient
                  ? [
                      {
                        value: 'client',
                        label: sessionClient.name,
                      },
                    ]
                  : []),
                ...existingCustomSpeakers.map((speaker) => ({
                  value: `existing_${speaker.id}`,
                  label: speaker.customName || `Speaker ${speaker.id}`,
                })),
                { value: 'custom', label: '직접 입력' },
              ]}
              value={selectionType}
              onChange={(value) => setSelectionType(value)}
              orientation="vertical"
              size="sm"
            />
            {selectionType === 'custom' && (
              <input
                type="text"
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
                placeholder="이름 입력"
                className="mt-2 w-full rounded-lg border-2 border-border bg-surface px-3 py-2 text-sm text-fg outline-none transition-colors focus:border-primary"
              />
            )}
          </div>

          {/* Section 2: 구간 선택 */}
          <div>
            <Text className="mb-2 text-sm font-semibold text-fg">
              구간 선택
            </Text>
            <RadioGroup
              options={[
                { value: 'single', label: '이 구간만' },
                {
                  value: 'onwards',
                  label: '이 구간부터',
                  description: '같은 화자의 이후 구간',
                },
                {
                  value: 'all',
                  label: '전체 구간',
                  description: '같은 화자의 모든 구간',
                },
              ]}
              value={range}
              onChange={(value) => setRange(value as SpeakerRangeOption)}
              orientation="vertical"
              size="sm"
            />
          </div>

          {/* 적용 버튼 */}
          <Button
            variant="solid"
            tone="primary"
            onClick={handleApply}
            disabled={isApplying}
            className="w-full"
          >
            {isApplying ? '적용 중...' : '적용'}
          </Button>
        </div>
      }
    />
  );
};

/**
 * Speaker Edit Popup Component
 * speaker 이름 및 구간 편집을 위한 PopUp 컴포넌트
 */

import React from 'react';

import { Button } from '@/components/ui/atoms/Button';
import { RadioGroup } from '@/components/ui/atoms/Radio';
import { Text } from '@/components/ui/atoms/Text';
import { PopUp } from '@/components/ui/composites/PopUp';
import { Spotlight } from '@/components/ui/composites/Spotlight';
import { useToast } from '@/components/ui/composites/Toast';
import { useClientList } from '@/feature/client/hooks/useClientList';
import { trackEvent } from '@/lib/mixpanel';

import type { Speaker, TranscribeSegment } from '../types';
import { getSpeakerDisplayName } from '../utils/getSpeakerInfo';
import type { SpeakerRangeOption } from '../utils/segmentRangeUtils';
import {
  calculateAffectedSegments,
  cleanupUnusedSpeakers,
} from '../utils/segmentRangeUtils';

import { SpeakerSelectTooltip } from './TranscriptEditGuideTooltips';

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
  /** 현재 가이드 레벨 (4: 화자 라벨, 5: 화자 선택 모달) */
  guideLevel?: 4 | 5 | null;
  /** 다음 가이드 레벨로 진행 (Level 4 → 5) */
  onGuideNext?: () => void;
  /** 가이드 완료 (Level 5 완료 시) */
  onGuideComplete?: () => void;
}

export const SpeakerEditPopup: React.FC<SpeakerEditPopupProps> = ({
  open,
  onOpenChange,
  segment,
  speakers,
  allSegments,
  clientId,
  triggerElement,
  guideLevel,
  onGuideNext,
  onGuideComplete,
  onApply,
}) => {
  const { clients } = useClientList();
  const { toast } = useToast();
  const [popupContentElement, setPopupContentElement] =
    React.useState<HTMLDivElement | null>(null);

  // 팝업이 열릴 때 가이드 Level 4 → 5 전환
  React.useEffect(() => {
    if (open && guideLevel === 4 && onGuideNext) {
      onGuideNext();
    }
  }, [open, guideLevel, onGuideNext]);

  const [range, setRange] = React.useState<SpeakerRangeOption>('single');
  const [selectionType, setSelectionType] = React.useState<
    'client' | 'custom' | string
  >('default_counselor');
  const [customName, setCustomName] = React.useState('');
  const [isApplying, setIsApplying] = React.useState(false);

  // session과 연결된 client 찾기
  const sessionClient = React.useMemo(
    () => clients.find((c) => c.id === clientId),
    [clients, clientId]
  );

  // speakers 배열을 기반으로 동적 옵션 생성 (중앙화된 getSpeakerDisplayName 사용)
  const speakerOptions = React.useMemo(() => {
    return speakers.map((speaker) => ({
      value: `speaker_${speaker.id}`,
      label: getSpeakerDisplayName(speaker),
    }));
  }, [speakers]);

  // 팝업이 열릴 때 현재 세그먼트의 화자에 맞게 selectionType 초기화
  React.useEffect(() => {
    if (open) {
      const currentSpeaker = speakers.find((s) => s.id === segment.speaker);

      if (!currentSpeaker) {
        // 첫 번째 speaker를 기본값으로 설정
        const firstOption = speakerOptions[0];
        setSelectionType(firstOption?.value || 'custom');
        return;
      }

      // 현재 세그먼트의 speaker ID에 해당하는 옵션 선택
      setSelectionType(`speaker_${currentSpeaker.id}`);

      // 상태 초기화
      setRange('single');
      setCustomName('');
    }
  }, [open, segment.speaker, speakers, speakerOptions]);

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

      // 2. 대상 speaker 이름 및 ID 결정
      let targetName: string;
      let targetSpeakerId: number | undefined;

      if (selectionType.startsWith('speaker_')) {
        // 기존 speaker 선택 (예: "speaker_1", "speaker_2")
        const speakerId = parseInt(selectionType.replace('speaker_', ''), 10);
        const existingSpeaker = speakers.find((s) => s.id === speakerId);
        if (existingSpeaker) {
          targetName = getSpeakerDisplayName(existingSpeaker);
          targetSpeakerId = speakerId;
        } else {
          targetName = '';
        }
      } else if (selectionType === 'client') {
        // session client 선택 (speakers에 없는 경우)
        targetName = sessionClient?.name || '';
      } else if (selectionType === 'custom') {
        // 직접 입력
        targetName = customName.trim();
      } else {
        targetName = '';
      }

      // 3. speaker ID 찾기 또는 생성
      let updatedSpeakers: Speaker[];
      let finalSpeakerId: number;

      if (targetSpeakerId !== undefined) {
        // speaker_ 선택으로 이미 ID가 결정된 경우 (기존 speaker 재사용)
        finalSpeakerId = targetSpeakerId;
        updatedSpeakers = speakers;
      } else {
        // client 또는 custom 선택 시 - 새 speaker 생성 또는 기존 speaker 재사용
        // customName 또는 displayName이 일치하는 speaker 찾기
        const existingSpeaker = speakers.find(
          (s) =>
            s.customName === targetName ||
            getSpeakerDisplayName(s) === targetName
        );

        if (existingSpeaker) {
          // 기존 speaker 재사용 (customName 또는 displayName 일치)
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

      // 8. 가이드 Level 5 완료 처리
      if (guideLevel === 5 && onGuideComplete) {
        onGuideComplete();
      }
    } catch {
      // 에러는 부모 컴포넌트에서 처리 (toast 표시)
    } finally {
      setIsApplying(false);
    }
  };

  const popupContent = (
    <div ref={setPopupContentElement} className="space-y-4 p-4">
      {/* Section 1: 참석자 선택 */}
      <div>
        <Text className="mb-2 text-sm font-semibold text-fg">참석자 변경</Text>
        <RadioGroup
          options={[
            // speakers 배열 기반 동적 옵션
            ...speakerOptions,
            // 세션에 연결된 내담자 (speakers에 없는 경우에만 추가)
            ...(sessionClient &&
            !speakers.some((s) => s.customName === sessionClient.name)
              ? [
                  {
                    value: 'client',
                    label: sessionClient.name,
                  },
                ]
              : []),
            // 직접 입력 옵션
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
        <Text className="mb-2 text-sm font-semibold text-fg">구간 선택</Text>
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
  );

  return (
    <>
      <PopUp
        trigger={triggerElement}
        open={open}
        onOpenChange={onOpenChange}
        placement="bottom-right"
        triggerClassName=""
        content={popupContent}
        disableOutsideClick={guideLevel === 5}
      />
      {/* Level 5: 화자 선택 모달에 Spotlight */}
      {guideLevel === 5 && open && popupContentElement && (
        <Spotlight
          isActive={true}
          tooltip={
            <SpeakerSelectTooltip
              onComplete={() => {
                onOpenChange(false); // 팝업 닫기
                onGuideComplete?.(); // 가이드 종료
              }}
            />
          }
          tooltipPosition="left"
          targetElement={popupContentElement}
          store="featureGuide"
        />
      )}
    </>
  );
};

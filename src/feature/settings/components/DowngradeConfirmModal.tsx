import React, { useState } from 'react';

import { Button } from '@/components/ui/atoms/Button';
import { Text } from '@/components/ui/atoms/Text';
import { Title } from '@/components/ui/atoms/Title';
import { Modal } from '@/components/ui/composites/Modal';
import { ArrowRightIcon, CheckIcon, HelpCircleIcon } from '@/shared/icons';

import { planFeature, type PlanKey } from './PlanCard';

export interface DowngradeConfirmModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentPlanType: string;
  currentPlanCredit: number;
  newPlanType: string;
  newPlanCredit: number;
  effectiveAt: string | null;
  onConfirm: () => Promise<void>;
}

// 플랜 타입 → 한글 이름 변환
const getPlanDisplayName = (type: string): string => {
  const map: Record<string, string> = {
    Free: '무료',
    Starter: '스타터',
    Plus: '플러스',
    Pro: '프로',
    스타터: '스타터',
    플러스: '플러스',
    프로: '프로',
  };
  return map[type] || type;
};

// 플랜 타입 → planFeature 키 변환
const getPlanFeatureKey = (type: string): PlanKey | null => {
  const map: Record<string, PlanKey> = {
    Starter: '스타터',
    Plus: '플러스',
    Pro: '프로',
    스타터: '스타터',
    플러스: '플러스',
    프로: '프로',
  };
  return map[type] || null;
};

export const DowngradeConfirmModal: React.FC<DowngradeConfirmModalProps> = ({
  open,
  onOpenChange,
  currentPlanType,
  currentPlanCredit,
  newPlanType,
  newPlanCredit,
  effectiveAt,
  onConfirm,
}) => {
  const [isLoading, setIsLoading] = useState(false);

  const handleConfirm = async () => {
    setIsLoading(true);
    try {
      await onConfirm();
      onOpenChange(false);
    } catch (error) {
      console.error('다운그레이드 실패:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '구독 종료 후';
    const date = new Date(dateStr);
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const currentFeatureKey = getPlanFeatureKey(currentPlanType);
  const currentFeatures = currentFeatureKey
    ? planFeature[currentFeatureKey]
    : null;

  const newFeatureKey = getPlanFeatureKey(newPlanType);
  const newFeatures = newFeatureKey ? planFeature[newFeatureKey] : null;

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      className="flex max-w-3xl items-center justify-center"
    >
      <div className="flex w-full flex-col items-stretch space-y-12 px-12">
        {/* 헤더 */}
        <div className="text-center">
          <div className="mb-4 flex items-center justify-center gap-2 text-danger">
            <HelpCircleIcon size={24} />
            <Title as="h2" className="text-xl font-bold">
              플랜 다운그레이드하기
            </Title>
          </div>

          <div className="space-y-1">
            <Text className="font-semibold">정말 플랜을 바꾸시겠습니까?</Text>
            <Text className="font-semibold">
              플랜 변경 후 아래 기능을 더 이상 이용할 수 없습니다.
            </Text>
          </div>
        </div>

        {/* 플랜 비교 카드 */}
        <div className="flex w-full items-center justify-center gap-4">
          {/* 현재 플랜 */}
          <div className="flex-1 self-stretch rounded-xl border border-border px-4 py-6">
            <Title
              as="h3"
              className="mb-6 px-4 text-left text-lg font-semibold"
            >
              {getPlanDisplayName(currentPlanType)} 플랜 이용 중
            </Title>
            <div className="space-y-3">
              {/* 크레딧 */}
              <div className="flex items-center gap-3">
                <CheckIcon size={18} className="flesx-shrink-0 text-primary" />
                <Text className="text-sm">
                  <span className="font-semibold">
                    {currentPlanCredit.toLocaleString()} 크레딧
                  </span>{' '}
                  / 월
                </Text>
              </div>
              {/* 피처 목록 */}
              {currentFeatures &&
                Object.entries(currentFeatures).map(
                  ([idx, { text, style, sub }]) => (
                    <div key={idx} className="flex items-center gap-3">
                      <CheckIcon
                        size={18}
                        className="flex-shrink-0 text-primary"
                      />
                      <div className="flex gap-1">
                        <Text className={`text-sm ${style || ''}`}>{text}</Text>
                        {sub && <span className="text-sm">{sub}</span>}
                      </div>
                    </div>
                  )
                )}
            </div>
          </div>

          {/* 화살표 */}
          <div className="flex-shrink-0">
            <ArrowRightIcon size={24} className="text-fg-muted" />
          </div>

          {/* 변경될 플랜 */}
          <div className="flex-1 self-stretch rounded-xl border border-border px-4 py-6">
            <Title
              as="h3"
              className="mb-6 px-4 text-left text-lg font-semibold"
            >
              {getPlanDisplayName(newPlanType)} 플랜으로 변경 후
            </Title>
            <div className="space-y-3">
              {/* 크레딧 */}
              <div className="flex items-center gap-3">
                <CheckIcon size={18} className="flex-shrink-0 text-primary" />
                <Text className="text-sm">
                  <span className="font-semibold">
                    {newPlanCredit.toLocaleString()} 크레딧
                  </span>{' '}
                  / 월
                </Text>
              </div>
              {/* 피처 목록 */}
              {newFeatures &&
                Object.entries(newFeatures).map(
                  ([idx, { text, style, sub }]) => (
                    <div key={idx} className="flex items-center gap-3">
                      <CheckIcon
                        size={18}
                        className="flex-shrink-0 text-primary"
                      />
                      <div className="flex gap-1">
                        <Text className={`text-sm ${style || ''}`}>{text}</Text>
                        {sub && <span className="text-sm">{sub}</span>}
                      </div>
                    </div>
                  )
                )}
              {/* Free 플랜인 경우 하드코딩 */}
              {!newFeatures && (
                <div className="flex items-center gap-3">
                  <CheckIcon size={18} className="flex-shrink-0 text-primary" />
                  <Text className="text-sm">제한된 상담 노트 템플릿</Text>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 적용일 안내 */}
        <div className="text-center">
          <Text className="text-sm text-fg-muted">
            <span className="font-semibold text-fg">
              {formatDate(effectiveAt)}
            </span>{' '}
            이후 {getPlanDisplayName(newPlanType)} 플랜이 적용됩니다.
          </Text>
        </div>

        {/* 버튼 */}
        <div className="flex justify-center gap-3">
          <Button
            variant="outline"
            tone="neutral"
            size="lg"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
            className="w-40"
          >
            계속 이용하기
          </Button>
          <Button
            variant="soft"
            tone="danger"
            size="lg"
            onClick={handleConfirm}
            disabled={isLoading}
            className="w-40"
          >
            {isLoading ? '처리 중...' : '변경하기'}
          </Button>
        </div>
      </div>
    </Modal>
  );
};

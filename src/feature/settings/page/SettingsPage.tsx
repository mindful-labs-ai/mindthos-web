import React from 'react';

import { Mail, MapPin, User } from 'lucide-react';

import { Button } from '@/components/ui/atoms/Button';
import { Text } from '@/components/ui/atoms/Text';
import { Title } from '@/components/ui/atoms/Title';
import { Card } from '@/components/ui/composites/Card';
import { WelcomeBanner } from '@/components/ui/composites/WelcomeBanner';
import { PlanUpgradeModal } from '@/feature/settings/components/PlanUpgradeModal';
import { UsageProgressCard } from '@/feature/settings/components/UsageProgressCard';
import { mockSettingsData } from '@/feature/settings/data/mockData';

export const SettingsPage: React.FC = () => {
  const [settings] = React.useState(mockSettingsData);
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = React.useState(false);

  const handleEditInfo = () => {
    console.log('정보 수정 클릭');
  };

  const handleTokenLog = () => {
    console.log('토큰 사용 내역 클릭');
  };

  const handleUpgradePlan = () => {
    setIsUpgradeModalOpen(true);
  };

  const handleGuide = () => {
    console.log('더 알아보기 클릭');
  };

  const getPlanLabel = (planType: string) => {
    switch (planType) {
      case 'FREE':
        return '프리 플랜';
      case 'PRO':
        return '프로 플랜';
      case 'PLUS':
        return '엔터프라이즈 플랜';
      default:
        return planType;
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-surface-contrast">
      <div className="px-8 py-6">
        <Title as="h1" className="text-2xl font-bold">
          서비스 설정
        </Title>
      </div>

      <div className="flex-1 space-y-6 px-8 py-6">
        <Card>
          <Card.Body className="space-y-4 p-6">
            <div className="flex items-center justify-between">
              <Title as="h2" className="text-lg font-semibold text-fg-muted">
                상담사 정보
              </Title>
              <Button
                variant="outline"
                tone="neutral"
                size="sm"
                onClick={handleEditInfo}
              >
                정보 수정
              </Button>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <User size={20} className="text-fg-muted" />
                <Text className="text-base">{settings.counselor.name}</Text>
              </div>
              <div className="flex items-center gap-3">
                <Mail size={20} className="text-fg-muted" />
                <Text className="text-base">{settings.counselor.email}</Text>
              </div>
              <div className="flex items-center gap-3">
                <MapPin size={20} className="text-fg-muted" />
                <Text className="text-base">
                  {settings.counselor.organization}
                </Text>
              </div>
            </div>
          </Card.Body>
        </Card>

        <Card>
          <Card.Body className="space-y-6 p-6">
            <div className="flex items-center justify-between">
              <Title as="h2" className="text-lg font-semibold text-fg-muted">
                사용 정보
              </Title>
              <Button
                variant="outline"
                tone="neutral"
                size="sm"
                onClick={handleTokenLog}
              >
                토큰 사용 내역
              </Button>
            </div>

            <div className="flex flex-col justify-start space-y-4">
              <div className="flex items-center justify-between">
                <Text className="text-base">
                  <span className="font-bold text-primary">
                    {getPlanLabel(settings.plan.type)}
                  </span>{' '}
                  2025.11.29 15:35 갱신 예정
                </Text>
              </div>

              <Button
                variant="solid"
                tone="primary"
                size="sm"
                className="w-32"
                onClick={handleUpgradePlan}
              >
                플랜 업그레이드
              </Button>
            </div>

            <div className="flex">
              <UsageProgressCard
                title="음성 변환"
                usage={settings.usage.voice_transcription}
                total={settings.plan.audio_credit}
                unit="분"
              />
              <UsageProgressCard
                title="요약 생성"
                usage={settings.usage.summary_generation}
                total={settings.plan.summary_credit}
                unit="회"
              />
            </div>
          </Card.Body>
        </Card>

        <WelcomeBanner
          title="마음토스 시작하기"
          description="아직 마음토스 사용법이 어렵다면, 가이드를 확인해보세요."
          buttonText="더 알아보기"
          onButtonClick={handleGuide}
          className="text-left"
        />
      </div>

      <PlanUpgradeModal
        open={isUpgradeModalOpen}
        onOpenChange={setIsUpgradeModalOpen}
      />
    </div>
  );
};

export default SettingsPage;

import React from 'react';

import { Upload, UserPlus, FileSearch } from 'lucide-react';

import { Title } from '@/components/ui';
import { WelcomeBanner } from '@/components/ui/composites/WelcomeBanner';
import { formatKoreanDate } from '@/shared/utils/date';
import { extractUsernameFromEmail } from '@/shared/utils/user';
import { useAuthStore } from '@/stores/authStore';

import { ActionCard } from '../components/ActionCard';
import { GreetingSection } from '../components/GreetingSection';
import { SessionCard } from '../components/SessionCard';

const HomePage = () => {
  const user = useAuthStore((state) => state.user);
  const [showBanner, setShowBanner] = React.useState(true);

  const handleGuideClick = () => {
    // TODO: Navigate to guide page
  };

  const handleUploadClick = () => {
    // TODO: Implement upload functionality
  };

  const handleAddCustomerClick = () => {
    // TODO: Implement add customer functionality
  };

  const handleViewAllRecordsClick = () => {
    // TODO: Navigate to all records page
  };

  const handleSessionClick = (_sessionId: string) => {
    // TODO: Navigate to session detail page
  };

  return (
    <div className="mx-auto w-full max-w-6xl px-12 py-6 text-left lg:px-16 lg:py-10">
      {showBanner && (
        <WelcomeBanner
          title="마음토스 시작하기"
          description="아직 마음토스 사용법이 어렵다면, 가이드를 확인해보세요."
          buttonText="더 알아보기"
          onButtonClick={handleGuideClick}
          onClose={() => setShowBanner(false)}
        />
      )}

      <GreetingSection
        userName={extractUsernameFromEmail(user?.email)}
        date={formatKoreanDate()}
      />

      <div className="mb-8 flex flex-row gap-4">
        <ActionCard
          icon={<Upload size={24} className="text-primary-500" />}
          title="녹음 파일 업로드하기"
          onClick={handleUploadClick}
        />
        <ActionCard
          icon={<UserPlus size={24} className="text-red-500" />}
          title="고객 추가하기"
          onClick={handleAddCustomerClick}
        />
        <ActionCard
          icon={<FileSearch size={24} className="text-yellow-500" />}
          title="상담 기록 전체보기"
          onClick={handleViewAllRecordsClick}
        />
      </div>

      <div>
        <div className="mb-4 flex items-center justify-between">
          <Title as="h2" className="text-xl font-semibold">
            지난 상담 기록
          </Title>
        </div>

        <div className="space-y-4">
          <SessionCard
            title="김경민 1회기"
            content="상담사 : 안녕하세요, 잘 지내셨나요? 내담자 : 네 잘 지냈습니다. 상담사 : 안녕하세요, 잘 지내셨나요? 내담자 : 네 잘 지냈습니다. 상담사 : 안녕하세요, 잘 지내셨나요? 내담자 : 네 잘 지냈습니다."
            date={formatKoreanDate()}
            onClick={() => handleSessionClick('session-1')}
          />
          <SessionCard
            title="김성곤 2회기"
            content="상담사 : 안녕하세요, 잘 지내셨나요? 내담자 : 네 잘 지냈습니다. 상담사 : 안녕하세요, 잘 지내셨나요? 내담자 : 네 잘 지냈습니다. 상담사 : 안녕하세요, 잘 지내셨나요? 내담자 : 네 잘 지냈습니다."
            date={formatKoreanDate()}
            onClick={() => handleSessionClick('session-2')}
          />
        </div>
      </div>
    </div>
  );
};

export default HomePage;

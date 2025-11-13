import React from 'react';

import { Upload, UserPlus, FileSearch } from 'lucide-react';

import { Title } from '@/components/ui';
import { useAuthStore } from '@/stores/authStore';

import { ActionCard } from '../components/ActionCard';
import { GreetingSection } from '../components/GreetingSection';
import { SessionCard } from '../components/SessionCard';
import { WelcomeBanner } from '../components/WelcomeBanner';

const HomePage = () => {
  const user = useAuthStore((state) => state.user);
  const [showBanner, setShowBanner] = React.useState(true);

  // 현재 날짜를 한국어로 포맷
  const getFormattedDate = () => {
    const now = new Date();
    const month = now.getMonth() + 1;
    const day = now.getDate();
    const weekdays = ['일', '월', '화', '수', '목', '금', '토'];
    const weekday = weekdays[now.getDay()];
    return `${month}월 ${day}일 ${weekday}요일`;
  };

  // 사용자 이름 추출 (이메일에서 @ 앞부분 사용)
  const getUserName = () => {
    if (!user?.email) return '사용자';
    return user.email.split('@')[0];
  };

  console.log(user);

  return (
    <div className="mx-auto w-full max-w-6xl px-12 py-6 text-left lg:px-16 lg:py-10">
      {/* Welcome Banner */}
      {showBanner && <WelcomeBanner onClose={() => setShowBanner(false)} />}

      {/* Date and Greeting */}
      <GreetingSection userName={getUserName()} date={getFormattedDate()} />

      {/* Action Cards */}
      <div className="mb-8 flex flex-row gap-4">
        <ActionCard
          icon={<Upload size={24} className="text-primary-500" />}
          title="녹음 파일 업로드하기"
          onClick={() => console.log('Upload')}
        />
        <ActionCard
          icon={<UserPlus size={24} className="text-red-500" />}
          title="고객 추가하기"
          onClick={() => console.log('Add customer')}
        />
        <ActionCard
          icon={<FileSearch size={24} className="text-yellow-500" />}
          title="상담 기록 전체보기"
          onClick={() => console.log('View all records')}
        />
      </div>

      {/* Recent Sessions */}
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
            date={getFormattedDate()}
            onClick={() => console.log('김경민 1회기 클릭')}
          />
          <SessionCard
            title="김성곤 2회기"
            content="상담사 : 안녕하세요, 잘 지내셨나요? 내담자 : 네 잘 지냈습니다. 상담사 : 안녕하세요, 잘 지내셨나요? 내담자 : 네 잘 지냈습니다. 상담사 : 안녕하세요, 잘 지내셨나요? 내담자 : 네 잘 지냈습니다."
            date={getFormattedDate()}
            onClick={() => console.log('김성곤 2회기 클릭')}
          />
        </div>
      </div>
    </div>
  );
};

export default HomePage;

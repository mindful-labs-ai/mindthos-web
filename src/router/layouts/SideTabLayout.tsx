import React from 'react';

import { Outlet } from 'react-router-dom';

import { CompleteMissionModal } from '@/feature/onboarding/components/CompleteMissionModal';
import { MissionFloatingButton } from '@/feature/onboarding/components/MissionFloatingButton';
import { QuestMissionModal } from '@/feature/onboarding/components/QuestMissionModal';
import { UserEditModal } from '@/feature/settings/components/UserEditModal';
import { Header } from '@/router/layouts/Header';
import { SideTab } from '@/router/layouts/SideTab';
import { useAuthStore } from '@/stores/authStore';
import { useQuestStore } from '@/stores/questStore';

const MainFlowLayout = () => {
  const [isUserEditModalOpen, setIsUserEditModalOpen] = React.useState(false);

  const user = useAuthStore((state) => state.user);
  const { currentLevel, completeNextStep } = useQuestStore();

  const handleUserEditSuccess = async () => {
    // 내 정보 입력 미션(Level 5)인 경우 퀘스트 완료 처리
    if (currentLevel === 5 && user?.email) {
      await completeNextStep(user.email);
    }
  };

  return (
    <div className="flex h-screen w-full bg-bg-subtle">
      {/* SideTab */}
      <SideTab />

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col">
        {/* Header with BreadCrumb */}
        <Header />

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>

      <QuestMissionModal />
      <CompleteMissionModal
        onOpenUserEdit={() => setIsUserEditModalOpen(true)}
      />
      <MissionFloatingButton
        onOpenUserEdit={() => setIsUserEditModalOpen(true)}
      />
      <UserEditModal
        open={isUserEditModalOpen}
        onOpenChange={setIsUserEditModalOpen}
        onSuccess={handleUserEditSuccess}
      />
    </div>
  );
};

export default MainFlowLayout;

import React from 'react';

import { Layers } from 'lucide-react';
import { Outlet } from 'react-router-dom';

import { Header } from '@/feature/home/components/Header';
import { SideTab } from '@/feature/home/components/SideTab';

const MainFlowLayout = () => {
  const [isSideTabOpen, setIsSideTabOpen] = React.useState(true);

  return (
    <div className="flex h-screen w-full bg-bg-subtle">
      {/* SideTab */}
      <SideTab isOpen={isSideTabOpen} onClose={() => setIsSideTabOpen(false)} />

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col">
        {/* Mobile Menu Button */}
        {!isSideTabOpen && (
          <button
            onClick={() => setIsSideTabOpen(true)}
            className="fixed left-4 top-4 z-10 rounded-lg bg-surface p-2 shadow-lg lg:hidden"
          >
            <Layers size={24} />
          </button>
        )}

        {/* Header with BreadCrumb */}
        <Header />

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default MainFlowLayout;

import { useState } from 'react';

import { useNavigate } from 'react-router-dom';

import { Button } from '@/components/ui';
import { ROUTES } from '@/router/constants';
import { authService } from '@/services/auth/authService';
import { useAuthStore } from '@/stores/authStore';

import './App.css';

function App() {
  const [count, setCount] = useState(0);
  const [isDark, setIsDark] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const logout = useAuthStore((state) => state.logout);

  console.log(user);

  const toggleDarkMode = () => {
    document.documentElement.classList.toggle('dark');
    setIsDark(!isDark);
  };

  const handleLoadingDemo = () => {
    setIsLoading(true);
    setTimeout(() => setIsLoading(false), 2000);
  };

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await logout();
      navigate(ROUTES.AUTH);
    } catch (error) {
      console.error('Logout failed:', error);
    } finally {
      setIsLoggingOut(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!user?.email) return;

    const confirmed = window.confirm(
      '정말로 계정을 삭제하시겠습니까?\n이 작업은 되돌릴 수 없으며, 모든 데이터가 영구적으로 삭제됩니다.'
    );

    if (!confirmed) return;

    setIsDeleting(true);
    try {
      await authService.deleteAccount(user.email);
      await logout();
      alert('계정이 성공적으로 삭제되었습니다.');
      navigate(ROUTES.AUTH);
    } catch (error) {
      console.error('Account deletion failed:', error);
      alert(
        error instanceof Error
          ? error.message
          : '계정 삭제 중 오류가 발생했습니다.'
      );
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="min-h-screen bg-bg text-fg transition-colors">
      <div className="mx-auto max-w-4xl p-8">
        <div className="mb-4 flex items-center justify-between">
          <div>
            {isAuthenticated && user && (
              <div className="text-sm">
                <span className="text-muted">로그인됨: </span>
                <span className="font-medium text-black">{user.email}</span>
              </div>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={toggleDarkMode}>
              {isDark ? '☀️ Light' : '🌙 Dark'}
            </Button>
            {isAuthenticated ? (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleLogout}
                  disabled={isLoggingOut || isDeleting}
                >
                  {isLoggingOut ? '로그아웃 중...' : '로그아웃'}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDeleteAccount}
                  disabled={isDeleting || isLoggingOut}
                  className="border-red-600 text-red-600 hover:bg-red-50 dark:hover:bg-red-950"
                >
                  {isDeleting ? '삭제 중...' : '회원탈퇴'}
                </Button>
              </>
            ) : (
              <Button
                variant="solid"
                tone="primary"
                size="sm"
                onClick={() => navigate(ROUTES.AUTH)}
              >
                로그인
              </Button>
            )}
          </div>
        </div>

        <h1 className="mb-8 text-center text-4xl font-bold">Mindthos V2</h1>
        <p className="mb-8 text-center text-muted">
          Production-grade React + TypeScript + Vite baseline
        </p>

        <div className="dark:bg-primary-900/20 mb-8 rounded-lg bg-primary-50 p-8">
          <h2 className="mb-4 text-2xl font-semibold">Design System Demo</h2>

          <div className="space-y-6">
            <div>
              <h3 className="mb-3 text-sm font-medium text-muted">
                Counter Example
              </h3>
              <div className="flex items-center gap-4">
                <Button onClick={() => setCount((count) => count + 1)}>
                  Count is {count}
                </Button>
                <Button variant="outline" onClick={() => setCount(0)}>
                  Reset
                </Button>
              </div>
            </div>

            <div>
              <h3 className="mb-3 text-sm font-medium text-muted">
                Button Variants
              </h3>
              <div className="flex flex-wrap gap-3">
                <Button variant="solid" tone="primary">
                  Solid
                </Button>
                <Button variant="outline" tone="primary">
                  Outline
                </Button>
                <Button variant="ghost" tone="primary">
                  Ghost
                </Button>
                <Button variant="soft" tone="primary">
                  Soft
                </Button>
              </div>
            </div>

            <div>
              <h3 className="mb-3 text-sm font-medium text-muted">
                Button Sizes
              </h3>
              <div className="flex flex-wrap items-center gap-3">
                <Button size="sm">Small</Button>
                <Button size="md">Medium</Button>
                <Button size="lg">Large</Button>
              </div>
            </div>

            <div>
              <h3 className="mb-3 text-sm font-medium text-muted">
                Button States
              </h3>
              <div className="flex flex-wrap gap-3">
                <Button loading={isLoading} onClick={handleLoadingDemo}>
                  {isLoading ? 'Loading...' : 'Click to Load'}
                </Button>
                <Button disabled>Disabled</Button>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-4 text-center">
          <p className="text-sm text-muted">
            Edit{' '}
            <code className="rounded bg-primary-100 px-2 py-1 dark:bg-primary-900">
              src/App.tsx
            </code>{' '}
            and save to test HMR
          </p>
          <div className="flex justify-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => window.open('https://vitejs.dev', '_blank')}
            >
              📖 Vite Docs
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => window.open('https://react.dev', '_blank')}
            >
              ⚛️ React Docs
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => window.open('http://localhost:6006', '_blank')}
            >
              📚 Storybook
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;

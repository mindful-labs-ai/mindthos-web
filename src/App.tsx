import { useState } from 'react';

import { Button } from '@/components/ui';

import './App.css';

function App() {
  const [count, setCount] = useState(0);
  const [isDark, setIsDark] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const toggleDarkMode = () => {
    document.documentElement.classList.toggle('dark');
    setIsDark(!isDark);
  };

  const handleLoadingDemo = () => {
    setIsLoading(true);
    setTimeout(() => setIsLoading(false), 2000);
  };

  return (
    <div className="min-h-screen bg-bg text-fg transition-colors">
      <div className="mx-auto max-w-4xl p-8">
        <div className="mb-4 flex justify-end">
          <Button variant="outline" size="sm" onClick={toggleDarkMode}>
            {isDark ? '☀️ Light' : '🌙 Dark'}
          </Button>
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

import { useState } from 'react'
import reactLogo from './assets/react.svg'
import { Button } from '@/components/ui'
import './App.css'

function App() {
  const [count, setCount] = useState(0)
  const [isDark, setIsDark] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const toggleDarkMode = () => {
    document.documentElement.classList.toggle('dark')
    setIsDark(!isDark)
  }

  const handleLoadingDemo = () => {
    setIsLoading(true)
    setTimeout(() => setIsLoading(false), 2000)
  }

  return (
    <div className="min-h-screen bg-bg text-fg transition-colors">
      <div className="max-w-4xl mx-auto p-8">
        <div className="flex justify-end mb-4">
          <Button variant="outline" size="sm" onClick={toggleDarkMode}>
            {isDark ? '☀️ Light' : '🌙 Dark'}
          </Button>
        </div>

        <div className="flex justify-center gap-8 mb-8">
          <a href="https://react.dev" target="_blank" rel="noopener noreferrer">
            <img src={reactLogo} className="logo react" alt="React logo" />
          </a>
        </div>

        <h1 className="text-4xl font-bold text-center mb-8">Mindthos V2</h1>
        <p className="text-center text-muted mb-8">
          Production-grade React + TypeScript + Vite baseline
        </p>

        <div className="bg-primary-50 dark:bg-primary-900/20 rounded-lg p-8 mb-8">
          <h2 className="text-2xl font-semibold mb-4">Design System Demo</h2>

          <div className="space-y-6">
            <div>
              <h3 className="text-sm font-medium mb-3 text-muted">Counter Example</h3>
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
              <h3 className="text-sm font-medium mb-3 text-muted">Button Variants</h3>
              <div className="flex flex-wrap gap-3">
                <Button variant="solid">Solid</Button>
                <Button variant="outline">Outline</Button>
                <Button variant="ghost">Ghost</Button>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-medium mb-3 text-muted">Button Sizes</h3>
              <div className="flex flex-wrap items-center gap-3">
                <Button size="sm">Small</Button>
                <Button size="md">Medium</Button>
                <Button size="lg">Large</Button>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-medium mb-3 text-muted">Button States</h3>
              <div className="flex flex-wrap gap-3">
                <Button isLoading={isLoading} onClick={handleLoadingDemo}>
                  {isLoading ? 'Loading...' : 'Click to Load'}
                </Button>
                <Button disabled>Disabled</Button>
              </div>
            </div>
          </div>
        </div>

        <div className="text-center space-y-4">
          <p className="text-sm text-muted">
            Edit{' '}
            <code className="bg-primary-100 dark:bg-primary-900 px-2 py-1 rounded">
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
  )
}

export default App

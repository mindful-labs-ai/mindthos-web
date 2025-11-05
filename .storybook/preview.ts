import type { Preview } from '@storybook/react'
import '../src/styles/tokens.css'
import '../src/styles/tailwind.css'

const preview: Preview = {
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    actions: { argTypesRegex: '^on[A-Z].*' },
    a11y: {
      element: '#storybook-root',
      config: {},
      options: {},
      manual: false,
    },
    backgrounds: {
      default: 'light',
      values: [
        {
          name: 'light',
          value: '#ffffff',
        },
        {
          name: 'dark',
          value: '#0b1020',
        },
      ],
    },
  },
  globalTypes: {
    theme: {
      description: 'Global theme for components',
      defaultValue: 'light',
      toolbar: {
        title: 'Theme',
        icon: 'circlehollow',
        items: ['light', 'dark'],
        dynamicTitle: true,
      },
    },
  },
  decorators: [
    (Story, context) => {
      const theme = context.globals.theme || 'light'

      // Apply theme class to html element
      if (typeof document !== 'undefined') {
        document.documentElement.classList.toggle('dark', theme === 'dark')
      }

      return Story()
    },
  ],
}

export default preview

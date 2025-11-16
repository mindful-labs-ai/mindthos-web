import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';

type Theme = 'light' | 'dark';

interface ThemeState {
  theme: Theme;
}

interface ThemeActions {
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
  initialize: () => void;
}

type ThemeStore = ThemeState & ThemeActions;

const applyTheme = (theme: Theme) => {
  if (theme === 'dark') {
    document.documentElement.classList.add('dark');
  } else {
    document.documentElement.classList.remove('dark');
  }
};

export const useThemeStore = create<ThemeStore>()(
  devtools(
    persist(
      (set, get) => ({
        theme: 'light',

        setTheme: (theme) => {
          applyTheme(theme);
          set({ theme }, false, 'setTheme');
        },

        toggleTheme: () => {
          const { theme } = get();
          const newTheme = theme === 'dark' ? 'light' : 'dark';
          applyTheme(newTheme);
          set({ theme: newTheme }, false, 'toggleTheme');
        },

        initialize: () => {
          const { theme } = get();
          applyTheme(theme);
        },
      }),
      {
        name: 'theme-storage',
      }
    ),
    { name: 'ThemeStore' }
  )
);

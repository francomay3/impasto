import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import {
  MantineProvider,
  createTheme,
  DEFAULT_THEME,
  type MantineColorsTuple,
} from '@mantine/core';
import { Notifications } from '@mantine/notifications';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import '@mantine/core/styles.css';
import '@mantine/notifications/styles.css';
import { AuthInit } from './features/auth/AuthInit';
import { AppRouter } from './routes/AppRouter';
import { ErrorBoundary } from './shared/ErrorBoundary';

const queryClient = new QueryClient();

// Custom dark palette matching the app's design tokens.
// Use var(--mantine-color-dark-N) in components instead of hardcoded hex values.
const darkColors: MantineColorsTuple = [
  '#c9c9c9', // [0] bright text
  '#888', // [1] muted icons / chevrons
  '#555', // [2] drag handles
  '#444', // [3] subtle borders
  '#333', // [4] standard borders
  '#2a2a2a', // [5] group borders
  '#222', // [6] filter headers / panel borders
  '#1a1a1a', // [7] card / item backgrounds
  '#161616', // [8] sidebar / panel backgrounds
  '#111', // [9] deepest backgrounds (header, viewport, main)
];

const theme = createTheme({
  primaryColor: 'primary',
  fontFamily: 'Inter, system-ui, sans-serif',
  colors: {
    dark: darkColors,
    primary: DEFAULT_THEME.colors.teal,
    secondary: DEFAULT_THEME.colors.indigo,
    tertiary: DEFAULT_THEME.colors.orange,
  },
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <MantineProvider theme={theme} defaultColorScheme="dark" env={import.meta.env.VITE_E2E_TEST_MODE === 'true' ? 'test' : undefined}>
        <Notifications />
        <ErrorBoundary>
          <AuthInit />
          <AppRouter />
        </ErrorBoundary>
      </MantineProvider>
    </QueryClientProvider>
  </StrictMode>
);

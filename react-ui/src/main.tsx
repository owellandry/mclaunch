import { StrictMode, useEffect } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider } from 'react-router-dom'
import { router } from './presentation/router'
import { useLauncherStore } from './application/store/useLauncherStore'
import { useAppStore } from './application/store/useAppStore'
import './index.css'

function AppRoot() {
  const initListeners = useLauncherStore((state) => state.initListeners);
  const fetchLogo = useAppStore((state) => state.fetchLogo);
  const logo = useAppStore((state) => state.logo);

  useEffect(() => {
    fetchLogo();
    const cleanup = initListeners();
    return cleanup;
  }, [initListeners, fetchLogo]);

  useEffect(() => {
    // Remove previous theme classes
    document.body.classList.remove(
      'theme-logo_gren',
      'theme-logo_blue',
      'theme-logo_lemon',
      'theme-logo_purple',
      'theme-logo_yellow'
    );
    // Add current theme class based on logo (e.g. "logo_gren.svg" -> "theme-logo_gren")
    const themeName = logo.split('.')[0];
    if (themeName) {
      document.body.classList.add(`theme-${themeName}`);
    }
  }, [logo]);

  return <RouterProvider router={router} />;
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AppRoot />
  </StrictMode>,
)

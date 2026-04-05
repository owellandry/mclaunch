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

  useEffect(() => {
    fetchLogo();
    const cleanup = initListeners();
    return cleanup;
  }, [initListeners, fetchLogo]);

  return <RouterProvider router={router} />;
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AppRoot />
  </StrictMode>,
)

/* @refresh reload */
import { StrictMode, useEffect, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { router } from './presentation/router'
import { useLauncherStore } from './application/store/useLauncherStore'
import { useAppStore } from './application/store/useAppStore'
import './index.css'
import './i18n'
import i18n from './i18n'

type BootstrapState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'ready' }

const preloadInitialRoute = async (isAuthenticated: boolean): Promise<void> => {
  if (isAuthenticated) {
    await Promise.all([
      import('./presentation/components/layout/MainLayout'),
      import('./presentation/pages/Dashboard'),
      import('./presentation/pages/Library'),
      import('./presentation/pages/Servers'),
      import('./presentation/pages/Settings'),
      import('./presentation/pages/SkinStudio'),
    ])
    return
  }

  await import('./presentation/pages/Onboarding')
}

const applyThemeClass = (logo: string): void => {
  document.body.classList.remove(
    'theme-logo_gren',
    'theme-logo_blue',
    'theme-logo_lemon',
    'theme-logo_purple',
    'theme-logo_yellow'
  )

  const themeName = logo.split('.')[0]
  if (themeName) {
    document.body.classList.add(`theme-${themeName}`)
  }
}

function BootSplash({
  status,
  errorMessage,
  onRetry,
}: {
  status: 'loading' | 'error'
  errorMessage?: string
  onRetry: () => void
}) {
  const { t } = useTranslation()
  const title = status === 'loading' ? t('boot.title') : t('boot.error_title')
  const subtitle = status === 'loading' ? t('boot.subtitle') : errorMessage ?? t('boot.error_subtitle')

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-surface px-6">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,var(--color-primary-shadow)_0%,transparent_58%)] opacity-90" />
      <div className="absolute inset-0 opacity-30 [background-image:linear-gradient(rgba(255,255,255,0.04)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.04)_1px,transparent_1px)] [background-size:32px_32px]" />

      <div className="relative z-10 w-full max-w-xl overflow-hidden border border-white/10 bg-background/88 p-10 shadow-[0_30px_80px_rgba(0,0,0,0.35)] backdrop-blur-2xl mc-cutout">
        <div className="mb-8 flex items-center gap-4">
          <div className="relative flex h-16 w-16 items-center justify-center border border-primary/30 bg-surfaceLight shadow-[0_0_30px_var(--color-primary-shadow)] mc-cutout-small">
            <div className="absolute inset-2 border border-white/10 mc-cutout-small" />
            <div className={`h-6 w-6 bg-primary shadow-[0_0_20px_var(--color-primary-shadow)] ${status === 'loading' ? 'animate-pulse' : ''}`} />
          </div>

          <div>
            <p className="text-[11px] font-black uppercase tracking-[0.45em] text-primary">
              {t('boot.eyebrow')}
            </p>
            <h1 className="mt-2 text-3xl font-black uppercase tracking-tight text-textMain">
              {title}
            </h1>
          </div>
        </div>

        <p className="max-w-lg text-sm font-medium leading-7 text-textMuted">
          {subtitle}
        </p>

        <div className="mt-8 space-y-3">
          <div className="h-3 overflow-hidden border border-white/10 bg-surfaceLight/60 mc-cutout-small">
            <div
              className={`h-full w-2/3 bg-gradient-to-r from-primary/50 via-primary to-primary/50 shadow-[0_0_20px_var(--color-primary-shadow)] ${
                status === 'loading' ? 'animate-[boot-loader_1.4s_ease-in-out_infinite]' : ''
              }`}
            />
          </div>

          <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-[0.35em] text-textMuted">
            <span>{t('boot.status_label')}</span>
            <span>{status === 'loading' ? t('boot.status_loading') : t('boot.status_error')}</span>
          </div>
        </div>

        {status === 'error' ? (
          <div className="mt-8 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={onRetry}
              className="btn-primary mc-button-cutout"
            >
              {t('boot.retry')}
            </button>
          </div>
        ) : null}
      </div>
    </div>
  )
}

function AppRoot() {
  const initListeners = useLauncherStore((state) => state.initListeners)
  const hydrateDashboard = useLauncherStore((state) => state.hydrateDashboard)
  const fetchLogo = useAppStore((state) => state.fetchLogo)
  const fetchLanguage = useAppStore((state) => state.fetchLanguage)
  const checkAuth = useAppStore((state) => state.checkAuth)
  const logo = useAppStore((state) => state.logo)
  const language = useAppStore((state) => state.language)
  const [bootstrapToken, setBootstrapToken] = useState(0)
  const [bootstrapState, setBootstrapState] = useState<BootstrapState>({ status: 'loading' })

  useEffect(() => {
    let isDisposed = false
    const cleanup = initListeners()

    const bootstrap = async () => {
      try {
        await Promise.all([fetchLogo(), fetchLanguage(), checkAuth()])

        const { profile, language: selectedLanguage, logo: selectedLogo } = useAppStore.getState()

        if (selectedLanguage) {
          await i18n.changeLanguage(selectedLanguage)
        }

        applyThemeClass(selectedLogo)

        if (profile?.isOnboardingCompleted) {
          await hydrateDashboard()
        }

        await preloadInitialRoute(Boolean(profile?.isOnboardingCompleted))

        if (!isDisposed) {
          setBootstrapState({ status: 'ready' })
        }
      } catch (error) {
        console.error('Fallo durante la inicialización de la app.', error)

        if (!isDisposed) {
          setBootstrapState({
            status: 'error',
            message:
              error instanceof Error && error.message
                ? error.message
                : 'No se pudo completar la inicialización del launcher.',
          })
        }
      }
    }

    void bootstrap()

    return () => {
      isDisposed = true
      cleanup()
    }
  }, [bootstrapToken, initListeners, fetchLogo, fetchLanguage, checkAuth, hydrateDashboard])

  useEffect(() => {
    if (language) {
      void i18n.changeLanguage(language)
    }
  }, [language])

  useEffect(() => {
    applyThemeClass(logo)
  }, [logo])

  if (bootstrapState.status !== 'ready') {
    return (
      <BootSplash
        status={bootstrapState.status}
        errorMessage={bootstrapState.status === 'error' ? bootstrapState.message : undefined}
        onRetry={() => {
          setBootstrapState({ status: 'loading' })
          setBootstrapToken((value) => value + 1)
        }}
      />
    )
  }

  return <RouterProvider router={router} />
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AppRoot />
  </StrictMode>,
)

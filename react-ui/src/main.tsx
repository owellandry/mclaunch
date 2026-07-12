/* @refresh reload */
import { useEffect, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { router } from './presentation/routes'
import { useLauncherStore } from './application/store/useLauncherStore'
import { useAppStore } from './application/store/useAppStore'
import { WindowControls } from './presentation/layout/WindowControls'
import loginBgGif from './assets/login-bg.gif'
import heroImage from './assets/hero.png'
import './index.css'
import './i18n'
import i18n from './i18n'

type BootstrapState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'ready' }

const preloadImage = (src: string): Promise<void> =>
  new Promise((resolve) => {
    const img = new Image()
    img.onload = () => resolve()
    img.onerror = () => resolve()
    img.src = src
  })

const waitForNextPaint = (): Promise<void> =>
  new Promise((resolve) => {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => resolve())
    })
  })

const preloadInitialRoute = async (isAuthenticated: boolean): Promise<void> => {
  if (isAuthenticated) {
    await Promise.all([
      import('./presentation/layout/MainLayout'),
      import('./presentation/pages/Dashboard'),
      import('./presentation/features/dashboard/DashboardContent'),
      preloadImage(heroImage),
    ])
    return
  }

  await import('./presentation/pages/Onboarding')
}

const preloadSecondaryPrivateRoutes = async (): Promise<void> => {
  await Promise.all([
    import('./presentation/pages/Library'),
    import('./presentation/pages/Servers'),
    import('./presentation/pages/Settings'),
    import('./presentation/pages/SkinStudio'),
    import('./presentation/pages/ActivityDetails'),
    import('./presentation/pages/StatisticsDetails'),
    import('./presentation/pages/VersionsDetails'),
  ])
}

const scheduleBackgroundWarmup = (task: () => Promise<void>): void => {
  const win = window as Window & {
    requestIdleCallback?: (callback: () => void) => number
  }

  if (typeof win.requestIdleCallback === 'function') {
    win.requestIdleCallback(() => {
      void task()
    })
    return
  }

  window.setTimeout(() => {
    void task()
  }, 250)
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

function openCubytSite() {
  const url = 'https://cubyt.co/'
  try {
    const openExternal = window.api?.openExternal
    if (typeof openExternal === 'function') {
      void Promise.resolve(openExternal(url)).catch(() => {
        window.open(url, '_blank', 'noopener,noreferrer')
      })
      return
    }
  } catch {
    // Fallback when Electron API is incomplete or unavailable.
  }
  window.open(url, '_blank', 'noopener,noreferrer')
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
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[var(--surface-dashboard)] p-6">
      <img
        src={loginBgGif}
        alt=""
        aria-hidden
        className="pointer-events-none absolute inset-0 h-full w-full object-cover"
      />
      <div className="pointer-events-none absolute inset-0 bg-[var(--surface-dashboard)]/55" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,var(--color-primary-shadow)_0%,transparent_65%)] opacity-30" />

      <div
        className="fixed top-0 left-0 right-0 z-50 flex h-14 items-center justify-end pr-6"
        style={{ WebkitAppRegion: 'drag' } as React.CSSProperties}
      >
        <div style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}>
          <WindowControls />
        </div>
      </div>

      <div className="relative z-10 grid w-full max-w-4xl grid-cols-1 items-center gap-10 md:grid-cols-2">
        <div className="text-center md:text-left">
          <p className="text-xs font-semibold tracking-wide text-[var(--color-hero-eyebrow)] drop-shadow-sm">
            SLAUMCHER
          </p>
          <h1 className="mt-4 font-black leading-[0.9] tracking-tight text-[clamp(2rem,5vw,3rem)] text-[var(--color-hero-heading)] drop-shadow-md">
            {title}
          </h1>
          <p className="mx-auto mt-4 max-w-md text-sm leading-relaxed text-[var(--color-hero-description)]/90 drop-shadow-sm md:mx-0">
            {subtitle}
          </p>
        </div>

        <div className="rounded-xl border border-white/10 bg-[var(--surface-elevated)]/90 p-8 backdrop-blur-xl">
          <div className="mb-8 text-center">
            <h2 className="text-sm font-black uppercase tracking-[0.22em] text-white">
              {t('boot.eyebrow')}
            </h2>
            <p className="mt-2 text-xs font-medium text-white/50">
              {status === 'loading' ? t('boot.status_loading') : t('boot.status_error')}
            </p>
          </div>

          <div className="space-y-3">
            <div className="h-2 overflow-hidden rounded-full border border-white/10 bg-white/5">
              <div
                className={
                  status === 'loading'
                    ? 'h-full w-2/3 animate-[boot-loader_1.4s_ease-in-out_infinite] rounded-full bg-gradient-to-r from-primary/50 via-primary to-primary/50'
                    : 'h-full w-full rounded-full bg-red-400/70'
                }
              />
            </div>
            <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-[0.22em] text-white/45">
              <span>{t('boot.status_label')}</span>
              <span>{status === 'loading' ? t('boot.status_loading') : t('boot.status_error')}</span>
            </div>
          </div>

          {status === 'error' ? (
            <button
              type="button"
              onClick={onRetry}
              className="mt-8 flex w-full cursor-pointer items-center justify-center rounded-full bg-white py-4 text-sm font-bold uppercase tracking-widest text-[var(--color-dark)] transition-colors hover:bg-white/90"
            >
              {t('boot.retry')}
            </button>
          ) : null}
        </div>
      </div>

      <a
        href="https://cubyt.co/"
        target="_blank"
        rel="noopener noreferrer"
        onClick={(event) => {
          event.preventDefault()
          openCubytSite()
        }}
        className="absolute bottom-5 right-6 z-10 cursor-pointer text-xs font-normal text-white/40 transition-colors hover:text-white/70"
      >
        by <span className="text-white/60">cubytlab</span>
      </a>
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
  /** Keeps the boot UI visible until the destination route has painted underneath. */
  const [splashVisible, setSplashVisible] = useState(true)

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

        if (isDisposed) return

        // Mount the router under the splash; splash is dismissed in a separate
        // effect after the destination UI has a chance to paint.
        setBootstrapState({ status: 'ready' })

        if (profile?.isOnboardingCompleted) {
          scheduleBackgroundWarmup(preloadSecondaryPrivateRoutes)
        }
      } catch (error) {
        console.error('Fallo durante la inicialización de la app.', error)

        if (!isDisposed) {
          setSplashVisible(true)
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

  // Once bootstrap is ready, keep the splash overlay until the router tree
  // has mounted and painted — avoids a black frame between boot and dashboard.
  useEffect(() => {
    if (bootstrapState.status !== 'ready' || !splashVisible) return

    let cancelled = false

    const releaseSplash = async () => {
      await waitForNextPaint()
      await waitForNextPaint()
      await new Promise<void>((resolve) => {
        window.setTimeout(resolve, 150)
      })
      if (!cancelled) {
        setSplashVisible(false)
      }
    }

    void releaseSplash()

    return () => {
      cancelled = true
    }
  }, [bootstrapState.status, splashVisible])

  const showSplash =
    splashVisible || bootstrapState.status === 'loading' || bootstrapState.status === 'error'

  return (
    <div className="relative min-h-screen bg-black">
      {bootstrapState.status === 'ready' ? <RouterProvider router={router} /> : null}

      {showSplash ? (
        <div className="fixed inset-0 z-[200]">
          <BootSplash
            status={bootstrapState.status === 'error' ? 'error' : 'loading'}
            errorMessage={bootstrapState.status === 'error' ? bootstrapState.message : undefined}
            onRetry={() => {
              setSplashVisible(true)
              setBootstrapState({ status: 'loading' })
              setBootstrapToken((value) => value + 1)
            }}
          />
        </div>
      ) : null}
    </div>
  )
}

createRoot(document.getElementById('root')!).render(
  <AppRoot />,
)

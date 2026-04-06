import { useEffect, useMemo, useState } from 'react'

type InstallerEnvironment = {
  platform: string
  arch: string
  version: string
}

const installSteps = [
  {
    title: 'Escanear el sistema',
    description: 'Comprobamos Java, GPU y acceso a carpetas antes de tocar nada.',
  },
  {
    title: 'Preparar runtime',
    description: 'Descargamos dependencias mínimas y dejamos la base del launcher lista.',
  },
  {
    title: 'Aplicar experiencia MC Launch',
    description: 'Instalamos assets, configuración visual y la estructura inicial del launcher.',
  },
  {
    title: 'Verificar y finalizar',
    description: 'Ejecutamos checks finales y dejamos un resumen de lo que quedó listo.',
  },
] as const

const featureCards = [
  {
    eyebrow: 'Diseño',
    title: 'Mismo lenguaje visual',
    copy: 'Inspirado en react-ui, pero simplificado para un flujo de instalación más veloz y enfocado.',
  },
  {
    eyebrow: 'Estado',
    title: 'Telemetría clara',
    copy: 'Progreso, módulos preparados y resumen del sistema en una sola vista, sin pestañas extra.',
  },
  {
    eyebrow: 'Mock',
    title: 'Base para iterar',
    copy: 'Esta versión ya sirve para probar layout, tono visual y microinteracciones antes de conectar la lógica real.',
  },
] as const

const fakeLogs = [
  '[core] Inicializando instalador liviano',
  '[checks] Java runtime detectado',
  '[assets] Cola de recursos preparada',
  '[ui] Cargando skin visual del instalador',
  '[done] Mockup listo para conectar flujos reales',
] as const

const progressMilestones = [18, 37, 56, 78, 100]

export function App() {
  const [progress, setProgress] = useState(18)
  const [activeStep, setActiveStep] = useState(0)
  const [environment, setEnvironment] = useState<InstallerEnvironment | null>(null)

  useEffect(() => {
    let cancelled = false

    void window.installerApi?.getPlatform().then((value) => {
      if (!cancelled) {
        setEnvironment(value)
      }
    })

    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    const interval = window.setInterval(() => {
      setProgress((current) => {
        const currentIndex = progressMilestones.indexOf(current)
        const nextIndex = currentIndex === -1 ? 0 : (currentIndex + 1) % progressMilestones.length
        return progressMilestones[nextIndex]
      })
    }, 2200)

    return () => {
      window.clearInterval(interval)
    }
  }, [])

  useEffect(() => {
    const stepIndex = Math.min(
      installSteps.length - 1,
      Math.floor((progress / 100) * installSteps.length),
    )
    setActiveStep(stepIndex)
  }, [progress])

  const statusLabel = useMemo(() => {
    if (progress >= 100) {
      return 'Mock completo'
    }

    if (progress >= 75) {
      return 'Cerrando instalación'
    }

    if (progress >= 50) {
      return 'Montando experiencia'
    }

    return 'Preparando base'
  }, [progress])

  return (
    <div className="installer-shell">
      <div className="ambient ambient-left" />
      <div className="ambient ambient-right" />

      <header className="window-frame">
        <div className="window-drag">
          <div className="brand-chip">
            <span className="brand-dot" />
            <div>
              <p className="eyebrow">MC Launch Installer</p>
              <strong>Prototype Session</strong>
            </div>
          </div>

          <div className="frame-actions">
            <button type="button" onClick={() => window.installerApi?.minimizeWindow()}>
              _
            </button>
            <button type="button" onClick={() => window.installerApi?.maximizeWindow()}>
              □
            </button>
            <button type="button" onClick={() => window.installerApi?.closeWindow()} className="danger">
              ×
            </button>
          </div>
        </div>
      </header>

      <main className="installer-layout">
        <section className="hero-panel cutout-panel">
          <div className="hero-copy">
            <p className="eyebrow">Instalador ligero</p>
            <h1>Un flujo visual propio para instalar MC Launch sin cargar el launcher completo.</h1>
            <p className="hero-description">
              Este mockup replica la atmósfera de react-ui, pero concentrado en onboarding,
              progreso y validación del entorno. La idea es que luego conectemos aquí los pasos reales.
            </p>

            <div className="cta-row">
              <button type="button" className="primary-button">
                Instalar ahora
              </button>
              <button type="button" className="ghost-button">
                Ver detalles
              </button>
            </div>
          </div>

          <div className="hero-stage">
            <div className="stage-grid" />
            <div className="stage-card stage-card-primary">
              <span>Runtime</span>
              <strong>{progress}%</strong>
            </div>
            <div className="stage-card stage-card-secondary">
              <span>UI Pack</span>
              <strong>Ready</strong>
            </div>
            <div className="stage-card stage-card-tertiary">
              <span>Perfil</span>
              <strong>Mockup</strong>
            </div>
          </div>
        </section>

        <section className="content-grid">
          <article className="progress-panel cutout-panel">
            <div className="panel-head">
              <div>
                <p className="eyebrow">Progreso</p>
                <h2>{statusLabel}</h2>
              </div>
              <div className="status-pill">{progress}%</div>
            </div>

            <div className="progress-track">
              <div className="progress-fill" style={{ width: `${progress}%` }} />
            </div>

            <div className="steps-list">
              {installSteps.map((step, index) => (
                <div
                  key={step.title}
                  className={`step-card ${index === activeStep ? 'active' : ''} ${index < activeStep ? 'done' : ''}`}
                >
                  <span className="step-index">0{index + 1}</span>
                  <div>
                    <strong>{step.title}</strong>
                    <p>{step.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </article>

          <article className="details-panel cutout-panel">
            <div className="panel-head">
              <div>
                <p className="eyebrow">Entorno</p>
                <h2>Resumen local</h2>
              </div>
            </div>

            <div className="stats-grid">
              <div className="stat-card">
                <span>Plataforma</span>
                <strong>{environment?.platform ?? 'win32'}</strong>
              </div>
              <div className="stat-card">
                <span>Arquitectura</span>
                <strong>{environment?.arch ?? 'x64'}</strong>
              </div>
              <div className="stat-card">
                <span>Build</span>
                <strong>{environment?.version ?? '0.0.0'}</strong>
              </div>
              <div className="stat-card">
                <span>Modo</span>
                <strong>Mock</strong>
              </div>
            </div>

            <div className="log-panel">
              <div className="log-head">
                <span className="eyebrow">Consola</span>
                <span className="log-badge">Live mock</span>
              </div>

              {fakeLogs.map((line, index) => (
                <code key={line} className={index === fakeLogs.length - 1 ? 'latest' : ''}>
                  {line}
                </code>
              ))}
            </div>
          </article>
        </section>

        <section className="features-row">
          {featureCards.map((card) => (
            <article key={card.title} className="feature-card cutout-panel">
              <p className="eyebrow">{card.eyebrow}</p>
              <h3>{card.title}</h3>
              <p>{card.copy}</p>
            </article>
          ))}
        </section>
      </main>
    </div>
  )
}

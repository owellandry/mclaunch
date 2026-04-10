import { useNavigate } from "react-router-dom";
import { Button } from "../components/atoms/Button";
import { Card } from "../components/atoms/Card";
import { SlimeAnimationMob } from "../components/atoms/SlimeAnimationMob";
import { INSTALLER_SLIME_TRANSITION_NAME, setTransitionDirection } from "../lib/viewTransition";

export function Welcome() {
  const navigate = useNavigate();

  const handleInstall = () => {
    setTransitionDirection("forward");
    navigate("/install", { viewTransition: true });
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center animate-in fade-in zoom-in duration-300">
      <div className="w-full max-w-4xl grid grid-cols-[minmax(0,1fr)_360px] gap-5 items-center installer-welcome-grid">
        <div className="flex flex-col justify-center">
          <p className="text-primary font-bold tracking-[0.3em] uppercase text-xs mb-2">
            Instalador Oficial
          </p>
          <h1 className="text-4xl font-black uppercase tracking-tight text-textMain mb-4 leading-none">
            Preparando
            <br />
            Slaumcher
          </h1>
          <p className="text-textMuted text-sm leading-relaxed mb-8 max-w-xl">
            Instala el launcher moderno de Minecraft con una interfaz atomica, integracion
            oficial de Microsoft y una experiencia visual lista para evolucionar en algo mucho
            mas completo.
          </p>

          <div className="flex gap-4 flex-wrap">
            <Button onClick={handleInstall} variant="primary" className="px-8 py-3 text-sm">
              Instalar Ahora
            </Button>
            <Button
              onClick={() => window.installerApi?.closeWindow()}
              variant="ghost"
              className="px-6 py-3 text-sm"
            >
              Cancelar
            </Button>
          </div>
        </div>

        <div className="flex flex-col gap-4 h-full">
          <Card className="p-5 relative overflow-hidden installer-slime-card h-full">
            <div className="relative flex items-center justify-center h-full">
              <SlimeAnimationMob
                size={192}
                transitionName={INSTALLER_SLIME_TRANSITION_NAME}
              />
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

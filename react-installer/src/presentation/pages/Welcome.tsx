import { useNavigate } from "react-router-dom";
import { Button } from "../components/atoms/Button";
import { Card } from "../components/atoms/Card";

export function Welcome() {
  const navigate = useNavigate();

  return (
    <div className="flex-1 flex flex-col items-center justify-center animate-in fade-in zoom-in duration-300">
      <div className="w-full max-w-2xl flex gap-8">
        {/* Lado izquierdo - Texto */}
        <div className="flex-1 flex flex-col justify-center">
          <p className="text-primary font-bold tracking-[0.3em] uppercase text-xs mb-2">Instalador Oficial</p>
          <h1 className="text-4xl font-black uppercase tracking-tight text-textMain mb-4">
            Preparando<br/>MC Launch
          </h1>
          <p className="text-textMuted text-sm leading-relaxed mb-8">
            Instala el launcher moderno de Minecraft con una interfaz atómica, integración oficial de Microsoft y mods inyectables.
          </p>
          
          <div className="flex gap-4">
            <Button onClick={() => navigate("/install")} variant="primary" className="px-8 py-3 text-sm">
              Instalar Ahora
            </Button>
            <Button onClick={() => window.installerApi?.closeWindow()} variant="ghost" className="px-6 py-3 text-sm">
              Cancelar
            </Button>
          </div>
        </div>

        {/* Lado derecho - Feature Cards */}
        <div className="flex-1 flex flex-col gap-4">
          <Card className="p-4 border-l-4 border-l-primary/50">
            <h3 className="font-bold text-textMain text-sm uppercase">Diseño Atómico</h3>
            <p className="text-textMuted text-xs mt-1">Interfaz Glassmorphism ultra rápida con animaciones nativas.</p>
          </Card>
          <Card className="p-4 border-l-4 border-l-primary/50">
            <h3 className="font-bold text-textMain text-sm uppercase">Cuentas Premium</h3>
            <p className="text-textMuted text-xs mt-1">Soporte nativo y seguro usando MSMC para cuentas Microsoft.</p>
          </Card>
          <Card className="p-4 border-l-4 border-l-primary/50">
            <h3 className="font-bold text-textMain text-sm uppercase">Mod Inyectable</h3>
            <p className="text-textMuted text-xs mt-1">Menú principal de Java reimaginado por completo.</p>
          </Card>
        </div>
      </div>
    </div>
  );
}

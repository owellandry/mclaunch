import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FiCommand, FiCpu, FiFolder, FiUser } from "react-icons/fi";
import { useAppStore } from "../../../application/store/useAppStore";
import { Card } from "../components/ui/Card";
import { Button } from "../components/ui/Button";

export function Onboarding() {
  const navigate = useNavigate();
  const { completeOnboarding, config } = useAppStore();
  
  const [username, setUsername] = useState("");
  const [memory, setMemory] = useState(config.memoryMb);
  const [gameDir, setGameDir] = useState(config.gameDir);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (username.trim().length < 3) return;
    
    completeOnboarding(username.trim(), memory, gameDir);
    navigate("/dashboard");
  };

  return (
    <div className="min-h-screen w-full bg-background flex items-center justify-center relative overflow-hidden">
      <div className="absolute top-0 left-[-20%] w-[70%] h-[70%] bg-primary/10 rounded-full blur-[150px] pointer-events-none" />
      <div className="absolute bottom-0 right-[-20%] w-[60%] h-[60%] bg-secondary/10 rounded-full blur-[150px] pointer-events-none" />
      
      <Card className="w-full max-w-xl z-10 relative border-primary/20 shadow-[0_0_50px_rgba(102,252,241,0.05)]">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-primary/20 text-primary rounded-2xl flex items-center justify-center mx-auto mb-4 border border-primary/50 shadow-[0_0_20px_rgba(102,252,241,0.2)]">
            <FiCommand className="text-3xl" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Bienvenido a Nebula Console</h1>
          <p className="text-textMain/80">Configura tu perfil de piloto para comenzar.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-semibold text-white flex items-center gap-2">
              <FiUser className="text-primary" /> Nombre de Piloto
            </label>
            <input 
              type="text"
              required
              minLength={3}
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full bg-surface/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary/50 transition-colors"
              placeholder="Ej. Pilot Zero"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-white flex items-center gap-2">
              <FiCpu className="text-primary" /> Memoria RAM (MB)
            </label>
            <input 
              type="number"
              required
              min={1024}
              step={512}
              value={memory}
              onChange={(e) => setMemory(Number(e.target.value))}
              className="w-full bg-surface/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary/50 transition-colors"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-white flex items-center gap-2">
              <FiFolder className="text-primary" /> Directorio del Juego
            </label>
            <input 
              type="text"
              required
              value={gameDir}
              onChange={(e) => setGameDir(e.target.value)}
              className="w-full bg-surface/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary/50 transition-colors"
            />
          </div>

          <Button 
            type="submit" 
            className="w-full py-4 text-lg mt-4" 
            disabled={username.trim().length < 3}
          >
            Inicializar Sistema
          </Button>
        </form>
      </Card>
    </div>
  );
}

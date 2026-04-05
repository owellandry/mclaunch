import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FiCommand, FiCpu, FiFolder, FiUser } from "react-icons/fi";
import { useAppStore } from "../../application/store/useAppStore";
import { Card } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { useTranslation } from "react-i18next";

export function Onboarding() {
  const navigate = useNavigate();
  const { completeOnboarding, config } = useAppStore();
  const { t } = useTranslation();
  
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
    <div className="min-h-screen w-full bg-background flex items-center justify-center relative p-8">
      <div className="absolute inset-0 bg-[url('/src/assets/hero.png')] bg-cover bg-center opacity-10" />
      <div className="absolute inset-0 bg-gradient-to-b from-background/80 to-background" />
      
      <div className="w-full max-w-xl z-10 relative">
        <Card className="border-t-4 border-t-primary shadow-2xl">
          <div className="text-center mb-10">
            <div className="w-20 h-20 bg-surface border border-black/10 text-primary mx-auto mb-6 flex items-center justify-center mc-cutout-small shadow-[0_0_20px_var(--color-primary-shadow)]">
              <FiCommand className="text-4xl" />
            </div>
            <h1 className="text-4xl font-black text-textMain mb-2 uppercase tracking-tight">{t("onboarding.sys_config")}</h1>
            <p className="text-primary font-mono text-sm tracking-widest uppercase">{t("onboarding.init_profile")}</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="text-xs font-bold text-textMuted uppercase tracking-wider flex items-center gap-2">
                <FiUser className="text-primary" /> {t("onboarding.player_name")}
              </label>
              <input 
                type="text"
                required
                minLength={3}
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="input-field w-full"
                placeholder="ej. Steve"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-textMuted uppercase tracking-wider flex items-center gap-2">
                <FiCpu className="text-primary" /> {t("onboarding.ram_mb")}
              </label>
              <input 
                type="number"
                required
                min={1024}
                step={512}
                value={memory}
                onChange={(e) => setMemory(Number(e.target.value))}
                className="input-field w-full"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-textMuted uppercase tracking-wider flex items-center gap-2">
                <FiFolder className="text-primary" /> {t("onboarding.game_dir")}
              </label>
              <input 
                type="text"
                required
                value={gameDir}
                onChange={(e) => setGameDir(e.target.value)}
                className="input-field w-full"
              />
            </div>

            <Button 
              type="submit" 
              className="w-full py-4 text-lg mt-8" 
              disabled={username.trim().length < 3}
            >
              {t("onboarding.confirm_start")}
            </Button>
          </form>
        </Card>
      </div>
    </div>
  );
}

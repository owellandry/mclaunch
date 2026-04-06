/**
 * @file SkinStudio.tsx
 * @description Página de SkinStudio. Área de personalización y visualización del perfil del usuario.
 * 
 * Patrón: Atomic Design
 */
import { useEffect, useMemo, useRef, useState, type ChangeEvent } from "react";
import { useNavigate } from "react-router-dom";
import { FiArrowLeft, FiDownload, FiImage, FiRefreshCw, FiUpload } from "react-icons/fi";
import { useTranslation } from "react-i18next";
import { Card } from "../components/atoms/Card";
import { SectionTitle } from "../components/atoms/SectionTitle";
import { Button } from "../components/atoms/Button";
import { MinecraftAvatar } from "../components/atoms/MinecraftAvatar";
import { MinecraftSkinFigure } from "../components/atoms/MinecraftSkinFigure";
import { useAppStore } from "../../application/store/useAppStore";
import { useNotificationStore } from "../../application/store/useNotificationStore";
import { PLAYER_AVATAR_TRANSITION_NAME, PLAYER_PROFILE_CHIP_TRANSITION_NAME, startViewTransition } from "../lib/viewTransition";

const SKIN_DRAFT_STORAGE_KEY = "nebula_skin_draft";
const SKIN_DRAFT_NAME_STORAGE_KEY = "nebula_skin_draft_name";

function normalizeSkinUrl(skinUrl?: string | null): string | null {
  if (!skinUrl) {
    return null;
  }

  return skinUrl.replace(/^http:\/\//i, "https://");
}

export function SkinStudio() {
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);
  const profile = useAppStore((state) => state.profile);
  const addNotification = useNotificationStore((state) => state.addNotification);
  const { t } = useTranslation();
  const [draftSkinUrl, setDraftSkinUrl] = useState<string | null>(() => localStorage.getItem(SKIN_DRAFT_STORAGE_KEY));
  const [draftSkinName, setDraftSkinName] = useState<string | null>(() => localStorage.getItem(SKIN_DRAFT_NAME_STORAGE_KEY));

  const officialSkinUrl = normalizeSkinUrl(profile?.skinUrl);
  const activeSkinUrl = draftSkinUrl || officialSkinUrl;
  const usingDraftSkin = Boolean(draftSkinUrl);

  useEffect(() => {
    if (draftSkinUrl) {
      localStorage.setItem(SKIN_DRAFT_STORAGE_KEY, draftSkinUrl);
    } else {
      localStorage.removeItem(SKIN_DRAFT_STORAGE_KEY);
    }
  }, [draftSkinUrl]);

  useEffect(() => {
    if (draftSkinName) {
      localStorage.setItem(SKIN_DRAFT_NAME_STORAGE_KEY, draftSkinName);
    } else {
      localStorage.removeItem(SKIN_DRAFT_NAME_STORAGE_KEY);
    }
  }, [draftSkinName]);

  const currentSourceLabel = useMemo(() => {
    if (usingDraftSkin) {
      return draftSkinName || t("skin_studio.imported_skin");
    }

    if (profile?.username) {
      return `${t("skin_studio.official_skin")} · ${profile.username}`;
    }

    return t("skin_studio.no_skin");
  }, [draftSkinName, profile?.username, t, usingDraftSkin]);

  const handleBack = () => {
    startViewTransition(() => navigate(-1));
  };

  const handleOpenPicker = () => {
    inputRef.current?.click();
  };

  const handleResetToOfficial = () => {
    setDraftSkinUrl(null);
    setDraftSkinName(null);
    addNotification(t("skin_studio.official_restored"), t("skin_studio.official_restored_desc"), "success");
  };

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    if (file.type !== "image/png") {
      addNotification(t("skin_studio.invalid_skin"), t("skin_studio.invalid_skin_desc"), "error");
      event.target.value = "";
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const result = typeof reader.result === "string" ? reader.result : null;
      if (!result) {
        addNotification(t("skin_studio.invalid_skin"), t("skin_studio.invalid_skin_desc"), "error");
        return;
      }

      const image = new Image();
      image.onload = () => {
        const validSize = image.naturalWidth === 64 && (image.naturalHeight === 64 || image.naturalHeight === 32);
        if (!validSize) {
          addNotification(t("skin_studio.invalid_dimensions"), t("skin_studio.invalid_dimensions_desc"), "error");
          return;
        }

        setDraftSkinUrl(result);
        setDraftSkinName(file.name);
        addNotification(t("skin_studio.skin_loaded"), t("skin_studio.skin_loaded_desc"), "success");
      };
      image.onerror = () => {
        addNotification(t("skin_studio.invalid_skin"), t("skin_studio.invalid_skin_desc"), "error");
      };
      image.src = result;
    };
    reader.readAsDataURL(file);
    event.target.value = "";
  };

  return (
    <div className="flex flex-col gap-8 pb-8">
      <div className="flex items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-[0.3em] text-primary">{t("skin_studio.eyebrow")}</span>
          <h1 className="mt-2 text-4xl font-black uppercase tracking-tight text-textMain">{t("skin_studio.title")}</h1>
          <p className="mt-2 max-w-2xl text-sm text-textMuted">{t("skin_studio.subtitle")}</p>
        </div>
        <Button variant="secondary" icon={<FiArrowLeft />} onClick={handleBack}>
          {t("skin_studio.back")}
        </Button>
      </div>

      <div className="grid grid-cols-12 gap-8">
        <div className="col-span-7 flex flex-col gap-8">
          <Card className="overflow-hidden">
            <div className="relative isolate overflow-hidden mc-cutout bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.16),transparent_52%),linear-gradient(135deg,rgba(0,0,0,0.04),rgba(0,0,0,0.18))] p-8">
              <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.04)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.04)_1px,transparent_1px)] bg-[size:32px_32px] opacity-50" />
              <div className="relative z-10 flex flex-col items-center">
                <div
                  className="relative flex min-h-[430px] w-full items-center justify-center overflow-hidden rounded-[28px] border border-white/10 bg-black/10 px-6 py-10 shadow-[0_30px_90px_rgba(0,0,0,0.18)]"
                >
                  <div className="absolute inset-x-10 bottom-8 h-10 rounded-full bg-primary/20 blur-2xl" />
                  <MinecraftSkinFigure textureUrl={activeSkinUrl} pixelSize={11} className="drop-shadow-[0_22px_26px_rgba(0,0,0,0.22)]" />
                </div>

                <div
                  className="mt-6 flex items-center gap-4 rounded-full border border-black/10 bg-surfaceLight/70 px-4 py-3 backdrop-blur"
                  style={{ viewTransitionName: PLAYER_PROFILE_CHIP_TRANSITION_NAME }}
                >
                  <MinecraftAvatar
                    username={profile?.username || "Player"}
                    uuid={usingDraftSkin ? undefined : profile?.uuid}
                    skinUrl={activeSkinUrl}
                    size={44}
                    transitionName={PLAYER_AVATAR_TRANSITION_NAME}
                  />
                  <div className="min-w-0">
                    <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-primary">{t("skin_studio.live_preview")}</p>
                    <p className="truncate text-sm font-bold uppercase tracking-wider text-textMain">{currentSourceLabel}</p>
                  </div>
                </div>
              </div>
            </div>
          </Card>

          <Card>
            <SectionTitle
              eyebrow={t("skin_studio.texture")}
              title={t("skin_studio.texture_title")}
              subtitle={t("skin_studio.texture_subtitle")}
              icon={<FiImage />}
            />
            <div className="overflow-hidden border border-black/10 bg-surfaceLight/40 p-4 mc-cutout-small">
              {activeSkinUrl ? (
                <img
                  src={activeSkinUrl}
                  alt={t("skin_studio.texture_alt")}
                  className="w-full max-h-[420px] object-contain"
                  style={{ imageRendering: "pixelated" }}
                />
              ) : (
                <div className="flex min-h-[220px] items-center justify-center text-sm text-textMuted">
                  {t("skin_studio.no_skin")}
                </div>
              )}
            </div>
          </Card>
        </div>

        <div className="col-span-5 flex flex-col gap-8">
          <Card>
            <SectionTitle
              eyebrow={t("skin_studio.control")}
              title={t("skin_studio.control_title")}
              subtitle={t("skin_studio.control_subtitle")}
              icon={<FiUpload />}
            />
            <div className="space-y-4">
              <input ref={inputRef} type="file" accept=".png,image/png" className="hidden" onChange={handleFileChange} />
              <Button className="w-full py-4" icon={<FiDownload />} onClick={handleOpenPicker}>
                {t("skin_studio.import")}
              </Button>
              <Button className="w-full py-4" variant="secondary" icon={<FiRefreshCw />} onClick={handleResetToOfficial} disabled={!usingDraftSkin}>
                {t("skin_studio.reset")}
              </Button>
              <div className="mc-cutout-small border border-black/5 bg-surfaceLight/30 p-4 text-sm text-textMuted">
                <p className="font-bold uppercase tracking-wider text-textMain">{t("skin_studio.compatibility")}</p>
                <p className="mt-2">{t("skin_studio.compatibility_desc")}</p>
              </div>
            </div>
          </Card>

          <Card>
            <SectionTitle
              eyebrow={t("skin_studio.workflow")}
              title={t("skin_studio.workflow_title")}
              subtitle={t("skin_studio.workflow_subtitle")}
              icon={<FiImage />}
            />
            <div className="space-y-3 text-sm">
              <div className="mc-cutout-small border border-black/5 bg-surfaceLight/20 p-4">
                <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-primary">{t("skin_studio.step_one")}</span>
                <p className="mt-2 text-textMain">{t("skin_studio.step_one_desc")}</p>
              </div>
              <div className="mc-cutout-small border border-black/5 bg-surfaceLight/20 p-4">
                <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-primary">{t("skin_studio.step_two")}</span>
                <p className="mt-2 text-textMain">{t("skin_studio.step_two_desc")}</p>
              </div>
              <div className="mc-cutout-small border border-dashed border-primary/40 bg-primary/5 p-4">
                <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-primary">{t("skin_studio.next_phase")}</span>
                <p className="mt-2 text-textMain">{t("skin_studio.next_phase_desc")}</p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

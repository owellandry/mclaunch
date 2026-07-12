import { useEffect, useMemo, useRef, useState, type ChangeEvent } from "react";
import { useNavigate } from "react-router-dom";
import { FiDownload, FiImage, FiRefreshCw, FiUpload } from "react-icons/fi";
import { useTranslation } from "react-i18next";
import capeTexture from "@/assets/cape.png";
import { Button, PageHeader, Panel } from "@/presentation/design-system";
import { MinecraftAvatar } from "@/presentation/components/minecraft/MinecraftAvatar";
import {
  MinecraftSkinFigure,
  type ViewerMode,
} from "@/presentation/components/minecraft/MinecraftSkinFigure";
import { SkinViewerControls } from "@/presentation/components/minecraft/SkinViewerControls";
import { useAppStore } from "@/application/store/useAppStore";
import { useNotificationStore } from "@/application/store/useNotificationStore";
import { PLAYER_AVATAR_TRANSITION_NAME, startViewTransition } from "@/presentation/lib/viewTransition";
import type { CapeInfo } from "@/core/domain/electron-api";

const SKIN_DRAFT_STORAGE_KEY = "nebula_skin_draft";
const SKIN_DRAFT_NAME_STORAGE_KEY = "nebula_skin_draft_name";
const CORS_PROXY = "https://api.allorigins.win/raw?url=";

function normalizeSkinUrl(skinUrl?: string | null): string | null {
  if (!skinUrl) return null;
  return skinUrl.replace(/^http:\/\//i, "https://");
}

async function fetchSessionProfile(uuid: string): Promise<Record<string, unknown> | null> {
  const urls = [
    `https://sessionserver.mojang.com/session/minecraft/profile/${uuid}?unsigned=false`,
    `${CORS_PROXY}${encodeURIComponent(`https://sessionserver.mojang.com/session/minecraft/profile/${uuid}?unsigned=false`)}`,
  ];
  for (const url of urls) {
    try {
      const res = await fetch(url);
      if (res.ok) return await res.json();
    } catch {
      continue;
    }
  }
  return null;
}

async function findCapeUrl(uuid: string): Promise<string | null> {
  const data = await fetchSessionProfile(uuid);
  if (!data) return null;
  const texturesProp = (data.properties as Array<{ name: string; value: string }> | undefined)?.find(
    (p) => p.name === "textures",
  );
  if (!texturesProp?.value) return null;
  try {
    const decoded = JSON.parse(atob(texturesProp.value));
    const capeUrl: string | undefined = decoded.textures?.CAPE?.url;
    if (!capeUrl) return null;
    return capeUrl.replace(/^http:\/\//i, "https://");
  } catch {
    return null;
  }
}

type CapeEntry = {
  id: string;
  textureUrl: string | null;
  label: string;
  isActive: boolean;
};

export function SkinStudio() {
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);
  const profile = useAppStore((state) => state.profile);
  const addNotification = useNotificationStore((state) => state.addNotification);
  const { t } = useTranslation();
  const [draftSkinUrl, setDraftSkinUrl] = useState<string | null>(() =>
    localStorage.getItem(SKIN_DRAFT_STORAGE_KEY),
  );
  const [draftSkinName, setDraftSkinName] = useState<string | null>(() =>
    localStorage.getItem(SKIN_DRAFT_NAME_STORAGE_KEY),
  );
  const [viewerMode, setViewerMode] = useState<ViewerMode>("walking");
  const [selectedCapeId, setSelectedCapeId] = useState<string>("launcher");
  const [accountCapes, setAccountCapes] = useState<CapeInfo[]>([]);

  const officialSkinUrl = normalizeSkinUrl(profile?.skinUrl);
  const activeSkinUrl = draftSkinUrl || officialSkinUrl;
  const usingDraftSkin = Boolean(draftSkinUrl);

  useEffect(() => {
    const uuid = profile?.uuid;
    if (!uuid) {
      setAccountCapes([]);
      return;
    }
    let cancelled = false;

    (async () => {
      try {
        const capes = await window.api.getCapes();
        if (!cancelled && capes.length > 0) {
          setAccountCapes(capes);
          return;
        }
      } catch {
        /* ignore, fallback */
      }

      const single = await findCapeUrl(uuid);
      if (!cancelled && single) {
        setAccountCapes([{ id: single, url: single, alias: null, state: "ACTIVE" }]);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [profile?.uuid]);

  const capeEntries = useMemo((): CapeEntry[] => {
    const entries: CapeEntry[] = [
      { id: "launcher", textureUrl: capeTexture, label: "Launcher", isActive: true },
    ];
    accountCapes.forEach((cape) => {
      entries.push({
        id: cape.id,
        textureUrl: cape.url,
        label: cape.alias ?? "Cape",
        isActive: cape.state === "ACTIVE",
      });
    });
    return entries;
  }, [accountCapes]);

  const capeUrl = useMemo(() => {
    if (selectedCapeId === "none") return null;
    const entry = capeEntries.find((e) => e.id === selectedCapeId);
    return entry?.textureUrl ?? null;
  }, [selectedCapeId, capeEntries]);

  useEffect(() => {
    const stillExists = capeEntries.some((e) => e.id === selectedCapeId);
    if (!stillExists && selectedCapeId !== "none") {
      setSelectedCapeId("launcher");
    }
  }, [capeEntries, selectedCapeId]);

  useEffect(() => {
    if (draftSkinUrl) localStorage.setItem(SKIN_DRAFT_STORAGE_KEY, draftSkinUrl);
    else localStorage.removeItem(SKIN_DRAFT_STORAGE_KEY);
  }, [draftSkinUrl]);

  useEffect(() => {
    if (draftSkinName) localStorage.setItem(SKIN_DRAFT_NAME_STORAGE_KEY, draftSkinName);
    else localStorage.removeItem(SKIN_DRAFT_NAME_STORAGE_KEY);
  }, [draftSkinName]);

  const currentSourceLabel = useMemo(() => {
    if (usingDraftSkin) return draftSkinName || t("skin_studio.imported_skin");
    if (profile?.username) return `${t("skin_studio.official_skin")} · ${profile.username}`;
    return t("skin_studio.no_skin");
  }, [draftSkinName, profile?.username, t, usingDraftSkin]);

  const handleBack = () => startViewTransition(() => navigate(-1));

  const handleOpenPicker = () => inputRef.current?.click();

  const handleResetToOfficial = () => {
    setDraftSkinUrl(null);
    setDraftSkinName(null);
    addNotification(t("skin_studio.official_restored"), t("skin_studio.official_restored_desc"), "success");
  };

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

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
        const validSize =
          image.naturalWidth === 64 &&
          (image.naturalHeight === 64 || image.naturalHeight === 32);
        if (!validSize) {
          addNotification(
            t("skin_studio.invalid_dimensions"),
            t("skin_studio.invalid_dimensions_desc"),
            "error",
          );
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
    <div className="flex flex-col gap-6">
      <PageHeader
        eyebrow={t("skin_studio.eyebrow")}
        title={t("skin_studio.title")}
        description={t("skin_studio.subtitle")}
        action={
          <Button variant="secondary" onClick={handleBack}>
            {t("skin_studio.back")}
          </Button>
        }
      />

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
        <div className="xl:col-span-7 flex flex-col gap-4">
          <Panel className="overflow-hidden p-0">
            <div className="relative isolate overflow-hidden bg-[radial-gradient(circle_at_top,var(--skin-gradient-top),transparent_52%),linear-gradient(135deg,var(--skin-gradient-mid),var(--skin-gradient-bottom))] p-6 sm:p-8">
              <div className="absolute inset-0 bg-[linear-gradient(to_right,var(--grid-line)_1px,transparent_1px),linear-gradient(to_bottom,var(--grid-line)_1px,transparent_1px)] bg-[size:32px_32px] opacity-50" />
              <div className="relative z-10 flex flex-col items-center">
                <div className="relative flex min-h-[min(430px,55vh)] w-full items-center justify-center overflow-hidden rounded-xl border border-white/10 bg-white/5 px-4 py-8">
                  <div className="absolute inset-x-10 bottom-8 h-10 rounded-full bg-primary/20 blur-2xl" />
                  <MinecraftSkinFigure
                    textureUrl={activeSkinUrl}
                    capeUrl={capeUrl}
                    pixelSize={11}
                    className="drop-shadow-[0_22px_26px_var(--skin-shadow)]"
                    viewerMode={viewerMode}
                  />
                </div>

                <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
                  <SkinViewerControls viewerMode={viewerMode} onChange={setViewerMode} />
                </div>

                <div className="mt-5 flex items-center gap-4 rounded-full border border-white/10 bg-[var(--surface-elevated)] px-4 py-2.5 [view-transition-name:player-profile-chip]">
                  <MinecraftAvatar
                    username={profile?.username || "Player"}
                    uuid={usingDraftSkin ? undefined : profile?.uuid}
                    skinUrl={activeSkinUrl}
                    size={40}
                    transitionName={PLAYER_AVATAR_TRANSITION_NAME}
                  />
                  <div className="min-w-0">
                    <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-primary">
                      {t("skin_studio.live_preview")}
                    </p>
                    <p className="truncate text-sm font-bold uppercase tracking-wider text-white">
                      {currentSourceLabel}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </Panel>

          <Panel>
            <div className="mb-4 flex items-center gap-2">
              <FiImage className="text-primary" />
              <h2 className="text-sm font-black uppercase tracking-[0.18em] text-white">
                {t("skin_studio.texture_title")}
              </h2>
            </div>
            <div className="overflow-hidden rounded-xl border border-white/10 bg-[var(--surface-dashboard)] p-4">
              {activeSkinUrl ? (
                <img
                  src={activeSkinUrl}
                  alt={t("skin_studio.texture_alt")}
                  className="mx-auto max-h-[320px] w-full object-contain [image-rendering:pixelated]"
                />
              ) : (
                <div className="flex min-h-[180px] items-center justify-center text-sm text-white/40">
                  {t("skin_studio.no_skin")}
                </div>
              )}
            </div>
          </Panel>
        </div>

        <div className="xl:col-span-5 flex flex-col gap-4">
          <Panel className="space-y-4">
            <div className="flex items-center gap-2">
              <FiUpload className="text-primary" />
              <h2 className="text-sm font-black uppercase tracking-[0.18em] text-white">
                {t("skin_studio.control_title")}
              </h2>
            </div>
            <input
              ref={inputRef}
              type="file"
              accept=".png,image/png"
              className="hidden"
              onChange={handleFileChange}
            />
            <Button className="w-full py-3" icon={<FiDownload />} onClick={handleOpenPicker}>
              {t("skin_studio.import")}
            </Button>
            <Button
              className="w-full py-3"
              variant="secondary"
              icon={<FiRefreshCw />}
              onClick={handleResetToOfficial}
            >
              {t("skin_studio.reset")}
            </Button>
            <div className="rounded-xl border border-white/10 bg-[var(--surface-dashboard)] p-4 text-sm text-white/55">
              <p className="font-bold uppercase tracking-wider text-white">
                {t("skin_studio.compatibility")}
              </p>
              <p className="mt-2 leading-relaxed">{t("skin_studio.compatibility_desc")}</p>
            </div>
          </Panel>

          <Panel>
            <h2 className="mb-4 text-sm font-black uppercase tracking-[0.18em] text-white">
              {t("skin_studio.capes_title")}
            </h2>
            <div className="flex flex-wrap items-center justify-center gap-3">
              {capeEntries.map((cape) => (
                <button
                  key={cape.id}
                  type="button"
                  onClick={() => setSelectedCapeId(cape.id)}
                  className={`group flex cursor-pointer flex-col items-center gap-1 overflow-hidden rounded-xl border-2 p-2 transition-all ${
                    selectedCapeId === cape.id
                      ? "border-primary"
                      : "border-transparent opacity-60 hover:opacity-100"
                  }`}
                >
                  <img
                    src={cape.textureUrl!}
                    alt=""
                    className="h-12 w-24 rounded-lg object-cover [image-rendering:pixelated]"
                  />
                  <span className="max-w-[6rem] truncate text-[10px] font-semibold uppercase tracking-wider text-white/50">
                    {cape.label}
                  </span>
                </button>
              ))}
              <button
                type="button"
                onClick={() => setSelectedCapeId("none")}
                className={`flex cursor-pointer flex-col items-center justify-center gap-1 rounded-xl border-2 p-2 transition-all ${
                  selectedCapeId === "none"
                    ? "border-primary bg-primary/10"
                    : "border-dashed border-white/15 text-white/45 hover:border-white/30"
                }`}
              >
                <div className="flex h-12 w-24 items-center justify-center rounded-lg bg-white/5">
                  <span className="text-xs font-bold uppercase tracking-wider">—</span>
                </div>
                <span className="text-[10px] font-semibold uppercase tracking-wider">None</span>
              </button>
            </div>
          </Panel>

          <Panel className="space-y-3 text-sm">
            <h2 className="text-sm font-black uppercase tracking-[0.18em] text-white">
              {t("skin_studio.workflow_title")}
            </h2>
            {[
              { title: t("skin_studio.step_one"), desc: t("skin_studio.step_one_desc") },
              { title: t("skin_studio.step_two"), desc: t("skin_studio.step_two_desc") },
            ].map((step) => (
              <div
                key={step.title}
                className="rounded-xl border border-white/10 bg-[var(--surface-dashboard)] p-4"
              >
                <span className="text-[10px] font-bold uppercase tracking-[0.22em] text-primary">
                  {step.title}
                </span>
                <p className="mt-2 text-white/70">{step.desc}</p>
              </div>
            ))}
            <div className="rounded-xl border border-dashed border-primary/40 bg-primary/5 p-4">
              <span className="text-[10px] font-bold uppercase tracking-[0.22em] text-primary">
                {t("skin_studio.next_phase")}
              </span>
              <p className="mt-2 text-white/80">{t("skin_studio.next_phase_desc")}</p>
            </div>
          </Panel>
        </div>
      </div>
    </div>
  );
}

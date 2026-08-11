import { useEffect, useMemo, useRef, useState, type ChangeEvent } from "react";
import { FiImage, FiRefreshCw, FiUpload, FiX } from "react-icons/fi";
import { useTranslation } from "react-i18next";
import capeTexture from "@/assets/cape.png";
import { Modal } from "@/presentation/design-system";
import { MinecraftAvatar } from "@/presentation/components/minecraft/MinecraftAvatar";
import {
  MinecraftSkinFigure,
  type ViewerMode,
} from "@/presentation/components/minecraft/MinecraftSkinFigure";
import { SkinViewerControls } from "@/presentation/components/minecraft/SkinViewerControls";
import { useAppStore } from "@/application/store/useAppStore";
import { useNotificationStore } from "@/application/store/useNotificationStore";
import { PLAYER_AVATAR_TRANSITION_NAME } from "@/presentation/lib/viewTransition";
import type { CapeInfo } from "@/core/domain/electron-api";

const SKIN_DRAFT_STORAGE_KEY = "nebula_skin_draft";
const SKIN_DRAFT_NAME_STORAGE_KEY = "nebula_skin_draft_name";
const CORS_PROXY = "https://api.allorigins.win/raw?url=";

const panelChrome =
  "rounded-2xl border border-white/[0.08] bg-black/25";

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
};

type SkinStudioModalProps = {
  open: boolean;
  onClose: () => void;
};

export function SkinStudioModal({ open, onClose }: SkinStudioModalProps) {
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
  const [viewerMode, setViewerMode] = useState<ViewerMode>("idle");
  const [selectedCapeId, setSelectedCapeId] = useState<string>("launcher");
  const [accountCapes, setAccountCapes] = useState<CapeInfo[]>([]);

  const officialSkinUrl = normalizeSkinUrl(profile?.skinUrl);
  const activeSkinUrl = draftSkinUrl || officialSkinUrl;
  const usingDraftSkin = Boolean(draftSkinUrl);

  useEffect(() => {
    if (!open) return;
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
        /* ignore */
      }

      const single = await findCapeUrl(uuid);
      if (!cancelled && single) {
        setAccountCapes([{ id: single, url: single, alias: null, state: "ACTIVE" }]);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [open, profile?.uuid]);

  const capeEntries = useMemo((): CapeEntry[] => {
    const entries: CapeEntry[] = [
      { id: "launcher", textureUrl: capeTexture, label: "Launcher" },
    ];
    accountCapes.forEach((cape) => {
      entries.push({
        id: cape.id,
        textureUrl: cape.url,
        label: cape.alias ?? "Cape",
      });
    });
    return entries;
  }, [accountCapes]);

  const capeUrl = useMemo(() => {
    if (selectedCapeId === "none") return null;
    return capeEntries.find((e) => e.id === selectedCapeId)?.textureUrl ?? null;
  }, [selectedCapeId, capeEntries]);

  useEffect(() => {
    const stillExists = capeEntries.some((e) => e.id === selectedCapeId);
    if (!stillExists && selectedCapeId !== "none") setSelectedCapeId("launcher");
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
    <Modal
      open={open}
      onClose={onClose}
      hideClose
      className="max-h-[min(92vh,58rem)] max-w-6xl p-0"
    >
      <div className="relative flex max-h-[min(92vh,58rem)] flex-col overflow-hidden">
        <div className="relative shrink-0 border-b border-white/[0.07]">
          <div className="pointer-events-none absolute inset-0 overflow-hidden">
            <div
              className="absolute inset-0 opacity-80"
              style={{
                background:
                  "radial-gradient(ellipse 70% 120% at 0% 0%, var(--color-primary-shadow), transparent 55%)",
              }}
            />
          </div>

          <div className="relative flex items-start justify-between gap-4 px-5 py-4 sm:px-6">
            <div className="min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[var(--color-hero-eyebrow)]">
                {t("skin_studio.eyebrow")}
              </p>
              <h2 className="mt-1 text-xl font-black tracking-tight text-white sm:text-2xl">
                {t("skin_studio.title")}
              </h2>
            </div>

            <div className="flex shrink-0 items-center gap-3">
              <div className="hidden items-center gap-3 rounded-2xl border border-white/[0.08] bg-black/25 px-3 py-2 sm:flex">
                <MinecraftAvatar
                  username={profile?.username || "Player"}
                  uuid={usingDraftSkin ? undefined : profile?.uuid}
                  skinUrl={activeSkinUrl}
                  size={36}
                  transitionName={PLAYER_AVATAR_TRANSITION_NAME}
                />
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold text-white">
                    {profile?.username || t("topbar.player")}
                  </p>
                  <p className="mt-0.5 max-w-[12rem] truncate text-[10px] font-bold uppercase tracking-[0.14em] text-white/40">
                    {currentSourceLabel}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close"
                className="flex size-9 shrink-0 cursor-pointer items-center justify-center rounded-xl border border-white/10 bg-black/20 text-white/55 transition-colors hover:bg-white/10 hover:text-white"
              >
                <FiX className="text-lg" />
              </button>
            </div>
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5 sm:px-6">
          <div className="grid grid-cols-1 items-stretch gap-4 lg:grid-cols-12">
            <div className={`flex min-h-[28rem] flex-col lg:col-span-7 lg:min-h-[32rem] ${panelChrome} overflow-hidden`}>
              <div className="relative flex min-h-0 flex-1 flex-col bg-[radial-gradient(ellipse_at_center,rgba(255,255,255,0.07),transparent_60%)]">
                <div className="relative flex min-h-0 flex-1 items-center justify-center overflow-visible px-3 py-5">
                  <div className="pointer-events-none absolute inset-x-[18%] bottom-[16%] h-14 rounded-full bg-primary/20 blur-3xl" />
                  {open ? (
                    <MinecraftSkinFigure
                      textureUrl={activeSkinUrl}
                      capeUrl={capeUrl}
                      pixelSize={13}
                      className="relative z-10 drop-shadow-[0_24px_32px_var(--skin-shadow)]"
                      viewerMode={viewerMode}
                    />
                  ) : null}
                </div>
                <div className="flex shrink-0 flex-col items-center gap-2 border-t border-white/[0.06] bg-black/20 px-3 py-3.5">
                  <SkinViewerControls viewerMode={viewerMode} onChange={setViewerMode} />
                  <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-white/30">
                    {t("skin_studio.viewer_hint")}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-3 lg:col-span-5">
              <div className={`${panelChrome} space-y-3 p-4`}>
                <div className="flex items-center gap-2.5">
                  <FiUpload className="text-sm text-white/55" />
                  <h3 className="text-[11px] font-bold uppercase tracking-[0.16em] text-white/80">
                    {t("skin_studio.control_title")}
                  </h3>
                </div>
                <input
                  ref={inputRef}
                  type="file"
                  accept=".png,image/png"
                  className="hidden"
                  onChange={handleFileChange}
                />
                <div className="flex flex-col gap-2">
                  <button
                    type="button"
                    onClick={handleOpenPicker}
                    className="inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-full bg-white px-5 py-2.5 text-[11px] font-extrabold uppercase tracking-[0.12em] text-[var(--color-dark)] transition-colors hover:bg-white/90"
                  >
                    <FiUpload className="text-sm" />
                    {t("skin_studio.import")}
                  </button>
                  <button
                    type="button"
                    onClick={handleResetToOfficial}
                    disabled={!usingDraftSkin}
                    className="inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-full border border-white/15 bg-black/20 px-5 py-2.5 text-[11px] font-bold uppercase tracking-[0.12em] text-white/80 transition-colors hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <FiRefreshCw className="text-sm" />
                    {t("skin_studio.reset")}
                  </button>
                </div>
                <p className="text-xs leading-relaxed text-white/40">
                  {t("skin_studio.compatibility_desc")}
                </p>
              </div>

              <div className={`${panelChrome} p-4`}>
                <h3 className="mb-3 text-[11px] font-bold uppercase tracking-[0.16em] text-white/80">
                  {t("skin_studio.capes_title")}
                </h3>
                <div className="flex flex-wrap gap-2">
                  {capeEntries.map((cape) => {
                    const active = selectedCapeId === cape.id;
                    return (
                      <button
                        key={cape.id}
                        type="button"
                        onClick={() => setSelectedCapeId(cape.id)}
                        className={`flex cursor-pointer flex-col items-center gap-1.5 rounded-xl border p-2 transition-colors ${
                          active
                            ? "border-primary/50 bg-primary/10"
                            : "border-white/10 bg-black/20 opacity-70 hover:opacity-100"
                        }`}
                      >
                        {cape.textureUrl ? (
                          <img
                            src={cape.textureUrl}
                            alt=""
                            className="h-10 w-20 rounded-lg object-cover [image-rendering:pixelated]"
                          />
                        ) : null}
                        <span className="max-w-[5.5rem] truncate text-[9px] font-bold uppercase tracking-wider text-white/50">
                          {cape.label}
                        </span>
                      </button>
                    );
                  })}
                  <button
                    type="button"
                    onClick={() => setSelectedCapeId("none")}
                    className={`flex min-w-[5.5rem] cursor-pointer flex-col items-center justify-center gap-1.5 rounded-xl border p-2 transition-colors ${
                      selectedCapeId === "none"
                        ? "border-primary/50 bg-primary/10"
                        : "border-dashed border-white/15 text-white/40 hover:border-white/25"
                    }`}
                  >
                    <div className="flex h-10 w-20 items-center justify-center rounded-lg bg-white/5 text-xs font-bold">
                      —
                    </div>
                    <span className="text-[9px] font-bold uppercase tracking-wider">
                      {t("skin_studio.capes_none")}
                    </span>
                  </button>
                </div>
              </div>

              <div className={`${panelChrome} p-4`}>
                <div className="mb-3 flex items-center gap-2.5">
                  <FiImage className="text-sm text-white/55" />
                  <h3 className="text-[11px] font-bold uppercase tracking-[0.16em] text-white/80">
                    {t("skin_studio.texture_title")}
                  </h3>
                </div>
                <div className="overflow-hidden rounded-xl border border-white/[0.06] bg-black/30 p-3">
                  {activeSkinUrl ? (
                    <img
                      src={activeSkinUrl}
                      alt=""
                      aria-label={t("skin_studio.texture_alt")}
                      className="mx-auto max-h-[140px] w-full object-contain [image-rendering:pixelated]"
                    />
                  ) : (
                    <div className="flex min-h-[88px] items-center justify-center text-xs text-white/35">
                      {t("skin_studio.no_skin")}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
}

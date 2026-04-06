package com.mclaunch.home.screen;

import com.mojang.authlib.GameProfile;
import com.mojang.authlib.minecraft.MinecraftProfileTexture;
import net.minecraft.client.MinecraftClient;
import net.minecraft.client.util.DefaultSkinHelper;
import net.minecraft.util.Identifier;

import java.util.UUID;

/**
 * Small shared cache for the custom home screen.
 *
 * <p>The preview screen is recreated whenever it is reopened, and screen init
 * can also run again after a resize. Keeping these values outside the screen
 * lets us warm up the expensive pieces before the user actually opens the UI.
 */
public final class HomePreviewCache {
    private static final Object LOCK = new Object();

    private static volatile UUID cachedSessionUuid;
    private static volatile String cachedPlayerName = "Jugador";
    private static volatile Identifier cachedSkin;
    private static volatile boolean cachedSlimArms;
    private static volatile boolean skinModelResolved;
    private static volatile boolean skinRequestInFlight;
    private static volatile PlayerPreviewRenderer sharedRenderer;

    private HomePreviewCache() {
    }

    public static void warmup(MinecraftClient client) {
        if (client == null || client.getSession() == null) {
            return;
        }

        refreshSessionSnapshot(client);
        getRenderer(client).prewarmModels();
        requestSkinIfNeeded(client);
    }

    public static PlayerPreviewRenderer getRenderer(MinecraftClient client) {
        PlayerPreviewRenderer renderer = sharedRenderer;
        if (renderer != null) {
            return renderer;
        }

        synchronized (LOCK) {
            if (sharedRenderer == null) {
                sharedRenderer = new PlayerPreviewRenderer(client);
            }
            return sharedRenderer;
        }
    }

    public static String getPlayerName(MinecraftClient client) {
        refreshSessionSnapshot(client);
        return cachedPlayerName;
    }

    public static Identifier getSkinOrDefault(MinecraftClient client) {
        refreshSessionSnapshot(client);
        return cachedSkin != null ? cachedSkin : getDefaultSkin(client);
    }

    public static boolean usesSlimArms(MinecraftClient client) {
        refreshSessionSnapshot(client);
        if (skinModelResolved) {
            return cachedSlimArms;
        }

        UUID uuid = getSessionUuid(client);
        return uuid != null && "slim".equalsIgnoreCase(DefaultSkinHelper.getModel(uuid));
    }

    private static void refreshSessionSnapshot(MinecraftClient client) {
        if (client == null || client.getSession() == null) {
            return;
        }

        UUID currentUuid = getSessionUuid(client);
        cachedPlayerName = client.getSession().getUsername();

        if ((currentUuid == null && cachedSessionUuid == null)
                || (currentUuid != null && currentUuid.equals(cachedSessionUuid))) {
            return;
        }

        synchronized (LOCK) {
            if ((currentUuid == null && cachedSessionUuid == null)
                    || (currentUuid != null && currentUuid.equals(cachedSessionUuid))) {
                return;
            }

            cachedSessionUuid = currentUuid;
            cachedSkin = null;
            cachedSlimArms = false;
            skinModelResolved = false;
            skinRequestInFlight = false;
        }
    }

    private static void requestSkinIfNeeded(MinecraftClient client) {
        if (client == null || client.getSession() == null || cachedSkin != null || skinRequestInFlight) {
            return;
        }

        GameProfile profile = client.getSession().getProfile();
        if (profile == null) {
            return;
        }

        skinRequestInFlight = true;

        try {
            client.getSkinProvider().loadSkin(
                profile,
                (MinecraftProfileTexture.Type type, Identifier id, MinecraftProfileTexture texture) -> {
                    if (type != MinecraftProfileTexture.Type.SKIN) {
                        return;
                    }

                    cachedSkin = id;
                    cachedSlimArms = "slim".equalsIgnoreCase(texture.getMetadata("model"));
                    skinModelResolved = true;
                    skinRequestInFlight = false;
                },
                false
            );
        } catch (RuntimeException ignored) {
            skinRequestInFlight = false;
        }
    }

    private static Identifier getDefaultSkin(MinecraftClient client) {
        UUID uuid = getSessionUuid(client);
        return uuid != null ? DefaultSkinHelper.getTexture(uuid) : DefaultSkinHelper.getTexture();
    }

    private static UUID getSessionUuid(MinecraftClient client) {
        return client != null && client.getSession() != null
            ? client.getSession().getUuidOrNull()
            : null;
    }
}

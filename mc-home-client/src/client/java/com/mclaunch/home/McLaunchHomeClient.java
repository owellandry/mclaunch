package com.mclaunch.home;

import net.fabricmc.api.ClientModInitializer;
import net.minecraft.client.MinecraftClient;
import net.minecraft.client.util.Window;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public final class McLaunchHomeClient implements ClientModInitializer {
    public static final String MOD_ID = "mclaunch-home";
    public static final Logger LOGGER = LoggerFactory.getLogger(MOD_ID);
    private static boolean fullscreenChecked = false;

    @Override
    public void onInitializeClient() {
        LOGGER.info("MC Launch Home client bootstrap ready.");
    }

    public static void ensureFullscreenOnce(MinecraftClient client) {
        if (fullscreenChecked || client == null) {
            return;
        }

        Window window = client.getWindow();
        if (window == null) {
            return;
        }

        fullscreenChecked = true;
        if (window.isFullscreen()) {
            return;
        }

        try {
            LOGGER.info("Applying fullscreen fallback from title screen.");
            window.toggleFullscreen();
            client.options.getFullscreen().setValue(window.isFullscreen());
        } catch (RuntimeException error) {
            LOGGER.warn("Unable to apply fullscreen fallback cleanly.", error);
        }
    }
}

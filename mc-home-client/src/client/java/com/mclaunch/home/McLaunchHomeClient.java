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
        try {
            if (window.isFullscreen()) {
                LOGGER.info("Disabling fullscreen for MC Launch home preview bootstrap.");
                window.toggleFullscreen();
            }
            client.options.getFullscreen().setValue(false);
        } catch (RuntimeException error) {
            LOGGER.warn("Unable to sync fullscreen state cleanly.", error);
        }
    }
}

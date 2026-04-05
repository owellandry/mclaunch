package com.mclaunch.home;

import net.fabricmc.api.ClientModInitializer;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public final class McLaunchHomeClient implements ClientModInitializer {
    public static final String MOD_ID = "mclaunch-home";
    public static final Logger LOGGER = LoggerFactory.getLogger(MOD_ID);

    @Override
    public void onInitializeClient() {
        LOGGER.info("MC Launch Home client bootstrap ready.");
    }
}

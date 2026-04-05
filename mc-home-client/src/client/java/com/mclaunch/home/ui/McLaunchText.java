package com.mclaunch.home.ui;

import net.minecraft.client.MinecraftClient;
import net.minecraft.client.resource.language.I18n;
import net.minecraft.text.Text;

public final class McLaunchText {
    private McLaunchText() {
    }

    public static Text tr(String key, String english, String spanish) {
        if (I18n.hasTranslation(key)) {
            return Text.translatable(key);
        }

        return Text.literal(isSpanish() ? spanish : english);
    }

    public static boolean isSpanish() {
        MinecraftClient client = MinecraftClient.getInstance();
        if (client == null || client.options == null || client.options.language == null) {
            return false;
        }

        return client.options.language.startsWith("es");
    }
}

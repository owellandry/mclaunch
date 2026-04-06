package com.mclaunch.home.mixin.client;

import com.mclaunch.home.McLaunchHomeClient;
import com.mclaunch.home.screen.McLaunchHomePreviewScreen;
import com.mclaunch.home.ui.McLaunchText;
import net.minecraft.client.gui.DrawContext;
import net.minecraft.client.gui.screen.Screen;
import net.minecraft.client.gui.screen.TitleScreen;
import net.minecraft.client.gui.widget.ButtonWidget;
import net.minecraft.text.Text;
import org.spongepowered.asm.mixin.Mixin;
import org.spongepowered.asm.mixin.injection.At;
import org.spongepowered.asm.mixin.injection.Inject;
import org.spongepowered.asm.mixin.injection.callback.CallbackInfo;

@Mixin(TitleScreen.class)
public abstract class TitleScreenMixin extends Screen {
    protected TitleScreenMixin(Text title) {
        super(title);
    }

    @Inject(method = "init", at = @At("TAIL"))
    private void mclaunch$addPreviewButton(CallbackInfo ci) {
        McLaunchHomeClient.ensureFullscreenOnce(this.client);

        int buttonWidth = 132;
        int buttonHeight = 20;
        int buttonX = this.width - buttonWidth - 16;
        int buttonY = 18;

        this.addDrawableChild(
            ButtonWidget.builder(
                    McLaunchText.tr(
                        "button.mclaunch_home.open_preview",
                        "MC Launch UI",
                        "MC Launch UI"
                    ),
                    button -> {
                        if (this.client != null) {
                            this.client.setScreen(new McLaunchHomePreviewScreen(this));
                        }
                    }
                )
                .dimensions(buttonX, buttonY, buttonWidth, buttonHeight)
                .build()
        );
    }

    @Inject(method = "render", at = @At("TAIL"))
    private void mclaunch$renderRibbon(DrawContext context, int mouseX, int mouseY, float delta, CallbackInfo ci) {
        Text ribbon = McLaunchText.tr(
            "overlay.mclaunch_home.ribbon",
            "MC Launch Preview",
            "Vista previa MC Launch"
        );
        int ribbonX = 14;
        int ribbonY = 16;
        int ribbonWidth = this.textRenderer.getWidth(ribbon) + 20;
        int ribbonHeight = 18;

        context.fill(ribbonX, ribbonY, ribbonX + ribbonWidth, ribbonY + ribbonHeight, 0xA0121916);
        context.drawBorder(ribbonX, ribbonY, ribbonWidth, ribbonHeight, 0xFF365E3A);
        context.drawTextWithShadow(
            this.textRenderer,
            ribbon,
            ribbonX + 8,
            ribbonY + 5,
            0xFFF3D35B
        );
    }
}

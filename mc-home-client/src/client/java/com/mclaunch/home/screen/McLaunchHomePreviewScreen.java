package com.mclaunch.home.screen;

import com.mclaunch.home.ui.McLaunchText;
import com.mojang.blaze3d.systems.RenderSystem;
import net.minecraft.client.gui.DrawContext;
import net.minecraft.client.gui.screen.Screen;
import net.minecraft.client.gui.screen.multiplayer.MultiplayerScreen;
import net.minecraft.client.gui.screen.option.OptionsScreen;
import net.minecraft.client.gui.screen.world.SelectWorldScreen;
import net.minecraft.text.Text;
import net.minecraft.util.Identifier;

public final class McLaunchHomePreviewScreen extends Screen {
    private static final int BG_TOP = 0xFF05080D;
    private static final int BG_BOTTOM = 0xFF0A0F17;
    private static final int PANEL_BG = 0xF20A0F17;
    private static final int PRIMARY = 0xFF4ADE80;
    private static final int PRIMARY_DIM = 0x334ADE80;
    private static final int TEXT_MAIN = 0xFFFFFFFF;
    private static final int TEXT_MUTED = 0xFFA1A1AA;
    private static final int SKIN_TEX_SIZE = 64;

    private static final Text SINGLEPLAYER_TEXT = Text.translatable("menu.singleplayer");
    private static final Text MULTIPLAYER_TEXT = Text.translatable("menu.multiplayer");
    private static final Text OPTIONS_TEXT = Text.translatable("menu.options");
    private static final Text QUIT_TEXT = Text.translatable("menu.quit");

    private final Screen parent;

    private PlayerPreviewRenderer playerPreviewRenderer;
    private LayoutMetrics layout = LayoutMetrics.empty();
    private String playerName = "Jugador";

    public McLaunchHomePreviewScreen(Screen parent) {
        super(McLaunchText.tr("screen.mclaunch_home.preview.title", "MC Launch Home", "Inicio MC Launch"));
        this.parent = parent;
    }

    @Override
    public void onDisplayed() {
        super.onDisplayed();
        if (this.client != null) {
            HomePreviewCache.warmup(this.client);
        }
    }

    @Override
    protected void init() {
        if (this.client == null) {
            return;
        }

        this.playerPreviewRenderer = HomePreviewCache.getRenderer(this.client);
        this.playerName = HomePreviewCache.getPlayerName(this.client);
        this.layout = LayoutMetrics.compute(this.width, this.height);

        this.clearChildren();

        this.addDrawableChild(new ModernButtonWidget(
            this.layout.buttonX,
            this.layout.buttonStartY,
            this.layout.buttonWidth,
            this.layout.buttonHeight,
            SINGLEPLAYER_TEXT,
            button -> this.client.setScreen(new SelectWorldScreen(this))
        ));

        this.addDrawableChild(new ModernButtonWidget(
            this.layout.buttonX,
            this.layout.buttonStartY + (this.layout.buttonHeight + this.layout.buttonGap),
            this.layout.buttonWidth,
            this.layout.buttonHeight,
            MULTIPLAYER_TEXT,
            button -> this.client.setScreen(new MultiplayerScreen(this))
        ));

        this.addDrawableChild(new ModernButtonWidget(
            this.layout.buttonX,
            this.layout.buttonStartY + (this.layout.buttonHeight + this.layout.buttonGap) * 2,
            this.layout.buttonWidth,
            this.layout.buttonHeight,
            OPTIONS_TEXT,
            button -> this.client.setScreen(new OptionsScreen(this, this.client.options))
        ));

        this.addDrawableChild(new ModernButtonWidget(
            this.layout.buttonX,
            this.layout.buttonStartY + (this.layout.buttonHeight + this.layout.buttonGap) * 3,
            this.layout.buttonWidth,
            this.layout.buttonHeight,
            QUIT_TEXT,
            button -> this.client.scheduleStop()
        ));

        this.addDrawableChild(new ModernButtonWidget(
            this.layout.buttonX,
            this.layout.bottomButtonY,
            this.layout.buttonWidth,
            20,
            McLaunchText.tr("screen.mclaunch_home.preview.back", "<- Vanilla Menu", "<- Menu Clasico"),
            button -> this.close()
        ));
    }

    @Override
    public void render(DrawContext ctx, int mouseX, int mouseY, float delta) {
        ctx.fillGradient(0, 0, this.width, this.height, BG_TOP, BG_BOTTOM);
        renderBackgroundDecorations(ctx);
        renderSkinPreview(ctx, mouseX, mouseY);

        ctx.fill(0, 0, this.layout.panelWidth, this.height, PANEL_BG);
        ctx.fillGradient(this.layout.panelWidth, 0, this.layout.panelWidth + 1, this.height, 0x884ADE80, 0x004ADE80);

        ctx.getMatrices().push();
        ctx.getMatrices().translate(this.layout.titleX, this.layout.titleY, 0);
        ctx.getMatrices().scale(this.layout.titleScale, this.layout.titleScale, 1.0f);
        ctx.drawTextWithShadow(this.textRenderer, "MINECRAFT", 0, 0, TEXT_MAIN);
        ctx.getMatrices().pop();

        ctx.fill(this.layout.titleX, this.layout.badgeY, this.layout.titleX + 104, this.layout.badgeY + 14, PRIMARY);
        ctx.drawTextWithShadow(this.textRenderer, "MCLAUNCH EDITION", this.layout.titleX + 6, this.layout.badgeY + 3, 0xFF000000);

        ctx.drawTextWithShadow(this.textRenderer, "Bienvenido de vuelta,", this.layout.titleX, this.layout.welcomeY, TEXT_MUTED);
        ctx.drawTextWithShadow(this.textRenderer, this.playerName, this.layout.titleX, this.layout.welcomeY + 12, TEXT_MAIN);
        ctx.drawTextWithShadow(this.textRenderer, "MC Launch UI v1.1", this.layout.footerX, this.layout.footerY, 0x55FFFFFF);

        super.render(ctx, mouseX, mouseY, delta);
    }

    private void renderBackgroundDecorations(DrawContext ctx) {
        if (this.layout.rightSpace < 100) {
            return;
        }

        ctx.fill(this.layout.centerX - 80, this.layout.centerY - 80, this.layout.centerX + 80, this.layout.centerY - 79, 0x11FFFFFF);
        ctx.fill(this.layout.centerX - 80, this.layout.centerY + 80, this.layout.centerX + 80, this.layout.centerY + 81, 0x11FFFFFF);
        ctx.fill(this.layout.centerX - 80, this.layout.centerY - 80, this.layout.centerX - 79, this.layout.centerY + 80, 0x11FFFFFF);
        ctx.fill(this.layout.centerX + 79, this.layout.centerY - 80, this.layout.centerX + 80, this.layout.centerY + 80, 0x11FFFFFF);

        ctx.fill(this.layout.centerX - 81, this.layout.centerY - 81, this.layout.centerX - 78, this.layout.centerY - 78, PRIMARY_DIM);
        ctx.fill(this.layout.centerX + 78, this.layout.centerY - 81, this.layout.centerX + 81, this.layout.centerY - 78, PRIMARY_DIM);
        ctx.fill(this.layout.centerX - 81, this.layout.centerY + 78, this.layout.centerX - 78, this.layout.centerY + 81, PRIMARY_DIM);
        ctx.fill(this.layout.centerX + 78, this.layout.centerY + 78, this.layout.centerX + 81, this.layout.centerY + 81, PRIMARY_DIM);

        ctx.getMatrices().push();
        ctx.getMatrices().translate(this.layout.centerX, this.layout.centerY, 0);
        ctx.getMatrices().scale(5.0f, 5.0f, 1.0f);
        ctx.drawTextWithShadow(this.textRenderer, "MC", -this.layout.bgTextWidth / 2, -4, 0x08FFFFFF);
        ctx.getMatrices().pop();
    }

    private void renderSkinPreview(DrawContext ctx, int mouseX, int mouseY) {
        if (this.client == null || this.layout.rightSpace < 150) {
            return;
        }

        Identifier skin = HomePreviewCache.getSkinOrDefault(this.client);
        boolean slimArms = HomePreviewCache.usesSlimArms(this.client);

        if (this.playerPreviewRenderer != null
                && this.playerPreviewRenderer.render(
                    ctx,
                    this.layout.previewX,
                    this.layout.previewY,
                    this.layout.previewWidth,
                    this.layout.previewHeight,
                    skin,
                    slimArms,
                    this.client.getTickDelta(),
                    mouseX,
                    mouseY
                )) {
            return;
        }

        renderFallbackSkin(ctx, skin, slimArms);
    }

    private void renderFallbackSkin(DrawContext ctx, Identifier skin, boolean slimArms) {
        int armWidth = slimArms ? 3 : 4;
        int spriteWidthUnits = 8 + armWidth * 2;
        int spriteHeightUnits = 32;

        int maxHeight = Math.max(220, Math.min(this.layout.previewHeight - 40, (int) (this.layout.previewHeight * 0.88f)));
        int scale = Math.max(3, maxHeight / spriteHeightUnits);
        int totalWidth = spriteWidthUnits * scale;
        int totalHeight = spriteHeightUnits * scale;

        int startX = this.layout.centerX - totalWidth / 2;
        int startY = Math.max(4, this.layout.centerY - totalHeight / 2 - 146);

        int headX = startX + armWidth * scale;
        int headY = startY;
        int bodyX = headX;
        int bodyY = headY + 8 * scale;
        int rightArmX = startX;
        int leftArmX = bodyX + 8 * scale;
        int rightLegX = headX;
        int leftLegX = headX + 4 * scale;
        int legsY = bodyY + 12 * scale;

        drawSkinRegion(ctx, skin, headX, headY, 8, 8, 8, 8, scale);
        drawSkinRegion(ctx, skin, bodyX, bodyY, 8, 12, 20, 20, scale);
        drawSkinRegion(ctx, skin, rightArmX, bodyY, armWidth, 12, 44, 20, scale);
        drawSkinRegion(ctx, skin, leftArmX, bodyY, armWidth, 12, 36, 52, scale);
        drawSkinRegion(ctx, skin, rightLegX, legsY, 4, 12, 4, 20, scale);
        drawSkinRegion(ctx, skin, leftLegX, legsY, 4, 12, 20, 52, scale);

        RenderSystem.enableBlend();
        drawSkinRegion(ctx, skin, headX, headY, 8, 8, 40, 8, scale);
        drawSkinRegion(ctx, skin, bodyX, bodyY, 8, 12, 20, 36, scale);
        drawSkinRegion(ctx, skin, rightArmX, bodyY, armWidth, 12, 44, 36, scale);
        drawSkinRegion(ctx, skin, leftArmX, bodyY, armWidth, 12, 52, 52, scale);
        drawSkinRegion(ctx, skin, rightLegX, legsY, 4, 12, 4, 36, scale);
        drawSkinRegion(ctx, skin, leftLegX, legsY, 4, 12, 4, 52, scale);
        RenderSystem.disableBlend();
    }

    private void drawSkinRegion(
        DrawContext ctx,
        Identifier skin,
        int x,
        int y,
        int regionWidth,
        int regionHeight,
        int u,
        int v,
        int scale
    ) {
        ctx.drawTexture(
            skin,
            x,
            y,
            regionWidth * scale,
            regionHeight * scale,
            (float) u,
            (float) v,
            regionWidth,
            regionHeight,
            SKIN_TEX_SIZE,
            SKIN_TEX_SIZE
        );
    }

    @Override
    public void close() {
        if (this.client != null) {
            this.client.setScreen(this.parent);
        }
    }

    private record LayoutMetrics(
        int panelWidth,
        int rightSpace,
        int centerX,
        int centerY,
        int buttonX,
        int buttonWidth,
        int buttonHeight,
        int buttonGap,
        int buttonStartY,
        int bottomButtonY,
        int previewX,
        int previewY,
        int previewWidth,
        int previewHeight,
        int titleX,
        int titleY,
        float titleScale,
        int badgeY,
        int welcomeY,
        int footerX,
        int footerY,
        int bgTextWidth
    ) {
        static LayoutMetrics empty() {
            return compute(0, 0);
        }

        static LayoutMetrics compute(int width, int height) {
            int panelWidth = width < 500 ? width / 2 + 50 : 320;
            int rightSpace = width - panelWidth;
            int centerX = panelWidth + rightSpace / 2;
            int centerY = height / 2;
            int buttonHeight = height < 360 ? 26 : 32;
            int buttonGap = height < 360 ? 4 : 8;
            int buttonStartY = height < 360 ? 120 : 160;
            int titleX = 30;
            int titleY = height < 360 ? 20 : 40;
            float titleScale = height < 360 ? 1.8f : 2.5f;
            int badgeY = titleY + (int) (12 * titleScale) + 4;
            int welcomeY = height < 360 ? badgeY + 18 : badgeY + 24;

            return new LayoutMetrics(
                panelWidth,
                rightSpace,
                centerX,
                centerY,
                30,
                panelWidth - 60,
                buttonHeight,
                buttonGap,
                buttonStartY,
                height < 360 ? height - 24 : height - 30,
                panelWidth + 5,
                10,
                Math.max(0, rightSpace - 10),
                Math.max(0, height - 20),
                titleX,
                titleY,
                titleScale,
                badgeY,
                welcomeY,
                panelWidth + 20,
                height - 20,
                2 * 6
            );
        }
    }
}

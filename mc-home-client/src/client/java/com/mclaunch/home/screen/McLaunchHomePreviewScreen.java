package com.mclaunch.home.screen;

import com.mclaunch.home.ui.McLaunchText;
import com.mojang.authlib.minecraft.MinecraftProfileTexture;
import com.mojang.blaze3d.systems.RenderSystem;
import net.minecraft.client.MinecraftClient;
import net.minecraft.client.gui.DrawContext;
import net.minecraft.client.gui.screen.Screen;
import net.minecraft.client.gui.screen.multiplayer.MultiplayerScreen;
import net.minecraft.client.gui.screen.option.OptionsScreen;
import net.minecraft.client.gui.screen.world.SelectWorldScreen;
import net.minecraft.client.gui.widget.ButtonWidget;
import net.minecraft.client.util.DefaultSkinHelper;
import net.minecraft.text.Text;
import net.minecraft.util.Identifier;

import java.util.UUID;

public final class McLaunchHomePreviewScreen extends Screen {

    private static final int BG_TOP = 0xFF05080D;
    private static final int BG_BOTTOM = 0xFF0A0F17;

    private static final int PANEL_BG = 0xF20A0F17;
    private static final int PRIMARY = 0xFF4ADE80;
    private static final int PRIMARY_DIM = 0x334ADE80;

    private static final int TEXT_MAIN = 0xFFFFFFFF;
    private static final int TEXT_MUTED = 0xFFA1A1AA;

    private static final int SKIN_TEX_SIZE = 64;

    private final Screen parent;
    private boolean guiScaleForced = false;
    private volatile Identifier cachedSkin = null;
    private volatile boolean cachedSlimArms = false;
    private volatile boolean skinModelResolved = false;
    private PlayerPreviewRenderer playerPreviewRenderer;

    public McLaunchHomePreviewScreen(Screen parent) {
        super(McLaunchText.tr("screen.mclaunch_home.preview.title", "MC Launch Home", "Inicio MC Launch"));
        this.parent = parent;
    }

    @Override
    protected void init() {
        if (!guiScaleForced && this.client != null) {
            int currentScale = this.client.options.getGuiScale().getValue();
            if (currentScale != 2) {
                this.client.options.getGuiScale().setValue(2);
                this.client.onResolutionChanged();
                guiScaleForced = true;
                return;
            }
        }

        if (this.client != null && this.playerPreviewRenderer == null) {
            this.playerPreviewRenderer = new PlayerPreviewRenderer(this.client);
        }

        int panelW = 320;
        if (this.width < 500) {
            panelW = this.width / 2 + 50;
        }

        int btnW = panelW - 60;
        int btnH = 32;
        int gap = 8;
        int startX = 30;
        int startY = 160;

        if (this.height < 360) {
            startY = 120;
            btnH = 26;
            gap = 4;
        }

        this.addDrawableChild(new ModernButtonWidget(
                startX,
                startY,
                btnW,
                btnH,
                Text.translatable("menu.singleplayer"),
                btn -> {
                    if (this.client != null) {
                        this.client.setScreen(new SelectWorldScreen(this));
                    }
                }
        ));

        this.addDrawableChild(new ModernButtonWidget(
                startX,
                startY + (btnH + gap),
                btnW,
                btnH,
                Text.translatable("menu.multiplayer"),
                btn -> {
                    if (this.client != null) {
                        this.client.setScreen(new MultiplayerScreen(this));
                    }
                }
        ));

        this.addDrawableChild(new ModernButtonWidget(
                startX,
                startY + (btnH + gap) * 2,
                btnW,
                btnH,
                Text.translatable("menu.options"),
                btn -> {
                    if (this.client != null) {
                        this.client.setScreen(new OptionsScreen(this, this.client.options));
                    }
                }
        ));

        this.addDrawableChild(new ModernButtonWidget(
                startX,
                startY + (btnH + gap) * 3,
                btnW,
                btnH,
                Text.translatable("menu.quit"),
                btn -> {
                    if (this.client != null) {
                        this.client.scheduleStop();
                    }
                }
        ));

        int bottomY = this.height - 30;
        if (this.height < 360) {
            bottomY = this.height - 24;
        }

        this.addDrawableChild(new ModernButtonWidget(
                startX,
                bottomY,
                btnW,
                20,
                McLaunchText.tr("screen.mclaunch_home.preview.back", "← Vanilla Menu", "← Menú Clásico"),
                btn -> this.close()
        ));

        loadSkinAsync();
    }

    private void loadSkinAsync() {
        if (this.client == null || cachedSkin != null) {
            return;
        }

        try {
            com.mojang.authlib.GameProfile profile = this.client.getSession().getProfile();
            if (profile != null) {
                this.client.getSkinProvider().loadSkin(
                        profile,
                        (MinecraftProfileTexture.Type type, Identifier id, MinecraftProfileTexture texture) -> {
                            if (type == MinecraftProfileTexture.Type.SKIN) {
                                cachedSkin = id;
                                cachedSlimArms = "slim".equalsIgnoreCase(texture.getMetadata("model"));
                                skinModelResolved = true;
                            }
                        },
                        false
                );
            }
        } catch (Exception ignored) {
            // Fallback to the default skin.
        }
    }

    private Identifier getDefaultSkin() {
        UUID uuid = (this.client != null && this.client.getSession() != null)
                ? this.client.getSession().getUuidOrNull()
                : null;
        return uuid != null ? DefaultSkinHelper.getTexture(uuid) : DefaultSkinHelper.getTexture();
    }

    private boolean usesSlimArms() {
        if (skinModelResolved) {
            return cachedSlimArms;
        }

        UUID uuid = (this.client != null && this.client.getSession() != null)
                ? this.client.getSession().getUuidOrNull()
                : null;
        return uuid != null && "slim".equalsIgnoreCase(DefaultSkinHelper.getModel(uuid));
    }

    @Override
    public void render(DrawContext ctx, int mouseX, int mouseY, float delta) {
        ctx.fillGradient(0, 0, this.width, this.height, BG_TOP, BG_BOTTOM);
        renderBackgroundDecorations(ctx);
        renderSkinPreview(ctx, mouseX, mouseY);

        int panelW = 320;
        if (this.width < 500) {
            panelW = this.width / 2 + 50;
        }

        ctx.fill(0, 0, panelW, this.height, PANEL_BG);
        ctx.fillGradient(panelW, 0, panelW + 1, this.height, 0x884ADE80, 0x004ADE80);

        int titleX = 30;
        int titleY = this.height < 360 ? 20 : 40;

        ctx.getMatrices().push();
        ctx.getMatrices().translate(titleX, titleY, 0);
        float titleScale = this.height < 360 ? 1.8f : 2.5f;
        ctx.getMatrices().scale(titleScale, titleScale, 1.0f);
        ctx.drawTextWithShadow(this.textRenderer, "MINECRAFT", 0, 0, TEXT_MAIN);
        ctx.getMatrices().pop();

        int badgeY = titleY + (int) (12 * titleScale) + 4;
        ctx.fill(titleX, badgeY, titleX + 104, badgeY + 14, PRIMARY);
        ctx.drawTextWithShadow(this.textRenderer, "MCLAUNCH EDITION", titleX + 6, badgeY + 3, 0xFF000000);

        String playerName = "Jugador";
        if (this.client != null && this.client.getSession() != null) {
            playerName = this.client.getSession().getUsername();
        }

        int textY = this.height < 360 ? badgeY + 18 : badgeY + 24;
        ctx.drawTextWithShadow(this.textRenderer, "Bienvenido de vuelta,", titleX, textY, TEXT_MUTED);
        ctx.drawTextWithShadow(this.textRenderer, playerName, titleX, textY + 12, TEXT_MAIN);

        ctx.drawTextWithShadow(this.textRenderer, "MC Launch UI v1.1", panelW + 20, this.height - 20, 0x55FFFFFF);

        super.render(ctx, mouseX, mouseY, delta);
    }

    private void renderBackgroundDecorations(DrawContext ctx) {
        int panelW = 320;
        if (this.width < 500) {
            panelW = this.width / 2 + 50;
        }

        int rightSpace = this.width - panelW;
        if (rightSpace < 100) {
            return;
        }

        int centerX = panelW + rightSpace / 2;
        int centerY = this.height / 2;

        ctx.fill(centerX - 80, centerY - 80, centerX + 80, centerY - 79, 0x11FFFFFF);
        ctx.fill(centerX - 80, centerY + 80, centerX + 80, centerY + 81, 0x11FFFFFF);
        ctx.fill(centerX - 80, centerY - 80, centerX - 79, centerY + 80, 0x11FFFFFF);
        ctx.fill(centerX + 79, centerY - 80, centerX + 80, centerY + 80, 0x11FFFFFF);

        ctx.fill(centerX - 81, centerY - 81, centerX - 78, centerY - 78, PRIMARY_DIM);
        ctx.fill(centerX + 78, centerY - 81, centerX + 81, centerY - 78, PRIMARY_DIM);
        ctx.fill(centerX - 81, centerY + 78, centerX - 78, centerY + 81, PRIMARY_DIM);
        ctx.fill(centerX + 78, centerY + 78, centerX + 81, centerY + 81, PRIMARY_DIM);

        ctx.getMatrices().push();
        ctx.getMatrices().translate(centerX, centerY, 0);
        ctx.getMatrices().scale(5.0f, 5.0f, 1.0f);
        int bgTextW = this.textRenderer.getWidth("MC");
        ctx.drawTextWithShadow(this.textRenderer, "MC", -bgTextW / 2, -4, 0x08FFFFFF);
        ctx.getMatrices().pop();
    }

    private void renderSkinPreview(DrawContext ctx, int mouseX, int mouseY) {
        if (this.client == null) {
            return;
        }

        int panelW = 320;
        if (this.width < 500) {
            panelW = this.width / 2 + 50;
        }

        int rightSpace = this.width - panelW;
        if (rightSpace < 150) {
            return;
        }

        Identifier skin = cachedSkin != null ? cachedSkin : getDefaultSkin();
        boolean slimArms = usesSlimArms();
        int previewWidth = rightSpace - 10;
        int previewHeight = this.height - 20;
        int previewX = panelW + 5;
        int previewY = 10;

        if (this.playerPreviewRenderer != null
                && this.playerPreviewRenderer.render(ctx, previewX, previewY, previewWidth, previewHeight, skin, slimArms, this.client.getTickDelta(), mouseX, mouseY)) {
            return;
        }

        int armWidth = slimArms ? 3 : 4;
        int spriteWidthUnits = 8 + armWidth * 2;
        int spriteHeightUnits = 32;

        int maxHeight = Math.max(220, Math.min(previewHeight - 40, (int) (previewHeight * 0.88f)));
        int scale = Math.max(3, maxHeight / spriteHeightUnits);
        int totalWidth = spriteWidthUnits * scale;
        int totalHeight = spriteHeightUnits * scale;

        int centerX = panelW + rightSpace / 2;
        int startX = centerX - totalWidth / 2;
        int startY = Math.max(4, this.height / 2 - totalHeight / 2 - 146);

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

    private static class ModernButtonWidget extends ButtonWidget {
        public ModernButtonWidget(int x, int y, int width, int height, Text message, PressAction onPress) {
            super(x, y, width, height, message, onPress, DEFAULT_NARRATION_SUPPLIER);
        }

        @Override
        public void renderButton(DrawContext context, int mouseX, int mouseY, float delta) {
            MinecraftClient client = MinecraftClient.getInstance();

            int bg = this.isHovered() ? 0xFF2A3644 : 0xFF1C252E;
            int border = this.isHovered() ? PRIMARY : 0xFF2A3644;
            int textCol = this.isHovered() ? PRIMARY : 0xFFFFFFFF;

            if (!this.active) {
                bg = 0xFF111111;
                border = 0xFF222222;
                textCol = 0xFFAAAAAA;
            }

            context.fill(this.getX(), this.getY(), this.getX() + this.width, this.getY() + this.height, bg);
            context.drawBorder(this.getX(), this.getY(), this.width, this.height, border);

            if (this.isHovered() && this.active) {
                context.fill(this.getX(), this.getY(), this.getX() + 2, this.getY() + this.height, PRIMARY);
            }

            int msgW = client.textRenderer.getWidth(this.getMessage());
            int textX = this.getX() + (this.width - msgW) / 2;
            int textY = this.getY() + (this.height - 8) / 2;
            context.drawTextWithShadow(client.textRenderer, this.getMessage(), textX, textY, textCol);
        }
    }
}

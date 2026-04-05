package com.mclaunch.home.screen;

import com.mclaunch.home.ui.McLaunchText;
import com.mojang.blaze3d.systems.RenderSystem;
import net.minecraft.client.MinecraftClient;
import net.minecraft.client.gui.DrawContext;
import net.minecraft.client.gui.screen.Screen;
import net.minecraft.client.gui.screen.multiplayer.MultiplayerScreen;
import net.minecraft.client.gui.screen.option.OptionsScreen;
import net.minecraft.client.gui.screen.world.SelectWorldScreen;
import net.minecraft.client.gui.widget.ButtonWidget;
import net.minecraft.client.model.ModelPart;
import net.minecraft.client.render.OverlayTexture;
import net.minecraft.client.render.RenderLayer;
import net.minecraft.client.render.VertexConsumer;
import net.minecraft.client.render.VertexConsumerProvider;
import net.minecraft.client.render.entity.model.EntityModelLayers;
import net.minecraft.client.render.entity.model.PlayerEntityModel;
import net.minecraft.client.texture.PlayerSkin;
import net.minecraft.client.util.DefaultSkinHelper;
import net.minecraft.client.util.math.MatrixStack;
import net.minecraft.text.Text;
import net.minecraft.util.Identifier;
import org.joml.Quaternionf;

import java.util.UUID;

public final class McLaunchHomePreviewScreen extends Screen {

    // ====================== PALETA ======================
    private static final int BG_TOP        = 0xFF05080D;
    private static final int BG_BOTTOM     = 0xFF0A0F17;
    
    private static final int PANEL_BG      = 0xF20A0F17; // Casi opaco
    private static final int PRIMARY       = 0xFF4ADE80; // Verde brillante
    private static final int PRIMARY_DIM   = 0x334ADE80; // Verde con transparencia
    
    private static final int TEXT_MAIN     = 0xFFFFFFFF;
    private static final int TEXT_MUTED    = 0xFFA1A1AA;

    private final Screen parent;
    private boolean guiScaleForced = false;
    private PlayerEntityModel<?> playerModel;
    private volatile Identifier cachedSkin = null;

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
                return; // Se re-inicializará automáticamente
            }
        }
        int panelW = 320;
        if (this.width < 500) {
            panelW = this.width / 2 + 50; // Ajustar en pantallas pequeñas
        }

        int btnW = panelW - 60; // Margen lateral de 30px
        int btnH = 32;
        int gap = 8;
        
        int startX = 30;
        
        // Calcular Y inicial para que no se solape
        // Título ocupa hasta ~Y=130, por lo que empezamos en 160
        int startY = 160;
        if (this.height < 360) {
            startY = 120; // Si la pantalla es muy bajita, subimos los botones
            btnH = 26;
            gap = 4;
        }

        // Botón: Un Jugador
        this.addDrawableChild(new ModernButtonWidget(startX, startY, btnW, btnH,
                Text.translatable("menu.singleplayer"),
                btn -> {
                    if (this.client != null) {
                        this.client.setScreen(new SelectWorldScreen(this));
                    }
                }));

        // Botón: Multijugador
        this.addDrawableChild(new ModernButtonWidget(startX, startY + (btnH + gap), btnW, btnH,
                Text.translatable("menu.multiplayer"),
                btn -> {
                    if (this.client != null) {
                        this.client.setScreen(new MultiplayerScreen(this));
                    }
                }));

        // Botón: Ajustes
        this.addDrawableChild(new ModernButtonWidget(startX, startY + (btnH + gap) * 2, btnW, btnH,
                Text.translatable("menu.options"),
                btn -> {
                    if (this.client != null) {
                        this.client.setScreen(new OptionsScreen(this, this.client.options));
                    }
                }));

        // Botón: Salir
        this.addDrawableChild(new ModernButtonWidget(startX, startY + (btnH + gap) * 3, btnW, btnH,
                Text.translatable("menu.quit"),
                btn -> {
                    if (this.client != null) {
                        this.client.scheduleStop();
                    }
                }));

        // Botón: Volver al menú clásico (Vanilla)
        int bottomY = this.height - 30;
        if (this.height < 360) bottomY = this.height - 24;
        this.addDrawableChild(new ModernButtonWidget(startX, bottomY, btnW, 20,
                McLaunchText.tr("screen.mclaunch_home.preview.back", "← Vanilla Menu", "← Menú Clásico"),
                btn -> this.close()));

        // Cargar skin del jugador de forma asíncrona
        loadSkinAsync();
    }

    private void loadSkinAsync() {
        if (this.client == null || cachedSkin != null) return;
        try {
            com.mojang.authlib.GameProfile profile = this.client.getSession().getProfile();
            if (profile != null) {
                this.client.getSkinProvider().fetchSkinTextures(profile)
                        .thenAccept((PlayerSkin playerSkin) -> {
                            if (playerSkin != null) cachedSkin = playerSkin.texture();
                        });
            }
        } catch (Exception ignored) {
            // fetchSkinTextures no disponible; se usará skin por defecto
        }
    }

    private Identifier getDefaultSkin() {
        UUID uuid = (this.client != null && this.client.getSession() != null)
                ? this.client.getSession().getUuidOrNull()
                : null;
        return uuid != null ? DefaultSkinHelper.getTexture(uuid) : DefaultSkinHelper.getTexture();
    }

    @Override
    public void render(DrawContext ctx, int mouseX, int mouseY, float delta) {
        // 1. Fondo de toda la pantalla (Gradiente profundo)
        ctx.fillGradient(0, 0, this.width, this.height, BG_TOP, BG_BOTTOM);

        // Decoración de fondo en el espacio vacío
        renderBackgroundDecorations(ctx);

        // Renderizar el jugador 3D
        render3DPlayer(ctx, mouseX, mouseY);

        // 2. Panel Izquierdo (Sidebar)
        int panelW = 320;
        if (this.width < 500) {
            panelW = this.width / 2 + 50;
        }
        
        ctx.fill(0, 0, panelW, this.height, PANEL_BG);
        // Línea lateral derecha del panel
        ctx.fillGradient(panelW, 0, panelW + 1, this.height, 0x884ADE80, 0x004ADE80);

        // 3. Título principal
        int titleX = 30;
        int titleY = 40;
        if (this.height < 360) titleY = 20;
        
        ctx.getMatrices().push();
        ctx.getMatrices().translate(titleX, titleY, 0);
        float scale = this.height < 360 ? 1.8f : 2.5f;
        ctx.getMatrices().scale(scale, scale, 1f);
        ctx.drawTextWithShadow(this.textRenderer, "MINECRAFT", 0, 0, TEXT_MAIN);
        ctx.getMatrices().pop();

        // 4. Etiqueta / Badge "MCLAUNCH EDITION"
        int badgeY = titleY + (int)(12 * scale) + 4;
        int badgeW = 104;
        int badgeH = 14;
        ctx.fill(titleX, badgeY, titleX + badgeW, badgeY + badgeH, PRIMARY);
        ctx.drawTextWithShadow(this.textRenderer, "MCLAUNCH EDITION", titleX + 6, badgeY + 3, 0xFF000000);

        // 5. Saludo al jugador
        String playerName = "Jugador";
        if (this.client != null && this.client.getSession() != null) {
            playerName = this.client.getSession().getUsername();
        }
        int textY = badgeY + 24;
        if (this.height < 360) textY = badgeY + 18;
        
        ctx.drawTextWithShadow(this.textRenderer, "Bienvenido de vuelta,", titleX, textY, TEXT_MUTED);
        ctx.drawTextWithShadow(this.textRenderer, playerName, titleX, textY + 12, TEXT_MAIN);

        // 6. Pie de página del lado derecho
        int rightCenterX = panelW + (this.width - panelW) / 2;
        ctx.drawTextWithShadow(this.textRenderer, "MC Launch UI v1.1", panelW + 20, this.height - 20, 0x55FFFFFF);

        // 7. Renderizar los botones
        super.render(ctx, mouseX, mouseY, delta);
    }
    
    private void renderBackgroundDecorations(DrawContext ctx) {
        int panelW = 320;
        if (this.width < 500) panelW = this.width / 2 + 50;
        
        int rightSpace = this.width - panelW;
        if (rightSpace < 100) return; // No hay espacio
        
        int centerX = panelW + rightSpace / 2;
        int centerY = this.height / 2;
        
        // Círculos abstractos simulando la M de Minecraft / logo
        ctx.fill(centerX - 80, centerY - 80, centerX + 80, centerY - 79, 0x11FFFFFF);
        ctx.fill(centerX - 80, centerY + 80, centerX + 80, centerY + 81, 0x11FFFFFF);
        ctx.fill(centerX - 80, centerY - 80, centerX - 79, centerY + 80, 0x11FFFFFF);
        ctx.fill(centerX + 79, centerY - 80, centerX + 80, centerY + 80, 0x11FFFFFF);
        
        // Puntos en las esquinas
        ctx.fill(centerX - 81, centerY - 81, centerX - 78, centerY - 78, PRIMARY_DIM);
        ctx.fill(centerX + 78, centerY - 81, centerX + 81, centerY - 78, PRIMARY_DIM);
        ctx.fill(centerX - 81, centerY + 78, centerX - 78, centerY + 81, PRIMARY_DIM);
        ctx.fill(centerX + 78, centerY + 78, centerX + 81, centerY + 81, PRIMARY_DIM);
        
        ctx.getMatrices().push();
        ctx.getMatrices().translate(centerX, centerY, 0);
        ctx.getMatrices().scale(5.0f, 5.0f, 1f);
        String bgText = "MC";
        int bgTextW = this.textRenderer.getWidth(bgText);
        ctx.drawTextWithShadow(this.textRenderer, bgText, -bgTextW / 2, -4, 0x08FFFFFF);
        ctx.getMatrices().pop();
    }

    @SuppressWarnings({"rawtypes", "unchecked"})
    private void render3DPlayer(DrawContext ctx, int mouseX, int mouseY) {
        if (this.client == null) return;
        
        int panelW = 320;
        if (this.width < 500) panelW = this.width / 2 + 50;
        int rightSpace = this.width - panelW;
        if (rightSpace < 150) return; // Pantalla muy pequeña

        int centerX = panelW + rightSpace / 2;
        int centerY = this.height / 2 + 60; // Centro un poco más abajo
        int size = this.height / 3;

        if (this.playerModel == null) {
            try {
                ModelPart modelPart = this.client.getEntityModelLoader().getModelPart(EntityModelLayers.PLAYER);
                this.playerModel = new PlayerEntityModel(modelPart, false);
            } catch (Exception e) {
                return; // Fallback seguro
            }
        }

        // Usar skin cargada asíncronamente; si aún no está lista, usar la default
        Identifier skin = cachedSkin != null ? cachedSkin : getDefaultSkin();

        MatrixStack matrices = ctx.getMatrices();
        matrices.push();
        matrices.translate(centerX, centerY, 1000.0);
        // Y positivo: el espacio del modelo ya tiene Y hacia abajo (igual que pantalla),
        // negarla causaba la inversión. Z negativo para profundidad correcta.
        matrices.scale((float)size, (float)size, (float)(-size));
        matrices.multiply(new Quaternionf().rotateZ((float)Math.PI)); // voltear derecho
        matrices.multiply(new Quaternionf().rotateY((float)Math.PI)); // cara a cámara

        float dx = (float)centerX - mouseX;
        float dy = (float)(centerY - size / 2) - mouseY;
        
        float f = (float)Math.atan((double)(dx / 40.0F));
        float g = (float)Math.atan((double)(dy / 40.0F));
        matrices.multiply(new Quaternionf().rotateY(f * 0.5F));
        
        // Reset arms and legs to default standing position
        playerModel.leftArm.pitch = 0; playerModel.leftArm.yaw = 0; playerModel.leftArm.roll = 0;
        playerModel.rightArm.pitch = 0; playerModel.rightArm.yaw = 0; playerModel.rightArm.roll = 0;
        playerModel.leftLeg.pitch = 0; playerModel.leftLeg.yaw = 0; playerModel.leftLeg.roll = 0;
        playerModel.rightLeg.pitch = 0; playerModel.rightLeg.yaw = 0; playerModel.rightLeg.roll = 0;
        playerModel.body.pitch = 0; playerModel.body.yaw = 0; playerModel.body.roll = 0;

        playerModel.head.pitch = g * 0.5F;
        playerModel.head.yaw = f * 0.5F;
        playerModel.hat.pitch = playerModel.head.pitch;
        playerModel.hat.yaw = playerModel.head.yaw;

        VertexConsumerProvider.Immediate immediate = this.client.getBufferBuilders().getEntityVertexConsumers();
        VertexConsumer vertexConsumer = immediate.getBuffer(RenderLayer.getEntityCutoutNoCull(skin));
        
        // Iluminación simulada para UI (similar a InventoryScreen)
        RenderSystem.setShaderLights(new org.joml.Vector3f(-0.2f, 1.0f, -0.2f).normalize(), new org.joml.Vector3f(0.2f, 1.0f, 0.2f).normalize());
        
        playerModel.render(matrices, vertexConsumer, 0xF000F0, OverlayTexture.DEFAULT_UV, 1.0f, 1.0f, 1.0f, 1.0f);
        
        immediate.draw();
        matrices.pop();
        
        RenderSystem.applyModelViewMatrix();
    }

    @Override
    public void close() {
        if (this.client != null) {
            this.client.setScreen(this.parent);
        }
    }

    // =================================================================================
    // Custom Button Widget for a modern flat look
    // =================================================================================
    private static class ModernButtonWidget extends ButtonWidget {
        public ModernButtonWidget(int x, int y, int width, int height, Text message, PressAction onPress) {
            super(x, y, width, height, message, onPress, DEFAULT_NARRATION_SUPPLIER);
        }

        @Override
        public void renderButton(DrawContext context, int mouseX, int mouseY, float delta) {
            MinecraftClient client = MinecraftClient.getInstance();
            
            // Colores
            int bg = this.isHovered() ? 0xFF2A3644 : 0xFF1C252E;
            int border = this.isHovered() ? PRIMARY : 0xFF2A3644;
            int textCol = this.isHovered() ? PRIMARY : 0xFFFFFFFF;
            
            if (!this.active) {
                bg = 0xFF111111;
                border = 0xFF222222;
                textCol = 0xFFAAAAAA;
            }

            // Fondo y borde
            context.fill(this.getX(), this.getY(), this.getX() + this.width, this.getY() + this.height, bg);
            context.drawBorder(this.getX(), this.getY(), this.width, this.height, border);
            
            // Acento izquierdo si está hovered
            if (this.isHovered() && this.active) {
                context.fill(this.getX(), this.getY(), this.getX() + 2, this.getY() + this.height, PRIMARY);
            }

            // Texto centrado
            int msgW = client.textRenderer.getWidth(this.getMessage());
            int textX = this.getX() + (this.width - msgW) / 2;
            int textY = this.getY() + (this.height - 8) / 2;
            context.drawTextWithShadow(client.textRenderer, this.getMessage(), textX, textY, textCol);
        }
    }
}

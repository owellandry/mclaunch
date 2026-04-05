package com.mclaunch.home.screen;

import com.mclaunch.home.ui.McLaunchText;
import net.minecraft.client.gui.DrawContext;
import net.minecraft.client.gui.screen.Screen;
import net.minecraft.client.gui.screen.multiplayer.MultiplayerScreen;
import net.minecraft.client.gui.screen.option.OptionsScreen;
import net.minecraft.client.gui.screen.world.SelectWorldScreen;
import net.minecraft.client.gui.widget.ButtonWidget;
import net.minecraft.text.Text;

public final class McLaunchHomePreviewScreen extends Screen {

    // ====================== PALETA ======================
    private static final int BG_TOP        = 0xFF05080D;
    private static final int BG_BOTTOM     = 0xFF0A0F17;
    
    private static final int PANEL_BG      = 0xE60A0F17; // Transparencia oscura
    private static final int PRIMARY       = 0xFF4ADE80; // Verde
    
    private static final int TEXT_MAIN     = 0xFFFFFFFF;
    private static final int TEXT_MUTED    = 0xFFA1A1AA;

    private final Screen parent;

    public McLaunchHomePreviewScreen(Screen parent) {
        super(McLaunchText.tr("screen.mclaunch_home.preview.title", "MC Launch Home", "Inicio MC Launch"));
        this.parent = parent;
    }

    @Override
    protected void init() {
        int panelW = 320;
        int btnW = 240;
        int btnH = 28;
        int gap = 12;
        
        int startX = (panelW - btnW) / 2;
        int startY = this.height / 2 - 30;

        // Botón: Un Jugador
        this.addDrawableChild(ButtonWidget.builder(
                Text.translatable("menu.singleplayer"),
                btn -> {
                    if (this.client != null) {
                        this.client.setScreen(new SelectWorldScreen(this));
                    }
                })
                .dimensions(startX, startY, btnW, btnH)
                .build());

        // Botón: Multijugador
        this.addDrawableChild(ButtonWidget.builder(
                Text.translatable("menu.multiplayer"),
                btn -> {
                    if (this.client != null) {
                        this.client.setScreen(new MultiplayerScreen(this));
                    }
                })
                .dimensions(startX, startY + (btnH + gap), btnW, btnH)
                .build());

        // Botón: Ajustes
        this.addDrawableChild(ButtonWidget.builder(
                Text.translatable("menu.options"),
                btn -> {
                    if (this.client != null) {
                        this.client.setScreen(new OptionsScreen(this, this.client.options));
                    }
                })
                .dimensions(startX, startY + (btnH + gap) * 2, btnW, btnH)
                .build());

        // Botón: Salir
        this.addDrawableChild(ButtonWidget.builder(
                Text.translatable("menu.quit"),
                btn -> {
                    if (this.client != null) {
                        this.client.scheduleStop();
                    }
                })
                .dimensions(startX, startY + (btnH + gap) * 3, btnW, btnH)
                .build());

        // Botón: Volver al menú clásico (Vanilla)
        this.addDrawableChild(ButtonWidget.builder(
                McLaunchText.tr("screen.mclaunch_home.preview.back", "← Vanilla Menu", "← Menú Clásico"),
                btn -> this.close())
                .dimensions(startX, this.height - 40, btnW, 20)
                .build());
    }

    @Override
    public void render(DrawContext ctx, int mouseX, int mouseY, float delta) {
        // 1. Fondo de toda la pantalla (Gradiente profundo)
        ctx.fillGradient(0, 0, this.width, this.height, BG_TOP, BG_BOTTOM);

        // Decoración de fondo (líneas sutiles)
        ctx.fill(0, this.height / 3, this.width, this.height / 3 + 1, 0x11FFFFFF);
        ctx.fill(0, this.height * 2 / 3, this.width, this.height * 2 / 3 + 1, 0x11FFFFFF);

        // 2. Panel Izquierdo (Sidebar)
        int panelW = 320;
        ctx.fill(0, 0, panelW, this.height, PANEL_BG);
        ctx.fill(panelW, 0, panelW + 2, this.height, PRIMARY); // Borde lateral verde

        // 3. Título principal en el panel
        int titleX = 40;
        int titleY = 60;
        
        ctx.getMatrices().push();
        ctx.getMatrices().translate(titleX, titleY, 0);
        ctx.getMatrices().scale(2.5f, 2.5f, 1f);
        ctx.drawTextWithShadow(this.textRenderer, "MINECRAFT", 0, 0, TEXT_MAIN);
        ctx.getMatrices().pop();

        // 4. Etiqueta / Badge "MCLAUNCH EDITION"
        int badgeY = titleY + 32;
        int badgeW = 104;
        int badgeH = 14;
        ctx.fill(titleX, badgeY, titleX + badgeW, badgeY + badgeH, PRIMARY);
        ctx.drawTextWithShadow(this.textRenderer, "MCLAUNCH EDITION", titleX + 6, badgeY + 3, 0xFF000000);

        // 5. Saludo al jugador
        String playerName = "Jugador";
        if (this.client != null && this.client.getSession() != null) {
            playerName = this.client.getSession().getUsername();
        }
        ctx.drawTextWithShadow(this.textRenderer, "Bienvenido de vuelta,", titleX, badgeY + 30, TEXT_MUTED);
        ctx.drawTextWithShadow(this.textRenderer, playerName, titleX, badgeY + 42, TEXT_MAIN);

        // 6. Decoración en la parte derecha (espacio principal)
        int rightCenterX = panelW + (this.width - panelW) / 2;
        int rightCenterY = this.height / 2;
        
        ctx.getMatrices().push();
        ctx.getMatrices().translate(rightCenterX, rightCenterY, 0);
        ctx.getMatrices().scale(6.0f, 6.0f, 1f);
        String bgText = "MC";
        int bgTextW = this.textRenderer.getWidth(bgText);
        // Texto gigante muy transparente
        ctx.drawTextWithShadow(this.textRenderer, bgText, -bgTextW / 2, -4, 0x0AFFFFFF);
        ctx.getMatrices().pop();

        // 7. Pie de página del lado derecho
        ctx.drawTextWithShadow(this.textRenderer, "MC Launch UI v1.0", panelW + 30, this.height - 30, 0x33FFFFFF);

        // 8. Renderizar los botones
        super.render(ctx, mouseX, mouseY, delta);
    }

    @Override
    public void close() {
        if (this.client != null) {
            this.client.setScreen(this.parent);
        }
    }
}

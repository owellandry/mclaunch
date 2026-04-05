package com.mclaunch.home.screen;

import com.mclaunch.home.ui.McLaunchText;
import net.minecraft.client.gui.DrawContext;
import net.minecraft.client.gui.screen.Screen;
import net.minecraft.client.gui.widget.ButtonWidget;
import net.minecraft.text.Text;

public final class McLaunchHomePreviewScreen extends Screen {

    // ====================== PALETA (espeja el React app) ======================
    private static final int BG_TOP        = 0xFF0A0F17;
    private static final int BG_BOTTOM     = 0xFF141B24;
    private static final int SURFACE       = 0xFF1C252E;
    private static final int SURFACE_LIGHT = 0xFF252F39;
    private static final int PRIMARY       = 0xFF4ADE80;   // verde
    private static final int PRIMARY_DIM   = 0x554ADE80;
    private static final int ACCENT        = 0xFFBAE34C;
    private static final int TEXT          = 0xFFF8FAF0;
    private static final int MUTED         = 0xFF8A9A88;
    private static final int BORDER        = 0xFF2E3D30;
    private static final int BORDER_GREEN  = 0xFF4ADE80;

    // Actividad semanal de muestra (porcentajes)
    private static final int[] ACTIVITY = { 40, 75, 55, 90, 60, 85, 45 };
    private static final String[] DAYS   = { "D", "L", "M", "X", "J", "V", "S" };

    // Versiones de muestra
    private static final String[] VERSIONS  = { "1.21.4", "1.21.1", "1.20.4", "1.20.1", "1.19.4" };
    private static final int      SELECTED  = 3; // 1.20.1

    private final Screen parent;

    public McLaunchHomePreviewScreen(Screen parent) {
        super(McLaunchText.tr("screen.mclaunch_home.preview.title", "MC Launch Home", "Inicio MC Launch"));
        this.parent = parent;
    }

    // ====================== INIT ======================
    @Override
    protected void init() {
        int pad    = 14;
        int heroH  = heroHeight();

        // Botón INICIAR — esquina inferior derecha del hero
        int btnW = 148;
        int btnH = 22;
        this.addDrawableChild(ButtonWidget.builder(
                McLaunchText.tr("screen.mclaunch_home.preview.play", "▶  INICIAR", "▶  INICIAR"),
                btn -> {})
                .dimensions(this.width - pad - btnW, heroH - btnH - 10, btnW, btnH)
                .build());

        // Botón volver — esquina inferior izquierda de la pantalla
        this.addDrawableChild(ButtonWidget.builder(
                McLaunchText.tr("screen.mclaunch_home.preview.back", "← Volver", "← Volver"),
                btn -> this.close())
                .dimensions(pad, this.height - pad - 20, 120, 20)
                .build());
    }

    // ====================== RENDER ======================
    @Override
    public void render(DrawContext ctx, int mouseX, int mouseY, float delta) {

        // Fondo general
        ctx.fillGradient(0, 0, this.width, this.height, BG_TOP, BG_BOTTOM);

        int pad    = 14;
        int heroH  = heroHeight();
        int gap    = 10;
        int botY   = heroH + gap;
        int botH   = this.height - botY - 38; // dejar espacio para botón volver
        int colGap = 8;
        int colW   = (this.width - pad * 2 - colGap * 2) / 3;

        // ── HERO ──────────────────────────────────────────────────────────────
        renderHero(ctx, pad, heroH);

        // ── GRID INFERIOR (3 columnas) ────────────────────────────────────────
        int c1 = pad;
        int c2 = pad + colW + colGap;
        int c3 = pad + (colW + colGap) * 2;

        renderActivityCard(ctx,  c1, botY, colW, botH);
        renderStatsCard(ctx,     c2, botY, colW, botH);
        renderVersionCard(ctx,   c3, botY, colW, botH);

        // Widgets (botones reales)
        super.render(ctx, mouseX, mouseY, delta);
    }

    // ====================== HERO ======================
    private void renderHero(DrawContext ctx, int pad, int heroH) {
        int w = this.width - pad * 2;

        // Fondo del hero
        ctx.fillGradient(pad, pad, pad + w, heroH, 0xFF0D1827, 0xFF162030);
        ctx.drawBorder(pad, pad, w, heroH - pad, BORDER);

        // Viñeta inferior (simula el gradiente del React)
        ctx.fillGradient(pad, heroH - 70, pad + w, heroH, 0x00000000, 0xEE0A0F17);

        // Nav pills centradas (JUEGOS · TIENDA · COMUNIDAD · SOPORTE)
        String[] navLabels = { "JUEGOS", "TIENDA", "COMUNIDAD", "SOPORTE" };
        drawNavPills(ctx, pad, w, pad + 14, navLabels);

        // Badge
        int contentY = heroH - 68;
        drawBadge(ctx, pad + 18, contentY,
                McLaunchText.tr("preview.badge", "VANILLA RELEASE", "VANILLA RELEASE"));

        // Título grande
        drawScaled(ctx, Text.literal("Minecraft 1.20.1"),
                pad + 20, contentY + 18, 2.1f, TEXT);

        // Descripción
        ctx.drawTextWithShadow(this.textRenderer,
                McLaunchText.tr("preview.desc",
                        "Explora, construye y sobrevive en mundos infinitos.",
                        "Explora, construye y sobrevive en mundos infinitos."),
                pad + 22, contentY + 52, MUTED);
    }

    // ====================== CARDS ======================

    /** Card 1 — Actividad semanal */
    private void renderActivityCard(DrawContext ctx, int x, int y, int w, int h) {
        drawCard(ctx, x, y, w, h);
        drawCardLabel(ctx, x + 10, y + 9, "ACTIVIDAD SEMANAL");

        int chartTop  = y + 24;
        int chartBot  = y + h - 22;
        int chartH    = chartBot - chartTop;
        int innerW    = w - 20;
        int barW      = (innerW - 6) / ACTIVITY.length;

        for (int i = 0; i < ACTIVITY.length; i++) {
            int bx    = x + 10 + i * barW;
            int barH  = (int)(chartH * (ACTIVITY[i] / 100.0));
            // fondo vacío
            ctx.fill(bx, chartTop, bx + barW - 2, chartBot, SURFACE_LIGHT);
            // barra coloreada
            ctx.fillGradient(bx, chartBot - barH, bx + barW - 2, chartBot, ACCENT, PRIMARY);
        }

        // Etiquetas días
        for (int i = 0; i < DAYS.length; i++) {
            int lx = x + 10 + i * barW + (barW - 2) / 2
                    - this.textRenderer.getWidth(DAYS[i]) / 2;
            ctx.drawTextWithShadow(this.textRenderer, DAYS[i], lx, y + h - 14, MUTED);
        }
    }

    /** Card 2 — Estadísticas */
    private void renderStatsCard(DrawContext ctx, int x, int y, int w, int h) {
        drawCard(ctx, x, y, w, h);
        drawCardLabel(ctx, x + 10, y + 9, "TUS ESTADISTICAS");

        int boxH = (h - 38) / 2 - 4;
        int boxW = (w - 24) / 2;

        drawStatBox(ctx, x + 8, y + 26,           boxW, boxH, "73%",  "WIN RATE");
        drawStatBox(ctx, x + 8 + boxW + 4, y + 26, boxW, boxH, "2.4",  "KDA");
        drawStatBox(ctx, x + 8, y + 26 + boxH + 4, boxW, boxH, "1,842", "PARTIDAS");
        drawStatBox(ctx, x + 8 + boxW + 4, y + 26 + boxH + 4, boxW, boxH, "48h", "ESTA SEMANA");
    }

    /** Card 3 — Selector de versión */
    private void renderVersionCard(DrawContext ctx, int x, int y, int w, int h) {
        drawCard(ctx, x, y, w, h);
        drawCardLabel(ctx, x + 10, y + 9, "SELECCIONAR VERSION");

        int rowH  = (h - 28) / VERSIONS.length;
        for (int i = 0; i < VERSIONS.length; i++) {
            drawVersionRow(ctx, x + 8, y + 24 + i * rowH, w - 16, rowH - 2,
                    VERSIONS[i], i == SELECTED);
        }
    }

    // ====================== COMPONENTES UI ======================

    private void drawNavPills(DrawContext ctx, int offsetX, int totalW, int y, String[] labels) {
        int total = 0;
        for (String l : labels) total += this.textRenderer.getWidth(l) + 22;
        total += (labels.length - 1) * 6;
        int sx = offsetX + (totalW - total) / 2;

        for (int i = 0; i < labels.length; i++) {
            int pw = this.textRenderer.getWidth(labels[i]) + 22;
            int bg = (i == 0) ? 0xCC18311D : 0x66101820;
            int border = (i == 0) ? BORDER_GREEN : 0x44446644;
            int fg = (i == 0) ? PRIMARY : 0xFFCBD2C4;
            ctx.fill(sx, y, sx + pw, y + 18, bg);
            ctx.drawBorder(sx, y, pw, 18, border);
            ctx.drawTextWithShadow(this.textRenderer, labels[i],
                    sx + (pw - this.textRenderer.getWidth(labels[i])) / 2, y + 5, fg);
            sx += pw + 6;
        }
    }

    private void drawBadge(DrawContext ctx, int x, int y, Text text) {
        int w = this.textRenderer.getWidth(text) + 20;
        ctx.fill(x, y, x + w, y + 16, 0xCC18311D);
        ctx.drawBorder(x, y, w, 16, BORDER_GREEN);
        ctx.drawTextWithShadow(this.textRenderer, text, x + 10, y + 4, PRIMARY);
    }

    private void drawCard(DrawContext ctx, int x, int y, int w, int h) {
        // sombra sutil
        ctx.fill(x + 3, y + 3, x + w + 3, y + h + 3, 0x33000000);
        ctx.fill(x, y, x + w, y + h, SURFACE);
        ctx.drawBorder(x, y, w, h, BORDER);
        // línea superior de acento
        ctx.fill(x + 1, y + 1, x + w - 1, y + 3, PRIMARY_DIM);
    }

    private void drawCardLabel(DrawContext ctx, int x, int y, String label) {
        ctx.drawTextWithShadow(this.textRenderer,
                Text.literal(label).styled(s -> s.withBold(true)),
                x, y, MUTED);
        // separador
        ctx.fill(x, y + 10, x + 60, y + 11, BORDER_GREEN);
    }

    private void drawStatBox(DrawContext ctx, int x, int y, int w, int h, String value, String label) {
        ctx.fill(x, y, x + w, y + h, SURFACE_LIGHT);
        ctx.drawBorder(x, y, w, h, BORDER);

        // valor grande centrado
        drawScaled(ctx, Text.literal(value),
                x + w / 2 - (int)(this.textRenderer.getWidth(value) * 1.4f) / 2,
                y + h / 2 - 10, 1.4f, TEXT);

        // etiqueta pequeña
        int labelW = this.textRenderer.getWidth(label);
        ctx.drawTextWithShadow(this.textRenderer, label,
                x + (w - labelW) / 2, y + h - 11, MUTED);
    }

    private void drawVersionRow(DrawContext ctx, int x, int y, int w, int h, String version, boolean selected) {
        int bg     = selected ? 0x2244DE80 : SURFACE_LIGHT;
        int border = selected ? BORDER_GREEN : BORDER;
        int fg     = selected ? PRIMARY : TEXT;

        ctx.fill(x, y, x + w, y + h, bg);
        ctx.drawBorder(x, y, w, h, border);

        // Indicador izquierdo
        if (selected) ctx.fill(x, y, x + 2, y + h, PRIMARY);

        ctx.drawTextWithShadow(this.textRenderer,
                Text.literal("Minecraft " + version), x + 8, y + (h - 8) / 2, fg);

        // Indicador derecho (cuadrito seleccionado)
        int dot = 6;
        int dotX = x + w - dot - 6;
        int dotY = y + (h - dot) / 2;
        ctx.fill(dotX, dotY, dotX + dot, dotY + dot,
                selected ? PRIMARY : SURFACE_LIGHT);
        ctx.drawBorder(dotX, dotY, dot, dot, border);
    }

    private void drawScaled(DrawContext ctx, Text text, int x, int y, float scale, int color) {
        ctx.getMatrices().push();
        ctx.getMatrices().translate(x, y, 0);
        ctx.getMatrices().scale(scale, scale, 1f);
        ctx.drawTextWithShadow(this.textRenderer, text, 0, 0, color);
        ctx.getMatrices().pop();
    }

    // ====================== UTILIDADES ======================

    private int heroHeight() {
        return (int)(this.height * 0.56);
    }

    @Override
    public void close() {
        if (this.client != null) this.client.setScreen(this.parent);
    }
}

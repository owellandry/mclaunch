package com.mclaunch.home.screen;

import com.mojang.blaze3d.systems.RenderSystem;
import net.minecraft.client.MinecraftClient;
import net.minecraft.client.font.TextRenderer;
import net.minecraft.client.gui.DrawContext;
import net.minecraft.client.gui.widget.ButtonWidget;
import net.minecraft.text.Text;
import net.minecraft.util.math.MathHelper;

public class ModernButtonWidget extends ButtonWidget {

    public ModernButtonWidget(int x, int y, int width, int height, Text message, PressAction onPress) {
        super(x, y, width, height, message, onPress, DEFAULT_NARRATION_SUPPLIER);
    }

    @Override
    public void renderButton(DrawContext context, int mouseX, int mouseY, float delta) {
        MinecraftClient minecraftClient = MinecraftClient.getInstance();
        TextRenderer textRenderer = minecraftClient.textRenderer;
        
        int bgColor = this.isHovered() ? 0xFF2E3D30 : 0xFF1C252E;
        int borderColor = this.isHovered() ? 0xFF4ADE80 : 0xFF2E3D30;
        int textColor = this.isHovered() ? 0xFF4ADE80 : 0xFFFFFFFF;
        
        if (!this.active) {
            bgColor = 0xFF111111;
            borderColor = 0xFF222222;
            textColor = 0xFFAAAAAA;
        }

        // Draw background
        context.fill(this.getX(), this.getY(), this.getX() + this.width, this.getY() + this.height, bgColor);
        // Draw border
        context.drawBorder(this.getX(), this.getY(), this.width, this.height, borderColor);
        
        // Draw left accent if hovered
        if (this.isHovered() && this.active) {
            context.fill(this.getX(), this.getY(), this.getX() + 2, this.getY() + this.height, 0xFF4ADE80);
        }

        int j = this.active ? textColor : 0xFFA0A0A0;
        context.drawTextWithShadow(textRenderer, this.getMessage(), this.getX() + this.width / 2 - textRenderer.getWidth(this.getMessage()) / 2, this.getY() + (this.height - 8) / 2, j | MathHelper.ceil(this.alpha * 255.0F) << 24);
    }
}

package com.mclaunch.home.render;

import com.mclaunch.home.McLaunchHomeClient;
import net.minecraft.client.network.AbstractClientPlayerEntity;
import net.minecraft.client.render.OverlayTexture;
import net.minecraft.client.render.RenderLayer;
import net.minecraft.client.render.VertexConsumer;
import net.minecraft.client.render.VertexConsumerProvider;
import net.minecraft.client.render.entity.PlayerEntityRenderer;
import net.minecraft.client.render.entity.feature.FeatureRenderer;
import net.minecraft.client.render.entity.feature.FeatureRendererContext;
import net.minecraft.client.render.entity.model.PlayerEntityModel;
import net.minecraft.client.util.math.MatrixStack;
import net.minecraft.util.Identifier;
import net.minecraft.util.math.MathHelper;
import net.minecraft.util.math.RotationAxis;

/**
 * Renderiza la capa exclusiva de MC Launch sobre la capa nativa.
 */
public class LauncherCapeFeatureRenderer
    extends FeatureRenderer<AbstractClientPlayerEntity, PlayerEntityModel<AbstractClientPlayerEntity>> {

    private static final Identifier CAPE_TEXTURE =
        new Identifier("mclaunch-home", "textures/cape/cape.png");

    public LauncherCapeFeatureRenderer(FeatureRendererContext<AbstractClientPlayerEntity, PlayerEntityModel<AbstractClientPlayerEntity>> context) {
        super(context);
    }

    @Override
    public void render(
        MatrixStack matrices,
        VertexConsumerProvider vertexConsumers,
        int light,
        AbstractClientPlayerEntity player,
        float limbAngle,
        float limbDistance,
        float tickDelta,
        float animationProgress,
        float headYaw,
        float headPitch
    ) {
        float bodyYaw = player.prevBodyYaw + (player.bodyYaw - player.prevBodyYaw) * tickDelta;
        double horizontalSpeed = MathHelper.lerp(tickDelta, player.prevHorizontalSpeed, player.horizontalSpeed);
        float strideDistance = player.prevStrideDistance + (player.strideDistance - player.prevStrideDistance) * tickDelta;

        matrices.push();
        matrices.multiply(RotationAxis.POSITIVE_Y.rotationDegrees(180.0f - bodyYaw));
        matrices.translate(0.0, -0.25, -0.16);

        VertexConsumer vertexConsumer = vertexConsumers.getBuffer(RenderLayer.getEntitySolid(CAPE_TEXTURE));

        int segments = 4;
        for (int i = 0; i < segments; i++) {
            matrices.push();
            float v0 = i / (float) segments;
            float v1 = (i + 1) / (float) segments;
            matrices.translate(0.0, 0.0, i * 0.125f / segments);
            renderQuad(matrices, vertexConsumer, light, v0, v1);
            matrices.pop();
        }

        matrices.pop();
    }

    private void renderQuad(MatrixStack matrices, VertexConsumer vertexConsumer, int light, float v0, float v1) {
        var entry = matrices.peek();
        var pos = entry.getPositionMatrix();
        var norm = entry.getNormalMatrix();

        float w = 0.35f;
        float h = 0.45f;
        float d = 0.003f;

        // Front
        vertex(vertexConsumer, pos, norm, light, -w, -h, d, 0.0f, v0);
        vertex(vertexConsumer, pos, norm, light,  w, -h, d, 1.0f, v0);
        vertex(vertexConsumer, pos, norm, light,  w,  h, d, 1.0f, v1);
        vertex(vertexConsumer, pos, norm, light, -w,  h, d, 0.0f, v1);

        // Back
        vertex(vertexConsumer, pos, norm, light,  w, -h, -d, 1.0f, v0);
        vertex(vertexConsumer, pos, norm, light, -w, -h, -d, 0.0f, v0);
        vertex(vertexConsumer, pos, norm, light, -w,  h, -d, 0.0f, v1);
        vertex(vertexConsumer, pos, norm, light,  w,  h, -d, 1.0f, v1);
    }

    private void vertex(VertexConsumer vc, org.joml.Matrix4f pos, org.joml.Matrix3f norm, int light,
                        float x, float y, float z, float u, float v) {
        vc.vertex(pos, x, y, z)
            .color(255, 255, 255, 255)
            .texture(u, v)
            .overlay(OverlayTexture.DEFAULT_UV)
            .light(light)
            .normal(norm, 0.0f, 1.0f, 0.0f);
    }
}

package com.mclaunch.home.screen;

import com.mclaunch.home.McLaunchHomeClient;
import com.mojang.blaze3d.systems.RenderSystem;
import net.minecraft.client.MinecraftClient;
import net.minecraft.client.gui.DrawContext;
import net.minecraft.client.render.DiffuseLighting;
import net.minecraft.client.render.LightmapTextureManager;
import net.minecraft.client.render.VertexConsumerProvider;
import net.minecraft.client.render.entity.EntityRenderDispatcher;
import net.minecraft.client.render.entity.PlayerModelPart;
import net.minecraft.client.render.entity.model.EntityModelLayers;
import net.minecraft.client.render.entity.model.PlayerEntityModel;
import net.minecraft.client.util.math.MatrixStack;
import net.minecraft.util.Identifier;
import net.minecraft.util.Util;
import net.minecraft.util.math.MathHelper;
import org.joml.Quaternionf;
import org.joml.Vector3f;

/**
 * Renders a 3-D player model in the custom home screen.
 *
 * <h3>Approach</h3>
 * <p>We render via two paths, tried in order:
 * <ol>
 *   <li><b>EntityRenderDispatcher path</b> – used when a {@code ClientWorld} exists
 *       (e.g., when the screen is opened in-game).  A lightweight fake
 *       {@link FakeClientPlayer} is constructed once and passed to
 *       {@code EntityRenderDispatcher.render()}, which produces the same result as
 *       {@code InventoryScreen.drawEntity()}.
 *   <li><b>Direct model path</b> – used when the world is {@code null} (title screen
 *       before any world has loaded).  We drive {@code PlayerEntityModel.render()}
 *       ourselves with the exact transform chain that vanilla {@code drawEntity} uses
 *       internally, including the shader-light setup extracted from
 *       {@code DiffuseLighting.method_34742()}.
 * </ol>
 *
 * <h3>Transform maths (direct path)</h3>
 * <pre>
 *   1. translate(centerX, footY, 100)          – anchor; Z=100 pushes into GUI depth
 *   2. scale(size, size, -size)                 – uniform scale, flip Z so +Z is "into screen"
 *   3. rotateZ(π)                               – flip model upright (vanilla stores Y+ = down)
 *   4. rotateX(tilt_degrees)                    – slight downward look tilt
 *   5. rotateY(yaw_degrees)                     – idle sway yaw
 *   6. model.render(…)                          – model root at (0,0,0); feet at y≈+1.5 units
 *      after the Z-flip the feet are at the bottom of the rendered quad.
 * </pre>
 *
 * <h3>Skin in 1.20.1</h3>
 * <p>Use {@code MinecraftClient.getSkinProvider().loadSkin(profile, callback, false)}
 * (the {@code MinecraftProfileTexture} callback API).  Do NOT use {@code PlayerSkin}
 * – that API does not exist until 1.20.4.
 */
public final class PlayerPreviewRenderer {

    // -----------------------------------------------------------------------
    // Constants
    // -----------------------------------------------------------------------

    /**
     * Effective model height for the direct-render path.
     *
     * <p>{@link PlayerEntityModel#render} ultimately renders in entity/model space,
     * not raw skin-pixel space, so using the 32px skin span here makes the preview
     * drastically undersized on screen. Empirically, a value close to vanilla
     * inventory rendering behaves like a model roughly two units tall.
     */
    private static final float MODEL_HEIGHT_UNITS = 2.0f;

    // Viewer-directed lights: strong -Z (toward viewer in GUI space), Y=0.
    //
    // Verified against the actual MC 1.20.1 shader (light.glsl):
    //   lightAccum = min(1.0, (dot(L0,N) + dot(L1,N)) * 0.6 + 0.4)
    //   The shader normalizes the light vectors internally, so only direction matters.
    //   Normals arrive pre-transformed by the Java MatrixStack normal matrix.
    //
    // With our scale(s,s,-s), a front-facing surface has world-space normal ≈ (0,0,-1).
    //   dot((0,0,-1), normalize(0.2,0,-1)) = 0.981 per light
    //   lightAccum = min(1.0, 1.962*0.6 + 0.4) = 1.0 → always clamped to max.
    //
    // Why Y=0?  Any Y≠0 in the light vector reacts to head pitch (which adds a Y
    // component to the face normal).  With vanilla lights (Y=1.0), a 12° upward pitch
    // jumps lightAccum from 0.40 → 0.53 — a 32% visible increase.  With Y=0 the
    // Y contribution is always zero regardless of how far the head tilts.
    //
    // Result: front face = 100% (clamped), sides ≈ 52%, back/top/bottom = 40% ambient.
    // Zero flicker across idle sway, arm swing, and mouse head-tracking.
    private static final Vector3f LIGHT_0 = new Vector3f( 0.2f, 0.0f, -1.0f).normalize();
    private static final Vector3f LIGHT_1 = new Vector3f(-0.2f, 0.0f, -1.0f).normalize();

    // -----------------------------------------------------------------------
    // State
    // -----------------------------------------------------------------------

    private final MinecraftClient client;
    private final Quaternionf rotation = new Quaternionf();

    /** Cached classic-arms model (4-pixel arms). */
    private PlayerEntityModel<?> classicModel;
    /** Cached slim-arms model (3-pixel arms). */
    private PlayerEntityModel<?> slimModel;

    /** Set to true if a fatal rendering error occurs, to prevent log spam. */
    private boolean disabled;

    // -----------------------------------------------------------------------

    public PlayerPreviewRenderer(MinecraftClient client) {
        this.client = client;
    }

    public void prewarmModels() {
        if (disabled) {
            return;
        }

        getOrCreateModel(false);
        getOrCreateModel(true);
    }

    // -----------------------------------------------------------------------
    // Public API
    // -----------------------------------------------------------------------

    /**
     * Renders the player model inside the rectangle {@code [x, x+width] × [y, y+height]}.
     *
     * @param context   the current draw context
     * @param x         left edge of the bounding box (screen pixels)
     * @param y         top edge of the bounding box (screen pixels)
     * @param width     width of the bounding box
     * @param height    height of the bounding box
     * @param skin      skin texture identifier (use {@link net.minecraft.client.util.DefaultSkinHelper}
     *                  as a fallback when the real skin has not loaded yet)
     * @param slimArms  {@code true} for the Alex/slim arm model
     * @param delta     partial tick delta (used for idle animation)
     * @return {@code true} if rendering succeeded, {@code false} on failure
     *         (caller should fall back to a 2-D flat skin render)
     */
    public boolean render(DrawContext context, int x, int y, int width, int height,
                          Identifier skin, boolean slimArms, float delta,
                          int mouseX, int mouseY) {
        if (disabled || width <= 0 || height <= 0) {
            return false;
        }

        try {
            return renderDirect(context, x, y, width, height, skin, slimArms, delta, mouseX, mouseY);
        } catch (RuntimeException error) {
            disabled = true;
            McLaunchHomeClient.LOGGER.warn(
                "3D player preview failed, disabling. Falling back to 2-D skin render.", error);
            return false;
        }
    }

    // -----------------------------------------------------------------------
    // Direct PlayerEntityModel render path (works with null world / title screen)
    // -----------------------------------------------------------------------

    /**
     * Renders using {@code PlayerEntityModel.render()} directly.
     */
    private boolean renderDirect(DrawContext context, int x, int y, int width, int height,
                                 Identifier skin, boolean slimArms, float delta,
                                 int mouseX, int mouseY) {
        PlayerEntityModel<?> model = getOrCreateModel(slimArms);
        if (model == null) {
            return false;
        }

        // ------------------------------------------------------------------
        // 1. Compute layout
        // ------------------------------------------------------------------
        float size = (height / MODEL_HEIGHT_UNITS) * 0.46f;

        float anchorX = x + width  * 0.5f;
        float anchorY = y + height * 0.53f;
        float anchorZ = 100.0f;

        // ------------------------------------------------------------------
        // 2. Animation (now heavily reduced to stop lighting flicker)
        // ------------------------------------------------------------------
        float timeSeconds = (float)(Util.getMeasuringTimeMs() / 1000.0) + delta * 0.05f;
        float lookX = MathHelper.clamp((mouseX - (x + width * 0.5f)) / (width * 0.5f), -1.0f, 1.0f);
        float lookY = MathHelper.clamp((mouseY - (y + height * 0.34f)) / (height * 0.5f), -1.0f, 1.0f);
        prepareModelPose(model, timeSeconds, lookX, lookY);

        // IDLE SWAY REDUCED DRASTICALLY → almost no left-right movement and very small tilt.
        // This was the main cause of continuous lighting flicker.
        float swayYaw   = MathHelper.sin(timeSeconds * 0.38f) * 3.5f;   // was 10.0f
        float swayPitch = 5.0f + MathHelper.sin(timeSeconds * 0.55f) * 0.8f; // was 6.0f + 1.5f

        // ------------------------------------------------------------------
        // 3. Transform stack
        // ------------------------------------------------------------------
        MatrixStack matrices = context.getMatrices();
        matrices.push();

        matrices.translate(anchorX, anchorY, anchorZ);
        matrices.scale(size, size, -size);

        rotation.identity()
            .rotateY(swayYaw * MathHelper.RADIANS_PER_DEGREE)
            .rotateX(swayPitch * MathHelper.RADIANS_PER_DEGREE);
        matrices.multiply(rotation);

        // ------------------------------------------------------------------
        // 4. GL state: depth, blend, shader lights
        // ------------------------------------------------------------------
        RenderSystem.enableDepthTest();
        RenderSystem.enableBlend();
        RenderSystem.disableCull();

        DiffuseLighting.disableGuiDepthLighting();
        RenderSystem.setShaderLights(LIGHT_0, LIGHT_1);
        context.setShaderColor(1.0f, 1.0f, 1.0f, 1.0f);

        // ------------------------------------------------------------------
        // 5. Render
        // ------------------------------------------------------------------
        VertexConsumerProvider.Immediate buffers =
            client.getBufferBuilders().getEntityVertexConsumers();

        net.minecraft.client.render.RenderLayer renderLayer =
            net.minecraft.client.render.RenderLayer.getEntityCutoutNoCull(skin);

        model.render(
            matrices,
            buffers.getBuffer(renderLayer),
            LightmapTextureManager.MAX_LIGHT_COORDINATE,
            net.minecraft.client.render.OverlayTexture.DEFAULT_UV,
            1.0f, 1.0f, 1.0f, 1.0f
        );

        buffers.draw();

        // ------------------------------------------------------------------
        // 6. Restore GL state
        // ------------------------------------------------------------------
        DiffuseLighting.enableGuiDepthLighting();
        RenderSystem.enableCull();
        RenderSystem.disableBlend();
        matrices.pop();

        return true;
    }

    // -----------------------------------------------------------------------
    // Model management
    // -----------------------------------------------------------------------

    private PlayerEntityModel<?> getOrCreateModel(boolean slimArms) {
        if (client == null || client.getEntityModelLoader() == null) {
            return null;
        }
        if (slimArms) {
            if (slimModel == null) {
                slimModel = new PlayerEntityModel<>(
                    client.getEntityModelLoader().getModelPart(EntityModelLayers.PLAYER_SLIM),
                    true
                );
            }
            return slimModel;
        }
        if (classicModel == null) {
            classicModel = new PlayerEntityModel<>(
                client.getEntityModelLoader().getModelPart(EntityModelLayers.PLAYER),
                false
            );
        }
        return classicModel;
    }

    // -----------------------------------------------------------------------
    // Idle animation pose (movimientos de brazos/piernas y breathing también reducidos)
    // -----------------------------------------------------------------------

    private void prepareModelPose(PlayerEntityModel<?> model, float t, float lookX, float lookY) {
        resetPart(model.head);
        resetPart(model.hat);
        resetPart(model.body);
        resetPart(model.leftArm);
        resetPart(model.rightArm);
        resetPart(model.leftLeg);
        resetPart(model.rightLeg);
        resetPart(model.jacket);
        resetPart(model.leftSleeve);
        resetPart(model.rightSleeve);
        resetPart(model.leftPants);
        resetPart(model.rightPants);

        model.setVisible(true);
        model.child   = false;
        model.riding  = false;
        model.sneaking = false;
        model.handSwingProgress = 0.0f;

        model.hat.visible         = true;
        model.jacket.visible      = true;
        model.leftSleeve.visible  = true;
        model.rightSleeve.visible = true;
        model.leftPants.visible   = true;
        model.rightPants.visible  = true;

        // Breathing and torso movements reduced to almost nothing
        float breathBob  = MathHelper.sin(t * 1.7f) * 0.008f;   // was 0.015f
        float torsoYaw   = MathHelper.sin(t * 0.48f) * 0.04f;   // was 0.10f

        // Head follow mouse – clamped harder so it doesn't tilt too far up
        float headYaw    = MathHelper.sin(t * 0.82f) * 0.06f - lookX * 0.35f;
        float headPitch  = -0.12f + MathHelper.sin(t * 0.63f) * 0.02f + lookY * 0.11f;

        // Arm and leg movement almost removed
        float armSwing   = MathHelper.sin(t * 1.12f) * 0.03f;   // was 0.08f

        model.body.yaw    = torsoYaw;
        model.body.pivotY += breathBob * 6.0f;

        model.head.yaw    = MathHelper.clamp(headYaw - torsoYaw, -0.85f, 0.85f);
        model.head.pitch  = MathHelper.clamp(headPitch, -0.45f, 0.45f);
        model.head.pivotY += breathBob * 4.0f;

        model.rightArm.pitch = armSwing  + breathBob;
        model.leftArm.pitch  = -armSwing + breathBob;
        model.rightArm.roll  =  0.04f;
        model.leftArm.roll   = -0.04f;
        model.rightArm.yaw   = torsoYaw * 0.35f;
        model.leftArm.yaw    = torsoYaw * 0.35f;

        model.rightLeg.pitch = -breathBob * 1.0f;   // was 1.5f
        model.leftLeg.pitch  =  breathBob * 1.0f;

        model.hat.copyTransform(model.head);
        model.jacket.copyTransform(model.body);
        model.leftSleeve.copyTransform(model.leftArm);
        model.rightSleeve.copyTransform(model.rightArm);
        model.leftPants.copyTransform(model.leftLeg);
        model.rightPants.copyTransform(model.rightLeg);
    }

    private static void resetPart(net.minecraft.client.model.ModelPart part) {
        if (part == null) return;
        part.visible = true;
        part.hidden  = false;
        part.resetTransform();
    }

    // -----------------------------------------------------------------------
    // EntityRenderDispatcher path (sin cambios)
    // -----------------------------------------------------------------------

    @SuppressWarnings("unused")
    private static void renderViaDispatcher(DrawContext context, int x, int y,
                                            int size, net.minecraft.entity.LivingEntity entity) {
        MatrixStack matrices = context.getMatrices();
        matrices.push();
        matrices.translate(x, y, 50.0);
        matrices.multiplyPositionMatrix(new org.joml.Matrix4f().scaling(size, size, -size));
        matrices.multiply(new Quaternionf().rotateZ((float) Math.PI));

        RenderSystem.setShaderLights(LIGHT_0, LIGHT_1);

        EntityRenderDispatcher dispatcher = MinecraftClient.getInstance().getEntityRenderDispatcher();
        dispatcher.setRenderShadows(false);

        VertexConsumerProvider.Immediate buffers =
            MinecraftClient.getInstance().getBufferBuilders().getEntityVertexConsumers();

        RenderSystem.runAsFancy(() ->
            dispatcher.render(entity, 0, 0, 0, 0, 1, matrices, buffers,
                LightmapTextureManager.MAX_LIGHT_COORDINATE));

        context.draw();
        dispatcher.setRenderShadows(true);
        matrices.pop();
        DiffuseLighting.enableGuiDepthLighting();
    }

    // -----------------------------------------------------------------------
    // FakeClientPlayer helper (sin cambios)
    // -----------------------------------------------------------------------

    public static final class FakeClientPlayer
            extends net.minecraft.client.network.AbstractClientPlayerEntity {

        private Identifier skinId;
        private boolean slim;

        public FakeClientPlayer(MinecraftClient client,
                                com.mojang.authlib.GameProfile profile,
                                Identifier skinId,
                                boolean slim) {
            super(client.world, profile);
            this.skinId = skinId;
            this.slim   = slim;
        }

        @Override public boolean hasSkinTexture()  { return skinId != null; }
        @Override public Identifier getSkinTexture() {
            return skinId != null ? skinId : super.getSkinTexture();
        }
        @Override public String getModel() {
            return slim ? "slim" : "default";
        }
        @Override public boolean isPartVisible(PlayerModelPart part) { return true; }
        @Override protected net.minecraft.client.network.PlayerListEntry getPlayerListEntry() {
            return null;
        }
        @Override public boolean isSpectator() { return false; }
        @Override public boolean isCreative()  { return false; }
    }
}

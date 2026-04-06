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

    // Shader lights matching DiffuseLighting.method_34742() exactly (vanilla inventory lighting).
    // NOTE: Y must be +1.0f to match vanilla — using -1.0f causes exaggerated brightness
    // fluctuation as model parts rotate, because the dot-product with part normals swings
    // in the wrong direction relative to the Z-negated transform.
    private static final Vector3f LIGHT_0 = new Vector3f( 0.2f,  1.0f,  1.0f).normalize();
    private static final Vector3f LIGHT_1 = new Vector3f(-0.2f,  1.0f,  0.0f).normalize();

    // -----------------------------------------------------------------------
    // State
    // -----------------------------------------------------------------------

    private final MinecraftClient client;

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
     *
     * <p>Transform chain (differs from InventoryScreen because we skip the entity renderer):
     * <pre>
     *   translate(anchorX, anchorY, 100)
     *   scale(size, size, -size)         // correct scale; negate Z for normals
     *   rotateY(π)                       // face player towards camera
     *   rotateY(swayYaw) · rotateX(tilt) // idle animation
     *   PlayerEntityModel.render(…)
     * </pre>
     *
     * <p>NOTE: we do NOT use {@code rotateZ(π)} here.  That rotation exists in
     * {@code InventoryScreen.drawEntity()} to cancel {@code LivingEntityRenderer}'s
     * internal {@code scale(-1,-1,1)}.  Since we bypass the entity renderer entirely,
     * including rotateZ(π) would flip Y and render the player upside-down.
     *
     * <p>We skip the EntityRenderDispatcher because constructing a
     * {@code ClientPlayerEntity} requires a non-null {@code ClientWorld}
     * (the constructor calls {@code world.getSpawnPos()}),
     * and the world is {@code null} before any world has been joined.
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
        // "size" maps model-space units to screen pixels.
        // Drive size from the available height and let the player occupy most of
        // the stage. The old 32-unit assumption made the character absurdly small.
        float size = (height / MODEL_HEIGHT_UNITS) * 0.46f;

        // Keep the body visually centered with a slight bias downward so the feet
        // sit closer to the lower edge of the panel, similar to a launcher hero pose.
        float anchorX = x + width  * 0.5f;
        float anchorY = y + height * 0.53f;

        // Z depth – 100 keeps the model in front of most GUI elements without
        // clipping against the far plane (vanilla uses 50 for drawEntity).
        float anchorZ = 100.0f;

        // ------------------------------------------------------------------
        // 2. Animation
        // ------------------------------------------------------------------
        float timeSeconds = (float)(Util.getMeasuringTimeMs() / 1000.0) + delta * 0.05f;
        float lookX = MathHelper.clamp((mouseX - (x + width * 0.5f)) / (width * 0.5f), -1.0f, 1.0f);
        float lookY = MathHelper.clamp((mouseY - (y + height * 0.34f)) / (height * 0.5f), -1.0f, 1.0f);
        prepareModelPose(model, timeSeconds, lookX, lookY);

        // Idle sway: gentle yaw oscillation ± 10°, slight forward tilt 6°.
        float swayYaw   = MathHelper.sin(timeSeconds * 0.38f) * 10.0f;
        float swayPitch = 6.0f + MathHelper.sin(timeSeconds * 0.55f) * 1.5f;

        // ------------------------------------------------------------------
        // 3. Transform stack
        //
        // Direct-model path (no EntityRenderDispatcher / LivingEntityRenderer):
        //
        //   translate → scale(size, size, -size) → rotateY(π) → rotateY(sway) → rotateX(tilt)
        //
        // WHY no rotateZ(π)?
        //   vanilla drawEntity uses rotateZ(π) because LivingEntityRenderer.setupTransforms()
        //   applies an internal scale(-1,-1,1) that flips the model; the rotateZ cancels it.
        //   Here we skip the entity renderer entirely, so we must NOT include rotateZ(π) —
        //   doing so would negate Y and render the player upside-down.
        //
        // WHY no rotateY(π)?
        //   Steve's face texture is on the +Z face of the head cube.  scale(s, s, -s) maps
        //   model +Z → screen -Z = towards the viewer, so the front is already visible.
        //   Adding rotateY(π) would move the face to -Z, then scale would put it at +Z
        //   (away from viewer) — that's what causes the "showing back" bug.
        // ------------------------------------------------------------------
        MatrixStack matrices = context.getMatrices();
        matrices.push();

        matrices.translate(anchorX, anchorY, anchorZ);
        matrices.scale(size, size, -size);

        // In Minecraft's GUI, Z+ points INTO the screen (away from viewer).
        // scale(s, s, -s) negates Z, so model's +Z face (Steve's front/face texture)
        // maps to screen -Z = towards viewer → front is already visible, no Y-flip needed.
        Quaternionf rotation = new Quaternionf()
            .rotateY(swayYaw   * (float)(Math.PI / 180.0))       // idle yaw sway
            .rotateX(swayPitch * (float)(Math.PI / 180.0));      // slight forward tilt
        matrices.multiply(rotation);

        // ------------------------------------------------------------------
        // 4. GL state: depth, blend, shader lights
        // ------------------------------------------------------------------
        RenderSystem.enableDepthTest();
        RenderSystem.enableBlend();
        RenderSystem.disableCull();
        // Shader lights from DiffuseLighting.method_34742() – these point "towards
        // the viewer" when Z is negated, matching the inventory screen appearance.
        RenderSystem.setShaderLights(LIGHT_0, LIGHT_1);
        context.setShaderColor(1.0f, 1.0f, 1.0f, 1.0f);

        // ------------------------------------------------------------------
        // 5. Render via VertexConsumerProvider (batched, supports translucency)
        // ------------------------------------------------------------------
        VertexConsumerProvider.Immediate buffers =
            client.getBufferBuilders().getEntityVertexConsumers();

        // Skins are cutout textures, not true translucency. Using a cutout layer
        // avoids random depth-sorting shimmer on certain skin pixels.
        net.minecraft.client.render.RenderLayer renderLayer =
            net.minecraft.client.render.RenderLayer.getEntityCutoutNoCull(skin);

        model.render(
            matrices,
            buffers.getBuffer(renderLayer),
            LightmapTextureManager.MAX_LIGHT_COORDINATE,
            net.minecraft.client.render.OverlayTexture.DEFAULT_UV,
            1.0f, 1.0f, 1.0f, 1.0f
        );

        // Flush all pending geometry immediately.
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
    // Idle animation pose
    // -----------------------------------------------------------------------

    /**
     * Resets and then applies a gentle idle-breathing / swaying pose to
     * {@code model}.  All secondary-layer parts mirror their base parts.
     *
     * @param model       the model to animate
     * @param t           time in seconds (use {@code Util.getMeasuringTimeMs() / 1000.0})
     */
    private void prepareModelPose(PlayerEntityModel<?> model, float t, float lookX, float lookY) {
        // Reset all parts first so nothing is left in a previous frame's state.
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

        // Ensure all skin layer parts are visible (PlayerModelPart flags are not
        // accessible here without an entity, so we force them on).
        model.hat.visible         = true;
        model.jacket.visible      = true;
        model.leftSleeve.visible  = true;
        model.rightSleeve.visible = true;
        model.leftPants.visible   = true;
        model.rightPants.visible  = true;

        // Breathing bob (moves the whole torso up/down slightly).
        float breathBob  = MathHelper.sin(t * 1.7f) * 0.015f;
        // Torso yaw sway.
        float torsoYaw   = MathHelper.sin(t * 0.48f) * 0.10f;
        // Head look-around.
        float headYaw    = MathHelper.sin(t * 0.82f) * 0.12f - lookX * 0.35f;
        float headPitch  = -0.08f + MathHelper.sin(t * 0.63f) * 0.03f + lookY * 0.14f;
        // Arm pendulum.
        float armSwing   = MathHelper.sin(t * 1.12f) * 0.08f;

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

        model.rightLeg.pitch = -breathBob * 1.5f;
        model.leftLeg.pitch  =  breathBob * 1.5f;

        // Mirror secondary-layer parts onto their base counterparts.
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
    // EntityRenderDispatcher path (bonus: used when world IS available)
    // -----------------------------------------------------------------------

    /**
     * Renders the player using the full {@code EntityRenderDispatcher} pipeline.
     * Identical in result to {@code InventoryScreen.drawEntity()} but callable
     * from outside an inventory screen.
     *
     * <p>This path is NOT currently invoked by {@link #render} because constructing
     * a {@code ClientPlayerEntity} requires a non-null {@code ClientWorld}, which is
     * unavailable on the title screen.  It is included here for reference and
     * future in-game use.
     *
     * <p><b>Usage (when client.world != null):</b>
     * <pre>{@code
     *   FakeClientPlayer fake = new FakeClientPlayer(client, profile, skinId, slimArms);
     *   renderViaDispatcher(context, centerX, footY, scalePx, fake);
     * }</pre>
     */
    @SuppressWarnings("unused")
    private static void renderViaDispatcher(DrawContext context, int x, int y,
                                            int size, net.minecraft.entity.LivingEntity entity) {
        MatrixStack matrices = context.getMatrices();
        matrices.push();
        matrices.translate(x, y, 50.0);
        matrices.multiplyPositionMatrix(new org.joml.Matrix4f().scaling(size, size, -size));
        // rotateZ(π) cancels LivingEntityRenderer's internal scale(-1,-1,1), keeping model upright.
        matrices.multiply(new Quaternionf().rotateZ((float) Math.PI));

        // Shader lights for inventory-style rendering.
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
    // FakeClientPlayer helper (for in-game use, requires non-null world)
    // -----------------------------------------------------------------------

    /**
     * A lightweight {@code AbstractClientPlayerEntity} subclass that does not tick,
     * has no network handler side-effects, and overrides skin texture lookup so it
     * can display an arbitrary pre-loaded skin.
     *
     * <p><b>Requires {@code client.world != null}.</b>  Do not construct on the
     * title screen before a world is loaded.
     *
     * <h3>Skin in Minecraft 1.20.1 (Yarn mappings)</h3>
     * <p>To obtain the actual skin texture identifier and arm model for the local
     * player <em>before</em> joining a world, use:
     * <pre>{@code
     *   client.getSkinProvider().loadSkin(
     *       client.getSession().getProfile(),
     *       (MinecraftProfileTexture.Type type, Identifier id, MinecraftProfileTexture tex) -> {
     *           if (type == MinecraftProfileTexture.Type.SKIN) {
     *               Identifier skinId  = id;
     *               boolean    isSlim  = "slim".equalsIgnoreCase(tex.getMetadata("model"));
     *           }
     *       },
     *       false   // pass 'true' to force re-fetch from Mojang servers
     *   );
     * }</pre>
     * <p>This is the correct 1.20.1 API.  {@code PlayerSkin} and
     * {@code SkinTextures} do not exist until 1.20.4.
     */
    public static final class FakeClientPlayer
            extends net.minecraft.client.network.AbstractClientPlayerEntity {

        private Identifier skinId;
        private boolean slim;

        /**
         * @param client   the MinecraftClient instance
         * @param profile  the game profile (must include UUID for default skin lookup)
         * @param skinId   pre-loaded skin texture identifier (may be null; falls back to default)
         * @param slim     true for Alex/slim arm variant
         */
        public FakeClientPlayer(MinecraftClient client,
                                com.mojang.authlib.GameProfile profile,
                                Identifier skinId,
                                boolean slim) {
            // AbstractClientPlayerEntity calls world.getSpawnPos() in its constructor.
            // Therefore client.world MUST be non-null at this point.
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

package com.mclaunch.home.screen;

import net.minecraft.client.render.entity.model.PlayerEntityModel;
import net.minecraft.util.math.MathHelper;

final class AnimationPlayer {

    private static final float SHOWCASE_CYCLE_SECONDS = 36.0f; // más largo = más elegante y natural
    private static final float SEGMENT_SECONDS = SHOWCASE_CYCLE_SECONDS / AnimationType.values().length;

    private AnimationPlayer() {}

    static void apply(PlayerEntityModel<?> model, float t, float lookX, float lookY) {
        resetModel(model);
        applyBasePose(model, t, lookX, lookY);     // idle base muy fluido
        applyShowcaseAnimation(model, t);          // showcase con transiciones suaves
        syncWearLayers(model);
    }

    private static void applyBasePose(PlayerEntityModel<?> model, float t, float lookX, float lookY) {
        // Idle orgánico con múltiples capas de movimiento (más natural que antes)
        float breath = MathHelper.sin(t * 1.35f) * 0.009f + MathHelper.sin(t * 3.8f) * 0.003f;
        float weightShift = MathHelper.sin(t * 0.42f) * 0.035f;           // sutil balanceo de peso
        float microSway = MathHelper.sin(t * 0.95f) * 0.018f;

        float torsoYaw   = weightShift * 0.6f;
        float torsoPitch = breath * 8.0f;

        float headYaw   = MathHelper.sin(t * 0.75f) * 0.055f - lookX * 0.38f + microSway * 0.4f;
        float headPitch = -0.11f + MathHelper.sin(t * 0.58f) * 0.025f + lookY * 0.13f;

        float armMicro = MathHelper.sin(t * 1.65f) * 0.022f;

        // Aplicar base
        model.body.yaw = torsoYaw;
        model.body.pitch = torsoPitch * 0.3f;
        model.body.pivotY += breath * 5.5f;

        model.head.yaw = MathHelper.clamp(headYaw - torsoYaw * 0.7f, -0.9f, 0.9f);
        model.head.pitch = MathHelper.clamp(headPitch, -0.48f, 0.48f);
        model.head.pivotY += breath * 3.8f;

        // Brazos con micro-movimiento natural
        model.rightArm.pitch = armMicro + breath * 2.5f;
        model.leftArm.pitch  = -armMicro + breath * 2.5f;
        model.rightArm.roll  = 0.035f + weightShift * 0.8f;
        model.leftArm.roll   = -0.035f - weightShift * 0.8f;
        model.rightArm.yaw   = torsoYaw * 0.4f;
        model.leftArm.yaw    = torsoYaw * 0.4f;

        // Piernas con weight shift
        model.rightLeg.pitch = -breath * 1.8f - weightShift * 1.2f;
        model.leftLeg.pitch  =  breath * 1.8f + weightShift * 1.2f;
        model.rightLeg.roll  = weightShift * 0.6f;
        model.leftLeg.roll   = -weightShift * 0.6f;
    }

    private static void applyShowcaseAnimation(PlayerEntityModel<?> model, float t) {
        float cycleTime = positiveModulo(t, SHOWCASE_CYCLE_SECONDS);
        int segmentIndex = Math.min((int) (cycleTime / SEGMENT_SECONDS), AnimationType.values().length - 1);
        float segmentTime = cycleTime - segmentIndex * SEGMENT_SECONDS;
        float progress = segmentTime / SEGMENT_SECONDS;

        float weight = segmentEnvelope(progress);
        if (weight <= 0.0f) return;

        AnimationType.values()[segmentIndex].apply(model, t, weight);
    }

    private static float segmentEnvelope(float progress) {
        // Transición mucho más suave y cinematográfica
        float attack = smoothstep(MathHelper.clamp(progress / 0.22f, 0.0f, 1.0f));
        float release = smoothstep(MathHelper.clamp((1.0f - progress) / 0.25f, 0.0f, 1.0f));
        return attack * release * 0.96f;
    }

    private static void syncWearLayers(PlayerEntityModel<?> model) {
        model.hat.copyTransform(model.head);
        model.jacket.copyTransform(model.body);
        model.leftSleeve.copyTransform(model.leftArm);
        model.rightSleeve.copyTransform(model.rightArm);
        model.leftPants.copyTransform(model.leftLeg);
        model.rightPants.copyTransform(model.rightLeg);
    }

    private static void resetModel(PlayerEntityModel<?> model) {
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
        model.child = false;
        model.riding = false;
        model.sneaking = false;
        model.handSwingProgress = 0.0f;

        model.hat.visible = true;
        model.jacket.visible = true;
        model.leftSleeve.visible = true;
        model.rightSleeve.visible = true;
        model.leftPants.visible = true;
        model.rightPants.visible = true;
    }

    private static void resetPart(net.minecraft.client.model.ModelPart part) {
        if (part == null) return;
        part.visible = true;
        part.hidden = false;
        part.resetTransform();
    }

    private static float smoothstep(float x) {
        float clamped = MathHelper.clamp(x, 0.0f, 1.0f);
        return clamped * clamped * (3.0f - 2.0f * clamped);
    }

    private static float positiveModulo(float value, float divisor) {
        float result = value % divisor;
        return result < 0.0f ? result + divisor : result;
    }

    private enum AnimationType {
        WAVE {
            @Override
            void apply(PlayerEntityModel<?> model, float t, float weight) {
                float wave = MathHelper.sin(t * 14.0f) * 0.18f * weight;
                float waveSlow = MathHelper.sin(t * 4.2f) * 0.07f * weight;

                // Brazo derecho levantado con codo doblado (más natural)
                model.rightArm.pitch = -1.85f * weight + wave * 0.25f;
                model.rightArm.yaw   = -0.65f * weight;
                model.rightArm.roll  = -0.95f * weight + waveSlow * 1.1f;

                // Ligero movimiento de cabeza hacia la mano
                model.head.yaw += 0.22f * weight;
                model.head.roll += wave * 0.045f;

                // Pecho sutilmente hacia adelante
                model.body.pitch += -0.09f * weight;
            }
        },

        SALUTE {
            @Override
            void apply(PlayerEntityModel<?> model, float t, float weight) {
                float pulse = MathHelper.sin(t * 7.5f) * 0.035f * weight;

                model.rightArm.pitch = -2.45f * weight + pulse;
                model.rightArm.yaw   = -1.05f * weight;
                model.rightArm.roll  = -1.35f * weight + pulse * 0.8f;

                // Cabeza mirando ligeramente hacia el saludo
                model.head.yaw += 0.18f * weight;
                model.head.pitch += -0.09f * weight;
            }
        },

        OPEN_ARMS {
            @Override
            void apply(PlayerEntityModel<?> model, float t, float weight) {
                float sway = MathHelper.sin(t * 3.1f) * 0.12f * weight;

                model.rightArm.pitch = -1.05f * weight + sway;
                model.leftArm.pitch  = -1.05f * weight - sway;
                model.rightArm.roll  = -0.92f * weight;
                model.leftArm.roll   =  0.92f * weight;
                model.rightArm.yaw   = -0.55f * weight;
                model.leftArm.yaw    =  0.55f * weight;

                model.body.yaw += sway * 0.4f;
                model.body.pitch += -0.07f * weight;
            }
        },

        HERO {
            @Override
            void apply(PlayerEntityModel<?> model, float t, float weight) {
                float chestBob = MathHelper.sin(t * 2.8f) * 0.028f * weight;

                model.body.pitch = -0.18f * weight;
                model.body.pivotY += -2.1f * weight + chestBob * 12.0f;

                model.head.pitch += -0.12f * weight + chestBob * 2.5f;

                // Pose heroica clásica (brazos atrás)
                model.rightArm.pitch = -0.75f * weight;
                model.rightArm.roll  = -0.85f * weight;
                model.leftArm.pitch  = -0.75f * weight;
                model.leftArm.roll   =  0.85f * weight;

                // Piernas ligeramente separadas
                model.rightLeg.roll = -0.18f * weight;
                model.leftLeg.roll  =  0.18f * weight;
            }
        };

        abstract void apply(PlayerEntityModel<?> model, float t, float weight);
    }
}
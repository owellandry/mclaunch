package com.mclaunch.home.mixin.client;

import com.mclaunch.home.render.LauncherCapeFeatureRenderer;
import net.fabricmc.api.EnvType;
import net.fabricmc.api.Environment;
import net.minecraft.client.render.entity.EntityRendererFactory;
import net.minecraft.client.render.entity.PlayerEntityRenderer;
import org.spongepowered.asm.mixin.Mixin;
import org.spongepowered.asm.mixin.injection.At;
import org.spongepowered.asm.mixin.injection.Inject;
import org.spongepowered.asm.mixin.injection.callback.CallbackInfo;

/**
 * Añade el render de la capa exclusiva de MC Launch al jugador.
 */
@Environment(EnvType.CLIENT)
@Mixin(PlayerEntityRenderer.class)
public abstract class PlayerEntityRendererMixin {

    @SuppressWarnings({"unchecked", "rawtypes"})
    @Inject(method = "<init>(Lnet/minecraft/client/render/entity/EntityRendererFactory$Context;Z)V", at = @At("RETURN"))
    private void mclaunch$addCapeLayer(EntityRendererFactory.Context ctx, boolean slim, CallbackInfo ci) {
        PlayerEntityRenderer renderer = (PlayerEntityRenderer) (Object) this;
        LivingEntityRendererInvoker invoker = (LivingEntityRendererInvoker) renderer;
        invoker.invokeAddFeature(new LauncherCapeFeatureRenderer(renderer));
    }
}

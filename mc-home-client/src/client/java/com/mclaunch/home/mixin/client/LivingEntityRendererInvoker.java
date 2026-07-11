package com.mclaunch.home.mixin.client;

import net.fabricmc.api.EnvType;
import net.fabricmc.api.Environment;
import net.minecraft.client.render.entity.LivingEntityRenderer;
import net.minecraft.client.render.entity.feature.FeatureRenderer;
import org.spongepowered.asm.mixin.Mixin;
import org.spongepowered.asm.mixin.gen.Invoker;

@Environment(EnvType.CLIENT)
@Mixin(LivingEntityRenderer.class)
public interface LivingEntityRendererInvoker {
    @Invoker("addFeature")
    boolean invokeAddFeature(FeatureRenderer feature);
}

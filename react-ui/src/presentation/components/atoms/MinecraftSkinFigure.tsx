/**
 * @file MinecraftSkinFigure.tsx
 * @description Componente atómico MinecraftSkinFigure. Renderiza el cuerpo completo 3D de una skin de Minecraft.
 *
 * Patrón: Atomic Design
 */
import { memo, useDeferredValue, useEffect, useMemo, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";

type MinecraftSkinFigureProps = {
  textureUrl?: string | null;
  capeUrl?: string | null;
  className?: string;
  pixelSize?: number;
};

type TextureInfo = {
  width: number;
  height: number;
};

type Slice = {
  x: number;
  y: number;
  width: number;
  height: number;
};

type FaceMap = {
  front: Slice;
  back: Slice;
  left: Slice;
  right: Slice;
  top: Slice;
  bottom: Slice;
};

type CuboidProps = {
  dimensions: { width: number; height: number; depth: number };
  faces: FaceMap;
  textureUrl: string;
  textureInfo: TextureInfo;
  pixelSize: number;
  inflate?: number;
};

type LimbProps = {
  pivot: { x: number; y: number; z: number };
  dimensions: { width: number; height: number; depth: number };
  faces: FaceMap;
  overlayFaces?: FaceMap | null;
  textureUrl: string;
  textureInfo: TextureInfo;
  pixelSize: number;
  animationName: string;
};

const textureInfoCache = new Map<string, TextureInfo | null>();

function toPixels(value: number, pixelSize: number): number {
  return value * pixelSize;
}

function faceBackgroundStyle(slice: Slice, textureUrl: string, textureInfo: TextureInfo, pixelSize: number) {
  return {
    backgroundImage: `url("${textureUrl}")`,
    backgroundRepeat: "no-repeat",
    backgroundSize: `${textureInfo.width * pixelSize}px ${textureInfo.height * pixelSize}px`,
    backgroundPosition: `-${slice.x * pixelSize}px -${slice.y * pixelSize}px`,
    imageRendering: "pixelated" as const,
  };
}

function makeHeadMap(baseX: number, baseY: number): FaceMap {
  return {
    right: { x: baseX, y: baseY + 8, width: 8, height: 8 },
    front: { x: baseX + 8, y: baseY + 8, width: 8, height: 8 },
    left: { x: baseX + 16, y: baseY + 8, width: 8, height: 8 },
    back: { x: baseX + 24, y: baseY + 8, width: 8, height: 8 },
    top: { x: baseX + 8, y: baseY, width: 8, height: 8 },
    bottom: { x: baseX + 16, y: baseY, width: 8, height: 8 },
  };
}

function makeBodyMap(baseX: number, baseY: number): FaceMap {
  return {
    right: { x: baseX, y: baseY + 4, width: 4, height: 12 },
    front: { x: baseX + 4, y: baseY + 4, width: 8, height: 12 },
    left: { x: baseX + 12, y: baseY + 4, width: 4, height: 12 },
    back: { x: baseX + 16, y: baseY + 4, width: 8, height: 12 },
    top: { x: baseX + 4, y: baseY, width: 8, height: 4 },
    bottom: { x: baseX + 12, y: baseY, width: 8, height: 4 },
  };
}

function makeLimbMap(baseX: number, baseY: number): FaceMap {
  return {
    right: { x: baseX, y: baseY + 4, width: 4, height: 12 },
    front: { x: baseX + 4, y: baseY + 4, width: 4, height: 12 },
    left: { x: baseX + 8, y: baseY + 4, width: 4, height: 12 },
    back: { x: baseX + 12, y: baseY + 4, width: 4, height: 12 },
    top: { x: baseX + 4, y: baseY, width: 4, height: 4 },
    bottom: { x: baseX + 8, y: baseY, width: 4, height: 4 },
  };
}

const CAPE_WIDTH = 10;
const CAPE_HEIGHT = 16;
const CAPE_DEPTH = 1;
const CAPE_THICKNESS = 1;

function makeCapeMap(): FaceMap {
  const backX = 1;
  const backY = 1;
  return {
    front:  { x: 13, y: backY, width: CAPE_WIDTH, height: CAPE_HEIGHT },
    back:   { x: backX, y: backY, width: CAPE_WIDTH, height: CAPE_HEIGHT },
    left:   { x: backX, y: backY, width: CAPE_THICKNESS, height: CAPE_HEIGHT },
    right:  { x: backX + CAPE_WIDTH - CAPE_THICKNESS, y: backY, width: CAPE_THICKNESS, height: CAPE_HEIGHT },
    top:    { x: backX, y: backY, width: CAPE_WIDTH, height: CAPE_THICKNESS },
    bottom: { x: backX, y: backY + CAPE_HEIGHT - CAPE_THICKNESS, width: CAPE_WIDTH, height: CAPE_THICKNESS },
  };
}

function getSkinMaps(isLegacySkin: boolean) {
  const rightArm = makeLimbMap(40, 16);
  const rightArmOverlay = makeLimbMap(40, 32);
  const rightLeg = makeLimbMap(0, 16);
  const rightLegOverlay = makeLimbMap(0, 32);

  return {
    head: makeHeadMap(0, 0),
    headOverlay: makeHeadMap(32, 0),
    body: makeBodyMap(16, 16),
    bodyOverlay: makeBodyMap(16, 32),
    rightArm,
    rightArmOverlay,
    leftArm: isLegacySkin ? rightArm : makeLimbMap(32, 48),
    leftArmOverlay: isLegacySkin ? rightArmOverlay : makeLimbMap(48, 48),
    rightLeg,
    rightLegOverlay,
    leftLeg: isLegacySkin ? rightLeg : makeLimbMap(16, 48),
    leftLegOverlay: isLegacySkin ? rightLegOverlay : makeLimbMap(0, 48),
  };
}

function Cuboid({
  dimensions,
  faces,
  textureUrl,
  textureInfo,
  pixelSize,
  inflate = 0,
}: CuboidProps) {
  const width = toPixels(dimensions.width + inflate, pixelSize);
  const height = toPixels(dimensions.height + inflate, pixelSize);
  const depth = toPixels(dimensions.depth + inflate, pixelSize);
  const halfWidth = width / 2;
  const halfHeight = height / 2;
  const halfDepth = depth / 2;

  const faceStyles = [
    { key: "front", slice: faces.front, width, height, transform: `rotateY(0deg) translateZ(${halfDepth}px)` },
    { key: "back", slice: faces.back, width, height, transform: `rotateY(180deg) translateZ(${halfDepth}px)` },
    { key: "left", slice: faces.left, width: depth, height, transform: `rotateY(90deg) translateZ(${halfWidth}px)` },
    { key: "right", slice: faces.right, width: depth, height, transform: `rotateY(-90deg) translateZ(${halfWidth}px)` },
    { key: "top", slice: faces.top, width, height: depth, transform: `rotateX(90deg) translateZ(${halfHeight}px)` },
    { key: "bottom", slice: faces.bottom, width, height: depth, transform: `rotateX(-90deg) translateZ(${halfHeight}px)` },
  ];

  return (
    <div className="absolute left-1/2 top-1/2" style={{ transformStyle: "preserve-3d" }}>
      {faceStyles.map((face) => (
        <div
          key={face.key}
          className="absolute left-1/2 top-1/2 overflow-hidden"
          style={{
            width: face.width,
            height: face.height,
            marginLeft: -face.width / 2,
            marginTop: -face.height / 2,
            transform: face.transform,
            backfaceVisibility: "hidden",
            ...faceBackgroundStyle(face.slice, textureUrl, textureInfo, pixelSize),
          }}
        />
      ))}
    </div>
  );
}

function Limb({
  pivot,
  dimensions,
  faces,
  overlayFaces,
  textureUrl,
  textureInfo,
  pixelSize,
  animationName,
}: LimbProps) {
  const halfH = toPixels(dimensions.height / 2, pixelSize);
  return (
    <div
      className="absolute left-1/2 top-1/2"
      style={{
        transformStyle: "preserve-3d",
        transform: `translate3d(${toPixels(pivot.x, pixelSize)}px, ${toPixels(pivot.y, pixelSize)}px, ${toPixels(pivot.z, pixelSize)}px)`,
      }}
    >
      <div
        className="skin-3d-limb"
        style={{
          transformStyle: "preserve-3d",
          animation: `${animationName} 1.2s ease-in-out infinite alternate`,
        }}
      >
        <div
          style={{
            transformStyle: "preserve-3d",
            transform: `translate3d(0px, ${halfH}px, 0px)`,
          }}
        >
          <Cuboid
            dimensions={dimensions}
            faces={faces}
            textureUrl={textureUrl}
            textureInfo={textureInfo}
            pixelSize={pixelSize}
          />
          {overlayFaces ? (
            <Cuboid
              dimensions={dimensions}
              faces={overlayFaces}
              textureUrl={textureUrl}
              textureInfo={textureInfo}
              pixelSize={pixelSize}
              inflate={0.65}
            />
          ) : null}
        </div>
      </div>
    </div>
  );
}

export const MinecraftSkinFigure = memo(function MinecraftSkinFigure({
  textureUrl,
  capeUrl,
  className = "",
  pixelSize = 8,
}: MinecraftSkinFigureProps) {
  const deferredTextureUrl = useDeferredValue(textureUrl);
  const deferredCapeUrl = useDeferredValue(capeUrl);
  const [textureInfo, setTextureInfo] = useState<TextureInfo | null>(() =>
    deferredTextureUrl ? textureInfoCache.get(deferredTextureUrl) ?? null : null
  );
  const [capeTextureInfo, setCapeTextureInfo] = useState<TextureInfo | null>(null);

  useEffect(() => {
    if (!deferredCapeUrl) { setCapeTextureInfo(null); return; }
    const img = new Image();
    img.onload = () => setCapeTextureInfo({ width: img.naturalWidth || 64, height: img.naturalHeight || 32 });
    img.onerror = () => setCapeTextureInfo(null);
    img.decoding = "async";
    img.src = deferredCapeUrl;
  }, [deferredCapeUrl]);

  const [rotation, setRotation] = useState({ x: -18, y: -32 });
  const [isDragging, setIsDragging] = useState(false);
  const dragState = useRef<{ x: number; y: number } | null>(null);
  const rotationRef = useRef(rotation);
  const frameRef = useRef<number | null>(null);
  const rotationGroupRef = useRef<HTMLDivElement | null>(null);

  const applyTransform = (rot: { x: number; y: number }) => {
    if (rotationGroupRef.current) {
      rotationGroupRef.current.style.transform =
        `translate3d(calc(-50% - 4px), -42%, 0px) rotateX(${rot.x}deg) rotateY(${rot.y}deg)`;
    }
  };

  useEffect(() => {
    rotationRef.current = rotation;
  }, [rotation]);

  useEffect(() => {
    if (!deferredTextureUrl) {
      setTextureInfo(null);
      return;
    }

    const cachedTextureInfo = textureInfoCache.get(deferredTextureUrl);
    if (cachedTextureInfo !== undefined) {
      setTextureInfo(cachedTextureInfo);
      return;
    }

    let isCancelled = false;
    const image = new Image();

    image.onload = () => {
      const nextTextureInfo = {
        width: image.naturalWidth || 64,
        height: image.naturalHeight || 64,
      };
      textureInfoCache.set(deferredTextureUrl, nextTextureInfo);
      if (!isCancelled) {
        setTextureInfo(nextTextureInfo);
      }
    };

    image.onerror = () => {
      textureInfoCache.set(deferredTextureUrl, null);
      if (!isCancelled) {
        setTextureInfo(null);
      }
    };

    image.decoding = "async";
    image.src = deferredTextureUrl;

    return () => {
      isCancelled = true;
    };
  }, [deferredTextureUrl]);

  useEffect(() => {
    if (!isDragging) return;

    const handlePointerMove = (event: PointerEvent) => {
      if (!dragState.current) return;

      const deltaX = event.clientX - dragState.current.x;
      const deltaY = event.clientY - dragState.current.y;
      dragState.current = { x: event.clientX, y: event.clientY };

      const nextRotation = {
        x: Math.max(-55, Math.min(35, rotationRef.current.x - deltaY * 0.35)),
        y: rotationRef.current.y + deltaX * 0.5,
      };
      rotationRef.current = nextRotation;

      if (frameRef.current !== null) return;

      frameRef.current = window.requestAnimationFrame(() => {
        frameRef.current = null;
        applyTransform(rotationRef.current);
      });
    };

    const stopDragging = () => {
      setIsDragging(false);
      dragState.current = null;
      if (frameRef.current !== null) {
        window.cancelAnimationFrame(frameRef.current);
        frameRef.current = null;
      }
      setRotation(rotationRef.current);
    };

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", stopDragging);
    window.addEventListener("pointercancel", stopDragging);

    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", stopDragging);
      window.removeEventListener("pointercancel", stopDragging);
      if (frameRef.current !== null) {
        window.cancelAnimationFrame(frameRef.current);
        frameRef.current = null;
      }
    };
  }, [isDragging]);

  const handlePointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    dragState.current = { x: event.clientX, y: event.clientY };
    setIsDragging(true);
  };

  const resetView = () => {
    const nextRotation = { x: -18, y: -32 };
    rotationRef.current = nextRotation;
    setRotation(nextRotation);
  };

  const skinMaps = useMemo(() => getSkinMaps(textureInfo?.height === 32), [textureInfo?.height]);
  const capeFaceMap = useMemo(() => makeCapeMap(), []);

  if (!deferredTextureUrl || !textureInfo) {
    return (
      <div
        className={`mc-cutout bg-surfaceLight/70 border border-white/5 flex items-center justify-center text-textMuted ${className}`}
        style={{ width: 30 * pixelSize, height: 42 * pixelSize }}
      >
        Skin no disponible
      </div>
    );
  }

  const p = pixelSize;

  return (
    <div
      className={`skin-3d-stage relative ${isDragging ? "is-dragging" : ""} ${className}`}
      style={{
        width: 30 * p,
        height: 42 * p,
      }}
      aria-label="Vista completa de la skin 3D"
      onPointerDown={handlePointerDown}
      onDoubleClick={resetView}
    >
      <div className="pointer-events-none absolute left-4 top-4 rounded-full bg-black/25 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.25em] text-white/80 backdrop-blur">
        Arrastra
      </div>
      <div
        ref={rotationGroupRef}
        className="absolute left-1/2 top-1/2"
        style={{
          transformStyle: "preserve-3d",
          willChange: "transform",
          transform: `translate3d(calc(-50% - 4px), -42%, 0px) rotateX(${rotation.x}deg) rotateY(${rotation.y}deg)`,
        }}
      >
        <div
          className="skin-3d-character"
          style={{
            position: "relative",
            width: 0,
            height: 0,
            transformStyle: "preserve-3d",
            animation: "skin-3d-bob 1.2s ease-in-out infinite alternate",
          }}
        >
          {/* Cabeza */}
          <div
            className="absolute left-1/2 top-1/2"
            style={{
              transformStyle: "preserve-3d",
              transform: `translate3d(0px, ${toPixels(-10, p)}px, 0px)`,
            }}
          >
            <Cuboid
              dimensions={{ width: 8, height: 8, depth: 8 }}
              faces={skinMaps.head}
              textureUrl={deferredTextureUrl}
              textureInfo={textureInfo}
              pixelSize={p}
            />
            <Cuboid
              dimensions={{ width: 8, height: 8, depth: 8 }}
              faces={skinMaps.headOverlay}
              textureUrl={deferredTextureUrl}
              textureInfo={textureInfo}
              pixelSize={p}
              inflate={0.75}
            />
          </div>

          {/* Torso + Capa */}
          <div
            className="absolute left-1/2 top-1/2"
            style={{
              transformStyle: "preserve-3d",
              transform: "translate3d(0px, 0px, 0px)",
            }}
          >
            {/* Capa — cuboide 3D con grosor real, pivotada en los hombros detrás del torso */}
            {deferredCapeUrl && capeTextureInfo ? (
              <div
                className="absolute left-1/2 top-1/2"
                style={{
                  transformStyle: "preserve-3d",
                  transform: `translate3d(0px, ${toPixels(-6, p)}px, ${toPixels(-(2 + CAPE_DEPTH / 2), p)}px)`,
                }}
              >
                <div
                  className="skin-3d-limb"
                  style={{
                    transformStyle: "preserve-3d",
                    transformOrigin: "50% 0%",
                    animation: "skin-3d-cape-sway 2.6s ease-in-out infinite alternate",
                  }}
                >
                  <div
                    style={{
                      transformStyle: "preserve-3d",
                      transform: `translate3d(0px, ${toPixels(CAPE_HEIGHT / 2, p)}px, 0px)`,
                    }}
                  >
                    <Cuboid
                      dimensions={{ width: CAPE_WIDTH, height: CAPE_HEIGHT, depth: CAPE_DEPTH }}
                      faces={capeFaceMap}
                      textureUrl={deferredCapeUrl}
                      textureInfo={capeTextureInfo}
                      pixelSize={p}
                    />
                  </div>
                </div>
              </div>
            ) : null}

            <Cuboid
              dimensions={{ width: 8, height: 12, depth: 4 }}
              faces={skinMaps.body}
              textureUrl={deferredTextureUrl}
              textureInfo={textureInfo}
              pixelSize={p}
            />
            <Cuboid
              dimensions={{ width: 8, height: 12, depth: 4 }}
              faces={skinMaps.bodyOverlay}
              textureUrl={deferredTextureUrl}
              textureInfo={textureInfo}
              pixelSize={p}
              inflate={0.7}
            />
          </div>

          {/* Brazos */}
          <Limb
            pivot={{ x: -6, y: -6, z: 0 }}
            dimensions={{ width: 4, height: 12, depth: 4 }}
            faces={skinMaps.rightArm}
            overlayFaces={skinMaps.rightArmOverlay}
            textureUrl={deferredTextureUrl}
            textureInfo={textureInfo}
            pixelSize={p}
            animationName="skin-3d-arm-right"
          />
          <Limb
            pivot={{ x: 6, y: -6, z: 0 }}
            dimensions={{ width: 4, height: 12, depth: 4 }}
            faces={skinMaps.leftArm}
            overlayFaces={skinMaps.leftArmOverlay}
            textureUrl={deferredTextureUrl}
            textureInfo={textureInfo}
            pixelSize={p}
            animationName="skin-3d-arm-left"
          />
          {/* Piernas */}
          <Limb
            pivot={{ x: -2, y: 6, z: 0 }}
            dimensions={{ width: 4, height: 12, depth: 4 }}
            faces={skinMaps.rightLeg}
            overlayFaces={skinMaps.rightLegOverlay}
            textureUrl={deferredTextureUrl}
            textureInfo={textureInfo}
            pixelSize={p}
            animationName="skin-3d-leg-right"
          />
          <Limb
            pivot={{ x: 2, y: 6, z: 0 }}
            dimensions={{ width: 4, height: 12, depth: 4 }}
            faces={skinMaps.leftLeg}
            overlayFaces={skinMaps.leftLegOverlay}
            textureUrl={deferredTextureUrl}
            textureInfo={textureInfo}
            pixelSize={p}
            animationName="skin-3d-leg-left"
          />
        </div>
      </div>
    </div>
  );
});

import { useEffect, useMemo, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";

type MinecraftSkinFigureProps = {
  textureUrl?: string | null;
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
    { key: "left", slice: faces.left, width: depth, height, transform: `rotateY(-90deg) translateZ(${halfWidth}px)` },
    { key: "right", slice: faces.right, width: depth, height, transform: `rotateY(90deg) translateZ(${halfWidth}px)` },
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
            transform: `translate3d(0px, ${toPixels(dimensions.height / 2, pixelSize)}px, 0px)`,
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

export function MinecraftSkinFigure({
  textureUrl,
  className = "",
  pixelSize = 8,
}: MinecraftSkinFigureProps) {
  const [textureInfo, setTextureInfo] = useState<TextureInfo | null>(null);
  const [rotation, setRotation] = useState({ x: -18, y: -32 });
  const [isDragging, setIsDragging] = useState(false);
  const dragState = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    if (!textureUrl) {
      setTextureInfo(null);
      return;
    }

    let isCancelled = false;
    const image = new Image();

    image.onload = () => {
      if (!isCancelled) {
        setTextureInfo({
          width: image.naturalWidth || 64,
          height: image.naturalHeight || 64,
        });
      }
    };

    image.onerror = () => {
      if (!isCancelled) {
        setTextureInfo(null);
      }
    };

    image.src = textureUrl;

    return () => {
      isCancelled = true;
    };
  }, [textureUrl]);

  useEffect(() => {
    if (!isDragging) {
      return;
    }

    const handlePointerMove = (event: PointerEvent) => {
      if (!dragState.current) {
        return;
      }

      const deltaX = event.clientX - dragState.current.x;
      const deltaY = event.clientY - dragState.current.y;
      dragState.current = { x: event.clientX, y: event.clientY };

      setRotation((current) => ({
        x: Math.max(-55, Math.min(35, current.x - deltaY * 0.35)),
        y: current.y + deltaX * 0.5,
      }));
    };

    const stopDragging = () => {
      setIsDragging(false);
      dragState.current = null;
    };

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", stopDragging);
    window.addEventListener("pointercancel", stopDragging);

    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", stopDragging);
      window.removeEventListener("pointercancel", stopDragging);
    };
  }, [isDragging]);

  const handlePointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    dragState.current = { x: event.clientX, y: event.clientY };
    setIsDragging(true);
  };

  const resetView = () => {
    setRotation({ x: -18, y: -32 });
  };

  const skinMaps = useMemo(() => getSkinMaps(textureInfo?.height === 32), [textureInfo?.height]);

  if (!textureUrl || !textureInfo) {
    return (
      <div
        className={`mc-cutout bg-surfaceLight/70 border border-black/5 flex items-center justify-center text-textMuted ${className}`}
        style={{ width: 30 * pixelSize, height: 42 * pixelSize }}
      >
        Skin no disponible
      </div>
    );
  }

  return (
    <div
      className={`skin-3d-stage relative ${isDragging ? "is-dragging" : ""} ${className}`}
      style={{
        width: 30 * pixelSize,
        height: 42 * pixelSize,
      }}
      aria-label="Vista completa de la skin 3D"
      onPointerDown={handlePointerDown}
      onDoubleClick={resetView}
    >
      <div className="pointer-events-none absolute left-4 top-4 rounded-full bg-black/25 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.25em] text-white/80 backdrop-blur">
        Arrastra
      </div>
      <div
        className="absolute left-1/2 top-1/2"
        style={{
          transformStyle: "preserve-3d",
          transform: `translate3d(-50%, -42%, 0px) rotateX(${rotation.x}deg) rotateY(${rotation.y}deg)`,
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
            <div
              className="absolute left-1/2 top-1/2"
              style={{
                transformStyle: "preserve-3d",
                transform: `translate3d(0px, ${toPixels(-10, pixelSize)}px, 0px)`,
              }}
            >
              <Cuboid
                dimensions={{ width: 8, height: 8, depth: 8 }}
                faces={skinMaps.head}
                textureUrl={textureUrl}
                textureInfo={textureInfo}
                pixelSize={pixelSize}
              />
              <Cuboid
                dimensions={{ width: 8, height: 8, depth: 8 }}
                faces={skinMaps.headOverlay}
                textureUrl={textureUrl}
                textureInfo={textureInfo}
                pixelSize={pixelSize}
                inflate={0.75}
              />
            </div>

            <div
              className="absolute left-1/2 top-1/2"
              style={{
                transformStyle: "preserve-3d",
                transform: "translate3d(0px, 0px, 0px)",
              }}
            >
              <Cuboid
                dimensions={{ width: 8, height: 12, depth: 4 }}
                faces={skinMaps.body}
                textureUrl={textureUrl}
                textureInfo={textureInfo}
                pixelSize={pixelSize}
              />
              <Cuboid
                dimensions={{ width: 8, height: 12, depth: 4 }}
                faces={skinMaps.bodyOverlay}
                textureUrl={textureUrl}
                textureInfo={textureInfo}
                pixelSize={pixelSize}
                inflate={0.7}
              />
            </div>

            <Limb
              pivot={{ x: -6, y: -6, z: 0 }}
              dimensions={{ width: 4, height: 12, depth: 4 }}
              faces={skinMaps.rightArm}
              overlayFaces={skinMaps.rightArmOverlay}
              textureUrl={textureUrl}
              textureInfo={textureInfo}
              pixelSize={pixelSize}
              animationName="skin-3d-arm-right"
            />
            <Limb
              pivot={{ x: 6, y: -6, z: 0 }}
              dimensions={{ width: 4, height: 12, depth: 4 }}
              faces={skinMaps.leftArm}
              overlayFaces={skinMaps.leftArmOverlay}
              textureUrl={textureUrl}
              textureInfo={textureInfo}
              pixelSize={pixelSize}
              animationName="skin-3d-arm-left"
            />
            <Limb
              pivot={{ x: -2, y: 6, z: 0 }}
              dimensions={{ width: 4, height: 12, depth: 4 }}
              faces={skinMaps.rightLeg}
              overlayFaces={skinMaps.rightLegOverlay}
              textureUrl={textureUrl}
              textureInfo={textureInfo}
              pixelSize={pixelSize}
              animationName="skin-3d-leg-right"
            />
            <Limb
              pivot={{ x: 2, y: 6, z: 0 }}
              dimensions={{ width: 4, height: 12, depth: 4 }}
              faces={skinMaps.leftLeg}
              overlayFaces={skinMaps.leftLegOverlay}
              textureUrl={textureUrl}
              textureInfo={textureInfo}
              pixelSize={pixelSize}
              animationName="skin-3d-leg-left"
            />
        </div>
      </div>
    </div>
  );
}

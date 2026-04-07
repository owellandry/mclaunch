import type { CSSProperties } from "react";

type SlimeAnimationMobProps = {
  size?: number;
  className?: string;
  transitionName?: string;
};

export function SlimeAnimationMob({
  size = 148,
  className = "",
  transitionName,
}: SlimeAnimationMobProps) {
  const style = {
    ["--slime-size" as string]: `${size}px`,
    ...(transitionName ? { viewTransitionName: transitionName } : {}),
  } as CSSProperties;

  return (
    <div className={`slime-mob-shell ${className}`} style={style}>
      <div className="slime">
        <div className="inner-layer inner-front" />
        <div className="inner-layer inner-right" />
        <div className="inner-layer inner-left" />
        <div className="inner-layer inner-back" />
        <div className="inner-layer inner-top" />
        <div className="inner-layer inner-bottom" />

        <div className="outer-layer outer-front" />
        <div className="outer-layer outer-right" />
        <div className="outer-layer outer-left" />
        <div className="outer-layer outer-back" />
        <div className="outer-layer outer-top" />
        <div className="outer-layer outer-bottom" />
      </div>
    </div>
  );
}

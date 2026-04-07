export const INSTALLER_SLIME_TRANSITION_NAME = "installer-slime-mob";

export function setTransitionDirection(direction: "forward" | "back"): void {
  document.documentElement.dataset.installerTransition = direction;
}

export function clearTransitionDirection(): void {
  delete document.documentElement.dataset.installerTransition;
}

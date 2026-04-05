import { flushSync } from "react-dom";

export const PLAYER_AVATAR_TRANSITION_NAME = "player-avatar";
export const PLAYER_PROFILE_CHIP_TRANSITION_NAME = "player-profile-chip";

type ViewTransitionDocument = Document & {
  startViewTransition?: (callback: () => void | Promise<void>) => unknown;
};

export function startViewTransition(action: () => void): void {
  const transitionDocument = document as ViewTransitionDocument;

  if (typeof transitionDocument.startViewTransition === "function") {
    transitionDocument.startViewTransition(() => {
      flushSync(action);
    });
    return;
  }

  action();
}

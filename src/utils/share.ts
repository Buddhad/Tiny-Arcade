// Cross-platform share helper.
// Native: React Native's built-in Share API.
// Web: navigator.share if available, else clipboard fallback.

import { Platform, Share } from "react-native";

export async function shareScore(opts: { game: string; line: string }): Promise<void> {
  const title = `My ${opts.game} score on Tiny Arcade`;
  const message = `${opts.line}\n\nPlay Tiny Arcade — 5 mini-games in one app.`;

  if (Platform.OS === "web") {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const nav: any = globalThis.navigator;
      if (nav?.share) {
        await nav.share({ title, text: message });
        return;
      }
      if (nav?.clipboard?.writeText) {
        await nav.clipboard.writeText(message);
        // eslint-disable-next-line no-alert
        if (typeof alert === "function") alert("Score copied to clipboard!");
        return;
      }
    } catch {
      // user canceled or share unsupported — silently ignore
    }
    return;
  }

  try {
    await Share.share({ title, message });
  } catch {
    // ignore
  }
}

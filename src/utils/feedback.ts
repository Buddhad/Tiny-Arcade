// Centralized haptic + sound feedback.
// Native: expo-haptics for tactile, expo-audio for sound (bundled WAV tones).
// Web: Web Audio API synth (no haptics).

import { createAudioPlayer, type AudioPlayer } from "expo-audio";
import * as Haptics from "expo-haptics";
import { Platform } from "react-native";

type Tone = "tap" | "move" | "win" | "lose" | "flip" | "pop";

// ───────── Web (synthesized via WebAudio) ─────────
const TONE_MAP: Record<Tone, { freq: number; durMs: number; type: OscillatorType }> = {
  tap: { freq: 440, durMs: 60, type: "triangle" },
  move: { freq: 520, durMs: 70, type: "square" },
  flip: { freq: 660, durMs: 90, type: "sine" },
  pop: { freq: 880, durMs: 80, type: "triangle" },
  win: { freq: 880, durMs: 220, type: "sine" },
  lose: { freq: 180, durMs: 260, type: "sawtooth" },
};

let webCtx: AudioContext | null = null;
function getWebCtx(): AudioContext | null {
  if (Platform.OS !== "web") return null;
  try {
    if (!webCtx) {
      const AC =
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (globalThis as any).AudioContext || (globalThis as any).webkitAudioContext;
      if (!AC) return null;
      webCtx = new AC();
    }
    return webCtx;
  } catch {
    return null;
  }
}

function playWebTone(tone: Tone) {
  const ctx = getWebCtx();
  if (!ctx) return;
  const { freq, durMs, type } = TONE_MAP[tone];
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  gain.gain.setValueAtTime(0.0001, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.18, ctx.currentTime + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + durMs / 1000);
  osc.connect(gain).connect(ctx.destination);
  osc.start();
  osc.stop(ctx.currentTime + durMs / 1000 + 0.02);
}

// ───────── Native (expo-audio with bundled WAVs) ─────────
let nativePlayers: Partial<Record<Tone, AudioPlayer>> | null = null;
let soundEnabled = true;

function getNativePlayer(tone: Tone): AudioPlayer | null {
  if (Platform.OS === "web") return null;
  if (!nativePlayers) {
    try {
      nativePlayers = {
        tap: createAudioPlayer(require("../../assets/sounds/tap.wav")),
        move: createAudioPlayer(require("../../assets/sounds/move.wav")),
        flip: createAudioPlayer(require("../../assets/sounds/flip.wav")),
        pop: createAudioPlayer(require("../../assets/sounds/pop.wav")),
        win: createAudioPlayer(require("../../assets/sounds/win.wav")),
        lose: createAudioPlayer(require("../../assets/sounds/lose.wav")),
      };
    } catch {
      nativePlayers = {};
    }
  }
  return nativePlayers[tone] ?? null;
}

function playNativeTone(tone: Tone) {
  if (!soundEnabled) return;
  const player = getNativePlayer(tone);
  if (!player) return;
  try {
    player.seekTo(0);
    player.play();
  } catch {
    // ignore
  }
}

function safeHaptic(fn: () => Promise<void> | void) {
  if (Platform.OS === "web") return;
  try {
    Promise.resolve(fn()).catch(() => {});
  } catch {
    // ignore
  }
}

function playTone(tone: Tone) {
  if (Platform.OS === "web") {
    playWebTone(tone);
  } else {
    playNativeTone(tone);
  }
}

export const feedback = {
  tap() {
    safeHaptic(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light));
    playTone("tap");
  },
  move() {
    safeHaptic(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium));
    playTone("move");
  },
  flip() {
    safeHaptic(() => Haptics.selectionAsync());
    playTone("flip");
  },
  pop() {
    safeHaptic(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium));
    playTone("pop");
  },
  win() {
    safeHaptic(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success));
    playTone("win");
  },
  lose() {
    safeHaptic(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error));
    playTone("lose");
  },
  setSoundEnabled(enabled: boolean) {
    soundEnabled = enabled;
  },
  isSoundEnabled() {
    return soundEnabled;
  },
};

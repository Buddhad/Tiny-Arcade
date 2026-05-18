// Per-game best-score persistence.
// Each game decides whether higher or lower is better via the `lowerIsBetter` flag.

import { storage } from "./storage";

export type GameId = "tic-tac-toe" | "memory" | "twenty48" | "snake" | "rps";

const KEY = (id: GameId) => `tinyarcade.best.${id}`;

export async function getBest(id: GameId): Promise<number | null> {
  const v = await storage.getItem<number>(KEY(id), -1);
  if (v === null || v === undefined || v === -1) return null;
  return v;
}

export async function maybeSaveBest(
  id: GameId,
  value: number,
  lowerIsBetter = false,
): Promise<boolean> {
  const current = await getBest(id);
  if (current === null) {
    await storage.setItem<number>(KEY(id), value);
    return true;
  }
  const beat = lowerIsBetter ? value < current : value > current;
  if (beat) {
    await storage.setItem<number>(KEY(id), value);
    return true;
  }
  return false;
}

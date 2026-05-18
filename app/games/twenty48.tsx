import { Ionicons } from "@expo/vector-icons";
import { useCallback, useEffect, useState, useMemo } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Directions, Gesture, GestureDetector } from "react-native-gesture-handler";

import GameShell from "../../src/components/GameShell";
import ShareButton from "../../src/components/ShareButton";
import { feedback } from "../../src/utils/feedback";
import { getBest, maybeSaveBest } from "../../src/utils/scores";
import { useTheme } from "../../src/components/ThemeProvider";
import type { Theme } from "../../src/utils/themes";

// IMPORT THE WRAPPERS: Bringing in both our multiplatform banner view and reward stream listeners
import { setupRewarded, showRewardedAd } from "../../src/AdRewarded";
import { AdBannerView } from "../../src/AdInterstitial";

const SIZE = 4;
type Grid = number[][];

function emptyGrid(): Grid {
  return Array.from({ length: SIZE }, () => Array(SIZE).fill(0));
}

function clone(g: Grid): Grid {
  return g.map((row) => row.slice());
}

function addRandomTile(g: Grid): Grid {
  const empty: [number, number][] = [];
  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) {
      if (g[r][c] === 0) empty.push([r, c]);
    }
  }
  if (empty.length === 0) return g;
  const [r, c] = empty[Math.floor(Math.random() * empty.length)];
  const next = clone(g);
  next[r][c] = Math.random() < 0.9 ? 2 : 4;
  return next;
}

function startGrid(): Grid {
  return addRandomTile(addRandomTile(emptyGrid()));
}

function slideRowLeft(row: number[]): { row: number[]; gained: number } {
  const filtered = row.filter((v) => v !== 0);
  const out: number[] = [];
  let gained = 0;
  let i = 0;
  while (i < filtered.length) {
    if (i + 1 < filtered.length && filtered[i] === filtered[i + 1]) {
      const merged = filtered[i] * 2;
      out.push(merged);
      gained += merged;
      i += 2;
    } else {
      out.push(filtered[i]);
      i += 1;
    }
  }
  while (out.length < SIZE) out.push(0);
  return { row: out, gained };
}

function rotateCW(g: Grid): Grid {
  const out = emptyGrid();
  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) {
      out[c][SIZE - 1 - r] = g[r][c];
    }
  }
  return out;
}

function rotateCCW(g: Grid): Grid {
  const out = emptyGrid();
  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) {
      out[SIZE - 1 - c][r] = g[r][c];
    }
  }
  return out;
}

type Dir = "left" | "right" | "up" | "down";

function move(g: Grid, dir: Dir): { grid: Grid; gained: number; changed: boolean } {
  let working = g;
  if (dir === "up") working = rotateCCW(g);
  else if (dir === "down") working = rotateCW(g);
  else if (dir === "right") working = working.map((row) => row.slice().reverse());

  let gained = 0;
  const moved: Grid = working.map((row) => {
    const r = slideRowLeft(row);
    gained += r.gained;
    return r.row;
  });

  let restored = moved;
  if (dir === "up") restored = rotateCW(moved);
  else if (dir === "down") restored = rotateCCW(moved);
  else if (dir === "right") restored = restored.map((row) => row.slice().reverse());

  const changed = JSON.stringify(restored) !== JSON.stringify(g);
  return { grid: restored, gained, changed };
}

function canMove(g: Grid): boolean {
  for (const dir of ["left", "right", "up", "down"] as Dir[]) {
    if (move(g, dir).changed) return true;
  }
  return false;
}

const TILE_COLORS: Record<number, { bg: string; fg: string }> = {
  0: { bg: "#E5E0D8", fg: "transparent" },
  2: { bg: "#FFFFFF", fg: "#1A1A24" },
  4: { bg: "#FFF6D6", fg: "#1A1A24" },
  8: { bg: "#FFD166", fg: "#1A1A24" },
  16: { bg: "#F4A261", fg: "#FFFFFF" },
  32: { bg: "#EF8354", fg: "#FFFFFF" },
  64: { bg: "#EF476F", fg: "#FFFFFF" },
  128: { bg: "#D63384", fg: "#FFFFFF" },
  256: { bg: "#9D4EDD", fg: "#FFFFFF" },
  512: { bg: "#7209B7", fg: "#FFFFFF" },
  1024: { bg: "#06D6A0", fg: "#FFFFFF" },
  2048: { bg: "#118AB2", fg: "#FFFFFF" },
};

export default function TwentyFortyEightScreen() {
  const { theme } = useTheme();
  const { colors: COLORS, shadow: SHADOW, shadowNone: SHADOW_NONE, radius: RADIUS, spacing: SPACING } = theme;
  const styles = useMemo(() => makeStyles(theme), [theme]);

  const [grid, setGrid] = useState<Grid>(() => startGrid());
  const [score, setScore] = useState(0);
  const [best, setBest] = useState<number>(0);
  const [gameOver, setGameOver] = useState(false);
  const [won, setWon] = useState(false);

  // ADDED: Undo board history memory banks to step back snapshots seamlessly
  const [historyGrid, setHistoryGrid] = useState<Grid | null>(null);
  const [historyScore, setHistoryScore] = useState(0);
  const [undoCredits, setUndoCredits] = useState(0);
  const [adLoaded, setAdLoaded] = useState(false);

  const reset = () => {
    setGrid(startGrid());
    setScore(0);
    setGameOver(false);
    setWon(false);
    setHistoryGrid(null);
    setHistoryScore(0);
  };

  // ADDED: Callback that safely delivers +1 Undo Token credit when user watches a video
  const handleEarnUndoReward = useCallback(() => {
    setUndoCredits((prev) => prev + 1);
    feedback.tap();
  }, []);

  // CHANGED: Combined storage streak hook calls with our multiplatform reward hook listeners
  useEffect(() => {
    const cleanAdListeners = setupRewarded(setAdLoaded, handleEarnUndoReward);
    getBest("twenty48").then((v) => {
      if (v !== null) setBest(v);
    });
    return () => {
      if (cleanAdListeners) cleanAdListeners();
    };
  }, [handleEarnUndoReward]);

  // ADDED: Undo restoration action clearing history parameters back to original state snapshot
  const triggerUndoMove = () => {
    if (!historyGrid || undoCredits <= 0) return;
    setGrid(historyGrid);
    setScore(historyScore);
    setUndoCredits((prev) => prev - 1);
    setHistoryGrid(null); // Clear snapshot history usage allocation block
    setGameOver(false);   // Clear game over states if user steps back into live coordinates
    feedback.pop();
  };

  const handleMove = useCallback(
    (dir: Dir) => {
      if (gameOver) return;
      const { grid: next, gained, changed } = move(grid, dir);
      if (!changed) return;

      // ADDED: Cache state conditions right before making any board changes
      setHistoryGrid(clone(grid));
      setHistoryScore(score);

      const withTile = addRandomTile(next);
      setGrid(withTile);
      const newScore = score + gained;
      setScore(newScore);
      if (newScore > best) setBest(newScore);
      feedback.move();

      if (!won && withTile.some((row) => row.some((v) => v >= 2048))) {
        setWon(true);
        feedback.win();
        maybeSaveBest("twenty48", newScore).then((saved) => {
          if (saved) setBest(newScore);
        });
      }

      if (!canMove(withTile)) {
        setGameOver(true);
        feedback.lose();
        maybeSaveBest("twenty48", newScore).then((saved) => {
          if (saved) setBest(newScore);
        });
      }
    },
    [grid, score, best, gameOver, won]
  );

  const flingLeft = Gesture.Fling().direction(Directions.LEFT).onEnd(() => handleMove("left")).runOnJS(true);
  const flingRight = Gesture.Fling().direction(Directions.RIGHT).onEnd(() => handleMove("right")).runOnJS(true);
  const flingUp = Gesture.Fling().direction(Directions.UP).onEnd(() => handleMove("up")).runOnJS(true);
  const flingDown = Gesture.Fling().direction(Directions.DOWN).onEnd(() => handleMove("down")).runOnJS(true);
  const composed = Gesture.Race(flingLeft, flingRight, flingUp, flingDown);

  return (
    <View style={{ flex: 1, justifyContent: "space-between" }}>
      <View style={{ flex: 1 }}>
        <GameShell title="2048" accent={COLORS.games.twenty48} onRestart={reset}>
          <View style={styles.headerRow}>
            <View style={styles.pill}>
              <Text style={styles.pillLabel}>Score</Text>
              <Text testID="twenty48-score" style={styles.pillValue}>
                {score}
              </Text>
            </View>
            <View style={[styles.pill, { backgroundColor: COLORS.games.twenty48 }]}>
              <Text style={[styles.pillLabel, { color: COLORS.surface }]}>Best</Text>
              <Text style={[styles.pillValue, { color: COLORS.surface }]}>{best}</Text>
            </View>
          </View>

          {/* ADDED: Ad Reward Panel for earning and invoking Undo Move Actions */}
          <View style={styles.actionControlRow}>
            {adLoaded && (
              <Pressable
                onPress={() => showRewardedAd(adLoaded)}
                style={({ pressed }) => [styles.adRewardBtn, pressed && styles.pressed]}
              >
                <Text style={styles.adRewardBtnText}>📺 Ad for +1 Undo</Text>
              </Pressable>
            )}
            
            <Pressable
              onPress={triggerUndoMove}
              disabled={!historyGrid || undoCredits <= 0}
              style={({ pressed }) => [
                styles.undoBtn,
                (!historyGrid || undoCredits <= 0) && { opacity: 0.4 },
                pressed && historyGrid && undoCredits > 0 && styles.pressed,
              ]}
            >
              <Ionicons name="arrow-undo-outline" size={15} color={COLORS.textPrimary} />
              <Text style={styles.undoBtnText}>Undo ({undoCredits})</Text>
            </Pressable>
          </View>

          <GestureDetector gesture={composed}>
            <View style={styles.boardWrap} testID="twenty48-board">
              <View style={styles.board}>
                {grid.map((row, r) => (
                  <View key={r} style={styles.row}>
                    {row.map((val, c) => {
                      const t = TILE_COLORS[val] ?? TILE_COLORS[2048];
                      return (
                        <View
                          key={c}
                          testID={`twenty48-cell-${r}-${c}`}
                          style={[styles.tile, { backgroundColor: t.bg }]}
                        >
                          {val > 0 && (
                            <Text
                              style={[
                                styles.tileText,
                                { color: t.fg, fontSize: val >= 1024 ? 18 : val >= 128 ? 22 : 26 },
                              ]}
                            >
                              {val}
                            </Text>
                          )}
                        </View>
                      );
                    })}
                  </View>
                ))}
              </View>
            </View>
          </GestureDetector>

          <Text style={styles.hint}>Swipe to move tiles. Match to 2048!</Text>

          {!(gameOver || won) && (
            <View style={styles.dpad}>
              <View style={styles.dpadRow}>
                <DPadBtn icon="chevron-up" onPress={() => handleMove("up")} testID="twenty48-up" />
              </View>
              <View style={styles.dpadRow}>
                <DPadBtn icon="chevron-back" onPress={() => handleMove("left")} testID="twenty48-left" />
                <DPadBtn icon="chevron-down" onPress={() => handleMove("down")} testID="twenty48-down" />
                <DPadBtn icon="chevron-forward" onPress={() => handleMove("right")} testID="twenty48-right" />
              </View>
            </View>
          )}

          {(gameOver || won) && (
            <View style={styles.endBanner} testID="twenty48-end">
              <Text style={styles.modalTitle}>{won ? "You hit 2048! 🎉" : "Game Over"}</Text>
              <Text style={styles.modalSub}>Score: {score}</Text>
              <View style={styles.endRow}>
                <Pressable
                  testID="twenty48-play-again"
                  onPress={reset}
                  style={({ pressed }) => [styles.playAgain, pressed && styles.pressed]}
                >
                  <Text style={styles.playAgainText}>Play again</Text>
                </Pressable>
                <ShareButton
                  game="2048"
                  line={`I scored ${score} on 2048 in Tiny Arcade${won ? " — and hit the 2048 tile! 🏆" : ""}`}
                  color={COLORS.games.twenty48}
                  testID="twenty48-share"
                />
              </View>
            </View>
          )}
        </GameShell>
      </View>

      {/* FIXED FOOTER AD POSITION: Anchored safe multiplatform banner wrapper layout pane */}
      <View style={{ alignItems: "center", width: "100%", paddingBottom: 10, backgroundColor: "transparent" }}>
        <AdBannerView />
      </View>
    </View>
  );
}

function DPadBtn({
  icon,
  onPress,
  testID,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
  testID: string;
}) {
  const { theme } = useTheme();
  const { colors: COLORS } = theme;
  const styles = useMemo(() => makeStyles(theme), [theme]);

  return (
    <Pressable
      testID={testID}
      onPress={onPress}
      style={({ pressed }) => [styles.dpadBtn, pressed && styles.pressed]}
    >
      <Ionicons name={icon} size={24} color={COLORS.textPrimary} />
    </Pressable>
  );
}

const TILE = 64;

function makeStyles(t: Theme) {
  const { colors: COLORS, shadow: SHADOW, shadowNone: SHADOW_NONE, radius: RADIUS, spacing: SPACING } = t;
  return StyleSheet.create({
    headerRow: { flexDirection: "row", gap: SPACING.md, marginBottom: SPACING.sm },
    pill: {
      flex: 1,
      borderWidth: 3,
      borderColor: COLORS.border,
      borderRadius: RADIUS.lg,
      backgroundColor: COLORS.surface,
      paddingVertical: 10,
      paddingHorizontal: 14,
      ...SHADOW,
    },
    pillLabel: { fontSize: 11, fontWeight: "800", color: COLORS.textSecondary, letterSpacing: 1 },
    pillValue: { fontSize: 20, fontWeight: "900", color: COLORS.textPrimary },
    actionControlRow: { 
      flexDirection: "row", 
      gap: 8, 
      marginBottom: SPACING.md, 
      justifyContent: "center", 
      alignItems: "center" 
    },
    adRewardBtn: {
      paddingHorizontal: 14,
      paddingVertical: 8,
      backgroundColor: COLORS.accent.green,
      borderWidth: 2,
      borderColor: COLORS.border,
      borderRadius: 999,
      ...SHADOW,
    },
    adRewardBtnText: { fontWeight: "900", color: COLORS.surface, fontSize: 12 },
    undoBtn: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
      paddingHorizontal: 14,
      paddingVertical: 8,
      backgroundColor: COLORS.surface,
      borderWidth: 2,
      borderColor: COLORS.border,
      borderRadius: 999,
      ...SHADOW,
    },
    undoBtnText: { fontWeight: "800", color: COLORS.textPrimary, fontSize: 12 },
    boardWrap: { alignItems: "center" },
    board: {
      padding: 8,
      backgroundColor: "#D6CDC4",
      borderWidth: 3,
      borderColor: COLORS.border,
      borderRadius: RADIUS.lg,
      ...SHADOW,
    },
    row: { flexDirection: "row" },
    tile: {
      width: TILE,
      height: TILE,
      margin: 4,
      borderRadius: RADIUS.sm,
      borderWidth: 2,
      borderColor: COLORS.border,
      alignItems: "center",
      justifyContent: "center",
    },
    tileText: { fontWeight: "900" },
    hint: {
      textAlign: "center",
      marginTop: SPACING.md,
      color: COLORS.textSecondary,
      fontWeight: "700",
      fontSize: 13,
    },
    dpad: { alignItems: "center", marginTop: SPACING.md, gap: 8 },
    dpadRow: { flexDirection: "row", gap: 8 },
    dpadBtn: {
      width: 52,
      height: 52,
      borderRadius: 26,
      backgroundColor: COLORS.surface,
      borderWidth: 3,
      borderColor: COLORS.border,
      alignItems: "center",
      justifyContent: "center",
      ...SHADOW,
    },
    pressed: {
      transform: [{ translateX: 3 }, { translateY: 3 }],
      ...SHADOW_NONE,
    },
    endBanner: {
      marginTop: SPACING.lg,
      backgroundColor: COLORS.surface,
      borderWidth: 3,
      borderColor: COLORS.border,
      borderRadius: RADIUS.lg,
      paddingVertical: SPACING.md,
      paddingHorizontal: SPACING.lg,
      alignItems: "center",
      gap: 6,
      ...SHADOW,
    },
    endRow: {
      flexDirection: "row",
      gap: SPACING.sm,
      marginTop: SPACING.sm,
      alignItems: "center",
      flexWrap: "wrap",
      justifyContent: "center",
    },
    modalTitle: { fontSize: 22, fontWeight: "900", color: COLORS.textPrimary },
    modalSub: { fontSize: 14, fontWeight: "700", color: COLORS.textSecondary },
    playAgain: {
      marginTop: SPACING.sm,
      paddingHorizontal: 28,
      paddingVertical: 12,
      backgroundColor: COLORS.games.twenty48,
      borderWidth: 3,
      borderColor: COLORS.border,
      borderRadius: 999,
      ...SHADOW,
    },
    playAgainText: { fontSize: 16, fontWeight: "900", color: COLORS.surface },
  });
}

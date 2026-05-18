import { Ionicons } from "@expo/vector-icons";
import { useCallback, useEffect, useRef, useState, useMemo } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Directions, Gesture, GestureDetector } from "react-native-gesture-handler";

import GameShell from "../../src/components/GameShell";
import ShareButton from "../../src/components/ShareButton";
import { feedback } from "../../src/utils/feedback";
import { getBest, maybeSaveBest } from "../../src/utils/scores";
import { useTheme } from "../../src/components/ThemeProvider";
import type { Theme } from "../../src/utils/themes";

// IMPORT THE WRAPPERS: Connecting your multiplatform crash-free rewarded module imports
import { setupRewarded, showRewardedAd } from "../../src/AdRewarded";

const COLS = 14;
const ROWS = 18;
const CELL = 18;
const TICK_MS = 160;

type Pt = { x: number; y: number };
type Dir = "up" | "down" | "left" | "right";

const DIR_DELTA: Record<Dir, Pt> = {
  up: { x: 0, y: -1 },
  down: { x: 0, y: 1 },
  left: { x: -1, y: 0 },
  right: { x: 1, y: 0 },
};

const OPPOSITE: Record<Dir, Dir> = {
  up: "down",
  down: "up",
  left: "right",
  right: "left",
};

function randomFood(snake: Pt[]): Pt {
  while (true) {
    const x = Math.floor(Math.random() * COLS);
    const y = Math.floor(Math.random() * ROWS);
    if (!snake.some((s) => s.x === x && s.y === y)) return { x, y };
  }
}

export default function SnakeScreen() {
  const { theme } = useTheme();
  const { colors: COLORS, shadow: SHADOW, shadowNone: SHADOW_NONE, radius: RADIUS, spacing: SPACING } = theme;
  const styles = useMemo(() => makeStyles(theme), [theme]);

  const [snake, setSnake] = useState<Pt[]>([
    { x: 6, y: 9 },
    { x: 5, y: 9 },
    { x: 4, y: 9 },
  ]);
  const [food, setFood] = useState<Pt>({ x: 10, y: 9 });
  const [dir, setDir] = useState<Dir>("right");
  const [running, setRunning] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [score, setScore] = useState(0);
  const [best, setBest] = useState<number | null>(null);

  // ADDED: Local lifecycle state handlers tracking rewarded video configurations
  const [adLoaded, setAdLoaded] = useState(false);
  const [hasRevived, setHasRevived] = useState(false); // Restrict player to 1 revive per run

  const dirRef = useRef<Dir>("right");
  const queuedDirRef = useRef<Dir | null>(null);

  const reset = useCallback(() => {
    const init: Pt[] = [
      { x: 6, y: 9 },
      { x: 5, y: 9 },
      { x: 4, y: 9 },
    ];
    setSnake(init);
    setFood(randomFood(init));
    setDir("right");
    dirRef.current = "right";
    queuedDirRef.current = null;
    setScore(0);
    setGameOver(false);
    setRunning(true);
    setHasRevived(false); // Reset revive token for fresh games
  }, []);

  // ADDED: Revive logic callback triggered exactly when the user finishes watching the rewarded video
  const handleReviveReward = useCallback(() => {
    // Safely re-center the snake based on its current body shape size to avoid instant spawning wall deaths
    const length = snake.length > 0 ? snake.length : 3;
    const revivedSnake: Pt[] = [];
    
    // Spawn horizontal sequence safely center grid lanes
    for (let i = 0; i < length; i++) {
      revivedSnake.push({ x: 6 - i, y: 9 });
    }

    setSnake(revivedSnake);
    setFood(randomFood(revivedSnake));
    setDir("right");
    dirRef.current = "right";
    queuedDirRef.current = null;
    
    setGameOver(false);
    setRunning(true);
    setHasRevived(true); // Flag active to hide button for remainder of this run
    feedback.tap();
  }, [snake.length]);

  // CHANGED: Registered standard telemetry triggers with the new dynamic rewarded video listener stream
  useEffect(() => {
    const cleanAdListeners = setupRewarded(setAdLoaded, handleReviveReward);
    getBest("snake").then(setBest);
    
    return () => {
      if (cleanAdListeners) cleanAdListeners();
    };
  }, [handleReviveReward]);

  const changeDir = useCallback((d: Dir) => {
    if (OPPOSITE[d] === dirRef.current) return; // can't reverse
    queuedDirRef.current = d;
  }, []);

  useEffect(() => {
    if (!running || gameOver) return;
    const id = setInterval(() => {
      setSnake((prev) => {
        if (queuedDirRef.current) {
          dirRef.current = queuedDirRef.current;
          queuedDirRef.current = null;
          setDir(dirRef.current);
        }
        const delta = DIR_DELTA[dirRef.current];
        const newHead: Pt = { x: prev[0].x + delta.x, y: prev[0].y + delta.y };

        // wall collision
        if (
          newHead.x < 0 ||
          newHead.x >= COLS ||
          newHead.y < 0 ||
          newHead.y >= ROWS
        ) {
          setGameOver(true);
          setRunning(false);
          feedback.lose();
          maybeSaveBest("snake", prev.length).then((saved) => {
            if (saved) setBest(prev.length);
          });
          return prev;
        }

        // self collision
        if (prev.some((p) => p.x === newHead.x && p.y === newHead.y)) {
          setGameOver(true);
          setRunning(false);
          feedback.lose();
          maybeSaveBest("snake", prev.length).then((saved) => {
            if (saved) setBest(prev.length);
          });
          return prev;
        }

        const ateFood = newHead.x === food.x && newHead.y === food.y;
        const next = [newHead, ...prev];
        if (!ateFood) next.pop();
        else {
          setScore((s) => s + 1);
          setFood(randomFood(next));
          feedback.pop();
        }
        return next;
      });
    }, TICK_MS);
    return () => clearInterval(id);
  }, [running, gameOver, food]);

  const flingLeft = Gesture.Fling().direction(Directions.LEFT).onEnd(() => changeDir("left")).runOnJS(true);
  const flingRight = Gesture.Fling().direction(Directions.RIGHT).onEnd(() => changeDir("right")).runOnJS(true);
  const flingUp = Gesture.Fling().direction(Directions.UP).onEnd(() => changeDir("up")).runOnJS(true);
  const flingDown = Gesture.Fling().direction(Directions.DOWN).onEnd(() => changeDir("down")).runOnJS(true);

  const composed = Gesture.Race(flingLeft, flingRight, flingUp, flingDown);

  return (
    <GameShell title="Snake" accent={COLORS.games.snake} onRestart={reset}>
      <View style={styles.headerRow}>
        <View style={styles.pill}>
          <Text style={styles.pillLabel}>Score</Text>
          <Text testID="snake-score" style={styles.pillValue}>
            {score}
          </Text>
        </View>
        <View style={[styles.pill, { backgroundColor: COLORS.games.snake }]}>
          <Text style={[styles.pillLabel, { color: COLORS.surface }]}>Length</Text>
          <Text style={[styles.pillValue, { color: COLORS.surface }]}>{snake.length}</Text>
        </View>
      </View>

      <GestureDetector gesture={composed}>
        <View style={styles.boardWrap} testID="snake-board">
          <View style={[styles.board, { width: COLS * CELL + 6, height: ROWS * CELL + 6 }]}>
            {snake.map((s, i) => (
              <View
                key={`s-${i}`}
                style={{
                  position: "absolute",
                  left: s.x * CELL + 3,
                  top: s.y * CELL + 3,
                  width: CELL - 2,
                  height: CELL - 2,
                  backgroundColor: i === 0 ? COLORS.games.snake : COLORS.games.snakeBody,
                  borderRadius: i === 0 ? 5 : 3,
                }}
              />
            ))}
            <View
              style={{
                position: "absolute",
                left: food.x * CELL + 3,
                top: food.y * CELL + 3,
                width: CELL - 2,
                height: CELL - 2,
                backgroundColor: COLORS.accent.pink,
                borderRadius: (CELL - 2) / 2,
              }}
            />
          </View>
        </View>
      </GestureDetector>

      {!running && !gameOver && (
        <Pressable
          testID="snake-start"
          onPress={() => {
            feedback.tap();
            setRunning(true);
          }}
          style={({ pressed }) => [styles.startBtn, pressed && styles.pressed]}
        >
          <Text style={styles.startBtnText}>Start</Text>
        </Pressable>
      )}

      {!gameOver && (
        <View style={styles.dpad}>
          <View style={styles.dpadRow}>
            <DPadBtn icon="chevron-up" onPress={() => changeDir("up")} testID="snake-up" />
          </View>
          <View style={styles.dpadRow}>
            <DPadBtn icon="chevron-back" onPress={() => changeDir("left")} testID="snake-left" />
            <DPadBtn icon="chevron-down" onPress={() => changeDir("down")} testID="snake-down" />
            <DPadBtn icon="chevron-forward" onPress={() => changeDir("right")} testID="snake-right" />
          </View>
        </View>
      )}

      {gameOver && (
        <View style={styles.endBanner} testID="snake-end">
          <Text style={styles.modalTitle}>Game Over</Text>
          <Text style={styles.modalSub}>Score: {score} · Length: {snake.length}</Text>
          {best !== null && best > 0 && (
            <Text style={styles.modalBest} testID="snake-best">
              🏆 Best length: {best}
            </Text>
          )}
          <View style={styles.endRow}>
            {/* ADDED: Dynamic "Watch Ad to Revive" option if player hasn't already loaded an overlay this round */}
            {!hasRevived && adLoaded && (
              <Pressable
                onPress={() => showRewardedAd(adLoaded)}
                style={({ pressed }) => [
                  styles.playAgain,
                  { backgroundColor: COLORS.accent.green, borderColor: COLORS.border },
                  pressed && styles.pressed,
                ]}
              >
                <Text style={styles.playAgainText}>❤️ Revive (+1 Life)</Text>
              </Pressable>
            )}

            <Pressable
              testID="snake-play-again"
              onPress={reset}
              style={({ pressed }) => [styles.playAgain, pressed && styles.pressed]}
            >
              <Text style={styles.playAgainText}>Play again</Text>
            </Pressable>
            <ShareButton
              game="Snake"
              line={`My snake grew to length ${snake.length} in Tiny Arcade 🐍`}
              color={COLORS.games.snake}
              testID="snake-share"
            />
          </View>
        </View>
      )}
    </GameShell>
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

function makeStyles(t: Theme) {
  const { colors: COLORS, shadow: SHADOW, shadowNone: SHADOW_NONE, radius: RADIUS, spacing: SPACING } = t;
  return StyleSheet.create({
    headerRow: { flexDirection: "row", gap: SPACING.md, marginBottom: SPACING.md },
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
    boardWrap: { alignItems: "center" },
    board: {
      backgroundColor: "#EAF6FB",
      borderWidth: 3,
      borderColor: COLORS.border,
      borderRadius: RADIUS.md,
      overflow: "hidden",
      ...SHADOW,
    },
    startBtn: {
      alignSelf: "center",
      marginTop: SPACING.md,
      paddingHorizontal: 32,
      paddingVertical: 12,
      backgroundColor: COLORS.games.snake,
      borderWidth: 3,
      borderColor: COLORS.border,
      borderRadius: 999,
      ...SHADOW,
    },
    startBtnText: { fontWeight: "900", color: COLORS.surface, fontSize: 16 },
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
    modalBest: { fontSize: 13, fontWeight: "800", color: COLORS.games.snake },
    modalTitle: { fontSize: 22, fontWeight: "900", color: COLORS.textPrimary },
    modalSub: { fontSize: 14, fontWeight: "700", color: COLORS.textSecondary },
    playAgain: {
      marginTop: SPACING.sm,
      paddingHorizontal: 20,
      paddingVertical: 12,
      backgroundColor: COLORS.games.snake,
      borderWidth: 3,
      borderColor: COLORS.border,
      borderRadius: 999,
      ...SHADOW,
    },
    playAgainText: { fontSize: 15, fontWeight: "900", color: COLORS.surface },
  });
}

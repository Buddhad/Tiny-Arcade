import { Ionicons } from "@expo/vector-icons";
import { useEffect, useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import GameShell from "../../src/components/GameShell";
import ShareButton from "../../src/components/ShareButton";
import { feedback } from "../../src/utils/feedback";
import { getBest, maybeSaveBest } from "../../src/utils/scores";
import { useTheme } from "../../src/components/ThemeProvider";
import type { Theme } from "../../src/utils/themes";

const EMOJIS = ["🍎", "🌟", "🎈", "🍕", "🐱", "🚀", "🌈", "🍩"];

type Card = {
  id: number;
  emoji: string;
  flipped: boolean;
  matched: boolean;
};

function shuffle<T>(arr: T[]): T[] {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function buildDeck(): Card[] {
  const pairs = [...EMOJIS, ...EMOJIS];
  return shuffle(pairs).map((emoji, idx) => ({
    id: idx,
    emoji,
    flipped: false,
    matched: false,
  }));
}

export default function MemoryScreen() {
  const { theme } = useTheme();
  const { colors: COLORS, shadow: SHADOW, shadowNone: SHADOW_NONE, radius: RADIUS, spacing: SPACING } = theme;
  const styles = useMemo(() => makeStyles(theme), [theme]);
  const [deck, setDeck] = useState<Card[]>(() => buildDeck());
  const [picks, setPicks] = useState<number[]>([]);
  const [moves, setMoves] = useState(0);
  const [lock, setLock] = useState(false);
  const [best, setBest] = useState<number | null>(null);

  const allMatched = useMemo(() => deck.every((c) => c.matched), [deck]);

  useEffect(() => {
    getBest("memory").then(setBest);
  }, []);

  useEffect(() => {
    if (allMatched && deck.length > 0) {
      feedback.win();
      maybeSaveBest("memory", moves, true).then((saved) => {
        if (saved) setBest(moves);
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allMatched]);

  const reset = () => {
    setDeck(buildDeck());
    setPicks([]);
    setMoves(0);
    setLock(false);
  };

  const handlePick = (idx: number) => {
    if (lock) return;
    const card = deck[idx];
    if (card.flipped || card.matched) return;
    feedback.flip();
    const next = deck.slice();
    next[idx] = { ...card, flipped: true };
    setDeck(next);
    const newPicks = [...picks, idx];
    setPicks(newPicks);

    if (newPicks.length === 2) {
      setMoves((m) => m + 1);
      const [a, b] = newPicks;
      if (next[a].emoji === next[b].emoji) {
        const matched = next.slice();
        matched[a] = { ...matched[a], matched: true };
        matched[b] = { ...matched[b], matched: true };
        setTimeout(() => {
          setDeck(matched);
          setPicks([]);
          feedback.pop();
        }, 350);
      } else {
        setLock(true);
        setTimeout(() => {
          const flipBack = next.slice();
          flipBack[a] = { ...flipBack[a], flipped: false };
          flipBack[b] = { ...flipBack[b], flipped: false };
          setDeck(flipBack);
          setPicks([]);
          setLock(false);
        }, 700);
      }
    }
  };

  return (
    <GameShell title="Memory Match" accent={COLORS.games.memory} onRestart={reset}>
      <View style={styles.headerRow}>
        <View style={styles.pill}>
          <Text style={styles.pillLabel}>Moves</Text>
          <Text testID="memory-moves" style={styles.pillValue}>
            {moves}
          </Text>
        </View>
        <View style={[styles.pill, { backgroundColor: COLORS.games.memory }]}>
          <Text style={[styles.pillLabel, { color: COLORS.surface }]}>Pairs</Text>
          <Text style={[styles.pillValue, { color: COLORS.surface }]} testID="memory-pairs">
            {deck.filter((c) => c.matched).length / 2}/{EMOJIS.length}
          </Text>
        </View>
      </View>

      {best !== null && (
        <View style={styles.bestPill}>
          <Ionicons name="trophy" size={14} color={COLORS.textPrimary} />
          <Text style={styles.bestText} testID="memory-best">
            Best: {best} moves
          </Text>
        </View>
      )}

      <View style={styles.grid} testID="memory-grid">
        {deck.map((card, idx) => {
          const showFace = card.flipped || card.matched;
          return (
            <Pressable
              key={card.id}
              testID={`memory-card-${idx}`}
              onPress={() => handlePick(idx)}
              style={({ pressed }) => [
                styles.card,
                showFace ? styles.cardFront : styles.cardBack,
                card.matched && styles.cardMatched,
                pressed && !showFace && styles.pressed,
              ]}
            >
              <Text style={[styles.cardEmoji, !showFace && styles.hidden]}>{card.emoji}</Text>
              {!showFace && <Text style={styles.cardBackMark}>?</Text>}
            </Pressable>
          );
        })}
      </View>

      {allMatched && (
        <View style={styles.winBanner} testID="memory-win">
          <Text style={styles.winTitle}>You did it! 🎉</Text>
          <Text style={styles.winSub}>Finished in {moves} moves</Text>
          <View style={styles.endRow}>
            <Pressable
              testID="memory-play-again"
              onPress={reset}
              style={({ pressed }) => [styles.playAgain, pressed && styles.pressed]}
            >
              <Text style={styles.playAgainText}>Play again</Text>
            </Pressable>
            <ShareButton
              game="Memory Match"
              line={`I matched all 8 pairs in ${moves} moves on Tiny Arcade 🧠`}
              color={COLORS.games.memory}
              testID="memory-share"
            />
          </View>
        </View>
      )}
    </GameShell>
  );
}

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
  bestPill: {
    alignSelf: "center",
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 5,
    backgroundColor: COLORS.games.memory,
    borderWidth: 2,
    borderColor: COLORS.border,
    borderRadius: 999,
    marginBottom: SPACING.md,
  },
  bestText: { fontWeight: "800", fontSize: 12, color: COLORS.surface },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 8, justifyContent: "center" },
  card: {
    width: 72,
    height: 72,
    borderWidth: 3,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
    alignItems: "center",
    justifyContent: "center",
    ...SHADOW,
  },
  pressed: {
    transform: [{ translateX: 3 }, { translateY: 3 }],
    ...SHADOW_NONE,
  },
  cardBack: { backgroundColor: COLORS.games.memory },
  cardFront: { backgroundColor: COLORS.surface },
  cardMatched: { opacity: 0.55 },
  cardEmoji: { fontSize: 34 },
  cardBackMark: { fontSize: 26, fontWeight: "900", color: COLORS.surface },
  hidden: { opacity: 0 },
  winBanner: { alignItems: "center", marginTop: SPACING.xl, gap: 6 },
  winTitle: { fontSize: 28, fontWeight: "900", color: COLORS.textPrimary },
  winSub: { fontSize: 14, fontWeight: "700", color: COLORS.textSecondary },
  endRow: {
    flexDirection: "row",
    gap: SPACING.sm,
    marginTop: SPACING.md,
    alignItems: "center",
    flexWrap: "wrap",
    justifyContent: "center",
  },
  playAgain: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: COLORS.games.memory,
    borderWidth: 3,
    borderColor: COLORS.border,
    borderRadius: 999,
    ...SHADOW,
  },
  playAgainText: { fontSize: 15, fontWeight: "900", color: COLORS.surface },
});
}

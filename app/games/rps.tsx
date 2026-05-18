import { Ionicons } from "@expo/vector-icons";
import { useEffect, useState, useMemo } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import GameShell from "../../src/components/GameShell";
import ShareButton from "../../src/components/ShareButton";
import { feedback } from "../../src/utils/feedback";
import { getBest, maybeSaveBest } from "../../src/utils/scores";
import { useTheme } from "../../src/components/ThemeProvider";
import type { Theme } from "../../src/utils/themes";

type Choice = "rock" | "paper" | "scissors";

const CHOICES: { id: Choice; emoji: string; label: string }[] = [
  { id: "rock", emoji: "🪨", label: "Rock" },
  { id: "paper", emoji: "📄", label: "Paper" },
  { id: "scissors", emoji: "✂️", label: "Scissors" },
];

function decide(player: Choice, cpu: Choice): "win" | "lose" | "draw" {
  if (player === cpu) return "draw";
  if (
    (player === "rock" && cpu === "scissors") ||
    (player === "paper" && cpu === "rock") ||
    (player === "scissors" && cpu === "paper")
  )
    return "win";
  return "lose";
}

export default function RpsScreen() {
  const { theme } = useTheme();
  const { colors: COLORS, shadow: SHADOW, shadowNone: SHADOW_NONE, radius: RADIUS, spacing: SPACING } = theme;
  const styles = useMemo(() => makeStyles(theme), [theme]);
  const [player, setPlayer] = useState<Choice | null>(null);
  const [cpu, setCpu] = useState<Choice | null>(null);
  const [result, setResult] = useState<"win" | "lose" | "draw" | null>(null);
  const [score, setScore] = useState({ wins: 0, losses: 0, draws: 0 });
  const [best, setBest] = useState<number | null>(null);

  useEffect(() => {
    getBest("rps").then(setBest);
  }, []);

  const play = (choice: Choice) => {
    const cpuChoice = CHOICES[Math.floor(Math.random() * 3)].id;
    const r = decide(choice, cpuChoice);
    setPlayer(choice);
    setCpu(cpuChoice);
    setResult(r);
    setScore((s) => {
      const next = {
        wins: s.wins + (r === "win" ? 1 : 0),
        losses: s.losses + (r === "lose" ? 1 : 0),
        draws: s.draws + (r === "draw" ? 1 : 0),
      };
      if (r === "win") {
        maybeSaveBest("rps", next.wins).then((saved) => {
          if (saved) setBest(next.wins);
        });
      }
      return next;
    });
    if (r === "win") feedback.win();
    else if (r === "lose") feedback.lose();
    else feedback.tap();
  };

  const reset = () => {
    setPlayer(null);
    setCpu(null);
    setResult(null);
    setScore({ wins: 0, losses: 0, draws: 0 });
  };

  const resultText =
    result === "win" ? "You win!" : result === "lose" ? "CPU wins" : result === "draw" ? "It's a draw" : "Make a move";
  const resultColor =
    result === "win" ? COLORS.accent.green : result === "lose" ? COLORS.accent.pink : COLORS.textPrimary;

  return (
    <GameShell title="Rock Paper Scissors" accent={COLORS.games.rps} onRestart={reset} restartLabel="Reset">
      <View style={styles.scoreRow}>
        <ScoreBox label="Wins" value={score.wins} color={COLORS.accent.green} testID="rps-wins" />
        <ScoreBox label="Draws" value={score.draws} color={COLORS.surface} testID="rps-draws" />
        <ScoreBox label="Losses" value={score.losses} color={COLORS.accent.pink} testID="rps-losses" />
      </View>

      {best !== null && best > 0 && (
        <View style={styles.bestPill}>
          <Ionicons name="trophy" size={14} color={COLORS.textPrimary} />
          <Text style={styles.bestText} testID="rps-best">
            Best session wins: {best}
          </Text>
        </View>
      )}

      <View style={styles.arena}>
        <View style={styles.arenaSide}>
          <Text style={styles.arenaLabel}>CPU</Text>
          <View style={[styles.handBox, { backgroundColor: COLORS.surface }]}>
            <Text style={styles.handEmoji}>
              {cpu ? CHOICES.find((c) => c.id === cpu)?.emoji : "❔"}
            </Text>
          </View>
        </View>

        <Text style={[styles.resultText, { color: resultColor }]} testID="rps-result">
          {resultText}
        </Text>

        <View style={styles.arenaSide}>
          <Text style={styles.arenaLabel}>YOU</Text>
          <View style={[styles.handBox, { backgroundColor: COLORS.games.rps }]}>
            <Text style={styles.handEmoji}>
              {player ? CHOICES.find((c) => c.id === player)?.emoji : "❔"}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.choices}>
        {CHOICES.map((c) => (
          <Pressable
            key={c.id}
            testID={`rps-${c.id}`}
            onPress={() => play(c.id)}
            style={({ pressed }) => [styles.choiceBtn, pressed && styles.choicePressed]}
          >
            <Text style={styles.choiceEmoji}>{c.emoji}</Text>
            <Text style={styles.choiceLabel}>{c.label}</Text>
          </Pressable>
        ))}
      </View>

      {(score.wins > 0 || score.losses > 0 || score.draws > 0) && (
        <View style={styles.shareRow}>
          <ShareButton
            game="Rock Paper Scissors"
            line={`RPS vs CPU on Tiny Arcade — ${score.wins}W / ${score.draws}D / ${score.losses}L ✊✋✌️`}
            color={COLORS.games.rps}
            testID="rps-share"
          />
        </View>
      )}
    </GameShell>
  );
}

function ScoreBox({
  label,
  value,
  color,
  testID,
}: {
  label: string;
  value: number;
  color: string;
  testID: string;
}) {  const { theme } = useTheme();
  const { colors: COLORS, shadow: SHADOW, shadowNone: SHADOW_NONE, radius: RADIUS, spacing: SPACING } = theme;
  const styles = useMemo(() => makeStyles(theme), [theme]);

  return (
    <View style={[styles.scoreBox, { backgroundColor: color }]}>
      <Text style={styles.scoreLabel}>{label}</Text>
      <Text style={styles.scoreValue} testID={testID}>
        {value}
      </Text>
    </View>
  );
}

function makeStyles(t: Theme) {
  const { colors: COLORS, shadow: SHADOW, shadowNone: SHADOW_NONE, radius: RADIUS, spacing: SPACING } = t;
  return StyleSheet.create({
  scoreRow: { flexDirection: "row", gap: SPACING.sm, marginBottom: SPACING.sm },
  scoreBox: {
    flex: 1,
    borderWidth: 3,
    borderColor: COLORS.border,
    borderRadius: RADIUS.lg,
    paddingVertical: 8,
    paddingHorizontal: 10,
    alignItems: "center",
    ...SHADOW,
  },
  scoreLabel: { fontSize: 10, fontWeight: "800", color: COLORS.textPrimary, letterSpacing: 1 },
  scoreValue: { fontSize: 22, fontWeight: "900", color: COLORS.textPrimary },
  bestPill: {
    alignSelf: "center",
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 5,
    backgroundColor: COLORS.games.rps,
    borderWidth: 2,
    borderColor: COLORS.border,
    borderRadius: 999,
    marginBottom: SPACING.md,
  },
  bestText: { fontWeight: "800", fontSize: 12, color: COLORS.textPrimary },
  arena: { alignItems: "center", gap: SPACING.md, paddingVertical: SPACING.sm },
  arenaSide: { alignItems: "center", gap: 6 },
  arenaLabel: { fontSize: 12, fontWeight: "900", letterSpacing: 2, color: COLORS.textSecondary },
  handBox: {
    width: 110,
    height: 110,
    borderRadius: RADIUS.lg,
    borderWidth: 3,
    borderColor: COLORS.border,
    alignItems: "center",
    justifyContent: "center",
    ...SHADOW,
  },
  handEmoji: { fontSize: 56 },
  resultText: { fontSize: 28, fontWeight: "900", letterSpacing: -0.5 },
  choices: {
    flexDirection: "row",
    justifyContent: "center",
    gap: SPACING.md,
    marginTop: SPACING.md,
  },
  choiceBtn: {
    width: 88,
    paddingVertical: 14,
    backgroundColor: COLORS.surface,
    borderWidth: 3,
    borderColor: COLORS.border,
    borderRadius: RADIUS.lg,
    alignItems: "center",
    gap: 4,
    ...SHADOW,
  },
  choicePressed: {
    transform: [{ translateX: 3 }, { translateY: 3 }],
    ...SHADOW_NONE,
  },
  choiceEmoji: { fontSize: 32 },
  choiceLabel: { fontWeight: "800", fontSize: 13, color: COLORS.textPrimary },
  shareRow: { alignItems: "center", marginTop: SPACING.lg },
});
}

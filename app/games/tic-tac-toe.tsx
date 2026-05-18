import { Ionicons } from "@expo/vector-icons";
import { useEffect, useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import GameShell from "../../src/components/GameShell";
import ShareButton from "../../src/components/ShareButton";
import { feedback } from "../../src/utils/feedback";
import { getBest, maybeSaveBest } from "../../src/utils/scores";
import { useTheme } from "../../src/components/ThemeProvider";
import type { Theme } from "../../src/utils/themes";

type Cell = "X" | "O" | null;
type Mode = "cpu" | "2p";

const LINES = [
  [0, 1, 2],
  [3, 4, 5],
  [6, 7, 8],
  [0, 3, 6],
  [1, 4, 7],
  [2, 5, 8],
  [0, 4, 8],
  [2, 4, 6],
];

function checkWinner(b: Cell[]): { winner: Cell; line: number[] | null } {
  for (const ln of LINES) {
    const [a, c, d] = ln;
    if (b[a] && b[a] === b[c] && b[a] === b[d]) return { winner: b[a], line: ln };
  }
  return { winner: null, line: null };
}

// Minimax — CPU is "O", player is "X"
function minimax(board: Cell[], isMax: boolean): number {
  const { winner } = checkWinner(board);
  if (winner === "O") return 1;
  if (winner === "X") return -1;
  if (board.every(Boolean)) return 0;

  let best = isMax ? -Infinity : Infinity;
  for (let i = 0; i < 9; i++) {
    if (!board[i]) {
      board[i] = isMax ? "O" : "X";
      const score = minimax(board, !isMax);
      board[i] = null;
      best = isMax ? Math.max(best, score) : Math.min(best, score);
    }
  }
  return best;
}

function pickCpuMove(board: Cell[]): number {  
  let bestScore = -Infinity;
  let bestMove = -1;
  const candidates: number[] = [];
  for (let i = 0; i < 9; i++) {
    if (!board[i]) {
      board[i] = "O";
      const score = minimax(board, false);
      board[i] = null;
      if (score > bestScore) {
        bestScore = score;
        bestMove = i;
        candidates.length = 0;
        candidates.push(i);
      } else if (score === bestScore) {
        candidates.push(i);
      }
    }
  }
  // pick randomly among equally-good moves for variety
  return candidates.length
    ? candidates[Math.floor(Math.random() * candidates.length)]
    : bestMove;
}

export default function TicTacToeScreen() {
  const { theme } = useTheme();
  const { colors: COLORS, shadow: SHADOW, shadowNone: SHADOW_NONE, radius: RADIUS, spacing: SPACING } = theme;
  const styles = useMemo(() => makeStyles(theme), [theme]);
  const [mode, setMode] = useState<Mode>("cpu");
  const [board, setBoard] = useState<Cell[]>(Array(9).fill(null));
  const [turn, setTurn] = useState<"X" | "O">("X");
  const [tally, setTally] = useState({ wins: 0, losses: 0, draws: 0 });
  const [bestWins, setBestWins] = useState<number | null>(null);

  const { winner, line } = useMemo(() => checkWinner(board), [board]);
  const isDraw = !winner && board.every(Boolean);

  useEffect(() => {
    getBest("tic-tac-toe").then(setBestWins);
  }, []);

  // CPU move trigger
  useEffect(() => {
    if (mode !== "cpu") return;
    if (winner || isDraw) return;
    if (turn !== "O") return;
    const id = setTimeout(() => {
      const move = pickCpuMove(board.slice());
      if (move >= 0) playAt(move, "O");
    }, 420);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [turn, mode, board, winner, isDraw]);

  // React to game end → update tally + best in cpu mode
  useEffect(() => {
    if (mode !== "cpu") return;
    if (winner === "X") {
      setTally((t) => {
        const nextWins = t.wins + 1;
        maybeSaveBest("tic-tac-toe", nextWins).then((saved) => {
          if (saved) setBestWins(nextWins);
        });
        return { ...t, wins: nextWins };
      });
    } else if (winner === "O") {
      setTally((t) => ({ ...t, losses: t.losses + 1 }));
    } else if (isDraw) {
      setTally((t) => ({ ...t, draws: t.draws + 1 }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [winner, isDraw]);

  const playAt = (i: number, who: "X" | "O") => {
    setBoard((prev) => {
      if (prev[i] || checkWinner(prev).winner) return prev;
      const next = prev.slice();
      next[i] = who;
      const result = checkWinner(next);
      if (result.winner) feedback.win();
      else if (next.every(Boolean)) feedback.lose();
      else feedback.move();
      return next;
    });
    setTurn(who === "X" ? "O" : "X");
  };

  const handlePress = (i: number) => {
    if (board[i] || winner) return;
    if (mode === "cpu" && turn !== "X") return;
    playAt(i, turn);
  };

  const newRound = () => {
    setBoard(Array(9).fill(null));
    setTurn("X");
  };

  const fullReset = () => {
    newRound();
    setTally({ wins: 0, losses: 0, draws: 0 });
  };

  const status =
    winner === "X"
      ? mode === "cpu"
        ? "You win! 🎉"
        : "Player X wins!"
      : winner === "O"
        ? mode === "cpu"
          ? "CPU wins"
          : "Player O wins!"
        : isDraw
          ? "It's a draw"
          : mode === "cpu"
            ? turn === "X"
              ? "Your turn (X)"
              : "CPU thinking…"
            : `Player ${turn}'s turn`;

  return (
    <GameShell title="Tic Tac Toe" accent={COLORS.games.ticTacToe} onRestart={fullReset}>
      <View style={styles.modeRow}>
        <ModeBtn
          active={mode === "cpu"}
          label="Solo (CPU)"
          icon="hardware-chip-outline"
          onPress={() => {
            feedback.tap();
            setMode("cpu");
            fullReset();
          }}
          testID="ttt-mode-cpu"
        />
        <ModeBtn
          active={mode === "2p"}
          label="2 Players"
          icon="people-outline"
          onPress={() => {
            feedback.tap();
            setMode("2p");
            fullReset();
          }}
          testID="ttt-mode-2p"
        />
      </View>

      {mode === "cpu" && (
        <View style={styles.tallyRow}>
          <TallyBox label="WINS" value={tally.wins} color={COLORS.accent.green} testID="ttt-wins" />
          <TallyBox label="DRAWS" value={tally.draws} color={COLORS.surface} testID="ttt-draws" />
          <TallyBox label="LOSSES" value={tally.losses} color={COLORS.accent.pink} testID="ttt-losses" />
        </View>
      )}

      {bestWins !== null && bestWins > 0 && mode === "cpu" && (
        <View style={styles.bestPill}>
          <Ionicons name="trophy" size={14} color={COLORS.textPrimary} />
          <Text style={styles.bestText} testID="ttt-best">
            Best win streak: {bestWins}
          </Text>
        </View>
      )}

      <View style={styles.statusWrap}>
        <Text testID="ttt-status" style={styles.statusText}>
          {status}
        </Text>
      </View>

      <View style={styles.boardWrap}>
        <View style={styles.board} testID="ttt-board">
          {board.map((cell, i) => {
            const winning = line?.includes(i);
            return (
              <Pressable
                key={i}
                testID={`ttt-cell-${i}`}
                onPress={() => handlePress(i)}
                style={({ pressed }) => [
                  styles.cell,
                  winning && { backgroundColor: COLORS.games.ticTacToe },
                  pressed && !cell && styles.cellPressed,
                ]}
              >
                <Text
                  style={[
                    styles.mark,
                    cell === "X" && { color: COLORS.accent.pink },
                    cell === "O" && { color: COLORS.accent.blue },
                  ]}
                >
                  {cell ?? ""}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      {(winner || isDraw) && (
        <View style={styles.endRow}>
          <Pressable
            testID="ttt-play-again"
            onPress={() => {
              feedback.tap();
              newRound();
            }}
            style={({ pressed }) => [styles.playAgain, pressed && styles.pressed]}
          >
            <Text style={styles.playAgainText}>Next round</Text>
          </Pressable>
          {mode === "cpu" && winner === "X" && (
            <ShareButton
              game="Tic Tac Toe"
              line={`I just beat the Tiny Arcade CPU at Tic Tac Toe! 🏆 Streak: ${tally.wins}`}
              color={COLORS.games.ticTacToe}
              testID="ttt-share"
            />
          )}
        </View>
      )}
    </GameShell>
  );
}

function ModeBtn({
  active,
  label,
  icon,
  onPress,
  testID,
}: {
  active: boolean;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
  testID: string;
}) {  const { theme } = useTheme();
  const { colors: COLORS, shadow: SHADOW, shadowNone: SHADOW_NONE, radius: RADIUS, spacing: SPACING } = theme;
  const styles = useMemo(() => makeStyles(theme), [theme]);

  return (
    <Pressable
      testID={testID}
      onPress={onPress}
      style={({ pressed }) => [
        styles.modeBtn,
        active && { backgroundColor: COLORS.games.ticTacToe },
        pressed && styles.pressed,
      ]}
    >
      <Ionicons name={icon} size={16} color={COLORS.textPrimary} />
      <Text style={styles.modeBtnLabel}>{label}</Text>
    </Pressable>
  );
}

function TallyBox({
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
    <View style={[styles.tallyBox, { backgroundColor: color }]}>
      <Text style={styles.tallyLabel}>{label}</Text>
      <Text style={styles.tallyValue} testID={testID}>
        {value}
      </Text>
    </View>
  );
}

function makeStyles(t: Theme) {
  const { colors: COLORS, shadow: SHADOW, shadowNone: SHADOW_NONE, radius: RADIUS, spacing: SPACING } = t;
  return StyleSheet.create({
  modeRow: { flexDirection: "row", gap: SPACING.sm, marginBottom: SPACING.md },
  modeBtn: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 6,
    paddingVertical: 10,
    backgroundColor: COLORS.surface,
    borderWidth: 3,
    borderColor: COLORS.border,
    borderRadius: 999,
    ...SHADOW,
  },
  modeBtnLabel: { fontWeight: "800", fontSize: 13, color: COLORS.textPrimary },
  tallyRow: { flexDirection: "row", gap: SPACING.sm, marginBottom: SPACING.sm },
  tallyBox: {
    flex: 1,
    borderWidth: 3,
    borderColor: COLORS.border,
    borderRadius: RADIUS.lg,
    paddingVertical: 8,
    alignItems: "center",
    ...SHADOW,
  },
  tallyLabel: { fontSize: 10, fontWeight: "800", color: COLORS.textPrimary, letterSpacing: 1 },
  tallyValue: { fontSize: 20, fontWeight: "900", color: COLORS.textPrimary },
  bestPill: {
    alignSelf: "center",
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 5,
    backgroundColor: COLORS.games.ticTacToe,
    borderWidth: 2,
    borderColor: COLORS.border,
    borderRadius: 999,
    marginBottom: SPACING.md,
  },
  bestText: { fontWeight: "800", fontSize: 12, color: COLORS.textPrimary },
  statusWrap: { alignItems: "center", marginBottom: SPACING.md },
  statusText: { fontSize: 18, fontWeight: "800", color: COLORS.textPrimary },
  boardWrap: { alignItems: "center" },
  board: { flexDirection: "row", flexWrap: "wrap", width: 312, gap: 8 },
  cell: {
    width: 96,
    height: 96,
    borderRadius: RADIUS.md,
    borderWidth: 3,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
    alignItems: "center",
    justifyContent: "center",
    ...SHADOW,
  },
  cellPressed: {
    transform: [{ translateX: 3 }, { translateY: 3 }],
    ...SHADOW_NONE,
  },
  mark: { fontSize: 56, fontWeight: "900" },
  endRow: {
    marginTop: SPACING.lg,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: SPACING.sm,
    flexWrap: "wrap",
  },
  playAgain: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: COLORS.surface,
    borderWidth: 3,
    borderColor: COLORS.border,
    borderRadius: 999,
    ...SHADOW,
  },
  pressed: {
    transform: [{ translateX: 3 }, { translateY: 3 }],
    ...SHADOW_NONE,
  },
  playAgainText: { fontSize: 15, fontWeight: "900", color: COLORS.textPrimary },
});
}

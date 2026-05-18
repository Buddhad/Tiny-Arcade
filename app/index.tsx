import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useMemo } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useTheme } from "../src/components/ThemeProvider";
import { feedback } from "../src/utils/feedback";
import { THEME_LABELS, type Theme } from "../src/utils/themes";

type GameDef = {
  id: string;
  title: string;
  subtitle: string;
  colorKey: "ticTacToe" | "memory" | "twenty48" | "snake" | "rps";
  icon: keyof typeof Ionicons.glyphMap;
  route: string;
};

const GAMES: GameDef[] = [
  { id: "tic-tac-toe", title: "Tic Tac Toe", subtitle: "Play vs CPU or 2-player", colorKey: "ticTacToe", icon: "grid-outline", route: "/games/tic-tac-toe" },
  { id: "memory", title: "Memory Match", subtitle: "Flip & find the pairs", colorKey: "memory", icon: "albums-outline", route: "/games/memory" },
  { id: "twenty48", title: "2048", subtitle: "Swipe, merge, conquer", colorKey: "twenty48", icon: "apps-outline", route: "/games/twenty48" },
  { id: "snake", title: "Snake", subtitle: "Eat. Grow. Repeat.", colorKey: "snake", icon: "git-branch-outline", route: "/games/snake" },
  { id: "rps", title: "Rock Paper Scissors", subtitle: "Beat the CPU", colorKey: "rps", icon: "hand-left-outline", route: "/games/rps" },
];

export default function Index() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { theme, themeId, cycleTheme, soundEnabled, setSoundEnabled } = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);

  return (
    <View style={styles.root}>
      <ScrollView
        contentContainerStyle={[
          styles.container,
          { paddingTop: insets.top + theme.spacing.lg, paddingBottom: insets.bottom + theme.spacing.xl },
        ]}
        showsVerticalScrollIndicator={false}
        testID="hub-scroll"
      >
        <View style={styles.headerRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.eyebrow}>WELCOME TO</Text>
            <Text style={styles.title} testID="hub-title">
              Tiny{"\n"}Arcade
            </Text>
          </View>
          <View style={styles.headerActions}>
            <Pressable
              testID="hub-sound-toggle"
              onPress={() => {
                setSoundEnabled(!soundEnabled);
                if (!soundEnabled) feedback.tap();
              }}
              style={({ pressed }) => [styles.iconBtn, pressed && styles.iconBtnPressed]}
              hitSlop={8}
            >
              <Ionicons
                name={soundEnabled ? "volume-high" : "volume-mute"}
                size={20}
                color={theme.colors.textPrimary}
              />
            </Pressable>
            <Pressable
              testID="hub-theme-toggle"
              onPress={() => {
                feedback.tap();
                cycleTheme();
              }}
              style={({ pressed }) => [styles.iconBtn, pressed && styles.iconBtnPressed]}
              hitSlop={8}
            >
              <Ionicons
                name={
                  themeId === "light"
                    ? "sunny"
                    : themeId === "dark"
                      ? "moon"
                      : "eye-outline"
                }
                size={20}
                color={theme.colors.textPrimary}
              />
            </Pressable>
          </View>
        </View>

        <Text style={styles.subtitle}>
          Five tiny games · {THEME_LABELS[themeId]} mode · Sound {soundEnabled ? "on" : "off"}
        </Text>

        <View style={styles.list}>
          {GAMES.map((g, idx) => (
            <Pressable
              key={g.id}
              testID={`hub-card-${g.id}`}
              onPress={() => {
                feedback.tap();
                router.push(g.route as never);
              }}
              style={({ pressed }) => [
                styles.card,
                { backgroundColor: theme.colors.games[g.colorKey] },
                pressed && styles.cardPressed,
              ]}
            >
              <View style={styles.cardRow}>
                <View style={styles.iconBubble}>
                  <Ionicons name={g.icon} size={30} color={theme.colors.textPrimary} />
                </View>
                <View style={styles.cardBody}>
                  <View style={styles.numberPill}>
                    <Text style={styles.numberPillText}>{`0${idx + 1}`}</Text>
                  </View>
                  <Text style={styles.cardTitle}>{g.title}</Text>
                  <Text style={styles.cardSubtitle}>{g.subtitle}</Text>
                </View>
                <View style={styles.arrowBubble}>
                  <Ionicons name="arrow-forward" size={22} color={theme.colors.textPrimary} />
                </View>
              </View>
            </Pressable>
          ))}
        </View>

        <Text style={styles.footer}>Made with ♥ — tap & play</Text>
      </ScrollView>
    </View>
  );
}

function makeStyles(t: Theme) {
  const { colors: COLORS, shadow: SHADOW, shadowNone: SHADOW_NONE, radius: RADIUS, spacing: SPACING } = t;
  return StyleSheet.create({
    root: { flex: 1, backgroundColor: COLORS.background },
    container: { paddingHorizontal: SPACING.lg, gap: SPACING.lg },
    headerRow: {
      flexDirection: "row",
      alignItems: "flex-start",
      gap: SPACING.sm,
      paddingTop: SPACING.md,
    },
    headerActions: { flexDirection: "row", gap: SPACING.sm, marginTop: 6 },
    iconBtn: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: COLORS.surface,
      borderWidth: 3,
      borderColor: COLORS.border,
      alignItems: "center",
      justifyContent: "center",
      ...SHADOW,
    },
    iconBtnPressed: {
      transform: [{ translateX: 3 }, { translateY: 3 }],
      ...SHADOW_NONE,
    },
    eyebrow: {
      fontSize: 12,
      letterSpacing: 2,
      fontWeight: "800",
      color: COLORS.textSecondary,
    },
    title: {
      fontSize: 48,
      lineHeight: 50,
      fontWeight: "900",
      color: COLORS.textPrimary,
      letterSpacing: -1.5,
    },
    subtitle: {
      fontSize: 14,
      color: COLORS.textSecondary,
      fontWeight: "600",
      marginTop: -SPACING.sm,
    },
    list: { gap: SPACING.md, marginTop: SPACING.sm },
    card: {
      borderWidth: 3,
      borderColor: COLORS.border,
      borderRadius: RADIUS.xl,
      padding: SPACING.md,
      ...SHADOW,
    },
    cardPressed: {
      transform: [{ translateX: 4 }, { translateY: 4 }],
      ...SHADOW_NONE,
    },
    cardRow: { flexDirection: "row", alignItems: "center", gap: SPACING.md },
    iconBubble: {
      width: 56,
      height: 56,
      borderRadius: 28,
      backgroundColor: COLORS.surface,
      borderWidth: 3,
      borderColor: COLORS.border,
      alignItems: "center",
      justifyContent: "center",
    },
    cardBody: { flex: 1, gap: 2 },
    numberPill: {
      alignSelf: "flex-start",
      backgroundColor: COLORS.surface,
      borderWidth: 2,
      borderColor: COLORS.border,
      borderRadius: 999,
      paddingHorizontal: 8,
      paddingVertical: 2,
      marginBottom: 4,
    },
    numberPillText: { fontSize: 11, fontWeight: "800", color: COLORS.textPrimary },
    cardTitle: { fontSize: 22, fontWeight: "900", color: COLORS.textPrimary },
    cardSubtitle: { fontSize: 13, fontWeight: "600", color: COLORS.textPrimary, opacity: 0.75 },
    arrowBubble: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: COLORS.surface,
      borderWidth: 3,
      borderColor: COLORS.border,
      alignItems: "center",
      justifyContent: "center",
    },
    footer: {
      textAlign: "center",
      color: COLORS.textSecondary,
      fontWeight: "700",
      marginTop: SPACING.md,
      fontSize: 12,
      letterSpacing: 1.2,
    },
  });
}

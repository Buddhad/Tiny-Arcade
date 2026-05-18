import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { ReactNode, useMemo } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { feedback } from "../utils/feedback";
import { useTheme } from "./ThemeProvider";
import type { Theme } from "../utils/themes";

type Props = {
  title: string;
  accent: string;
  children: ReactNode;
  onRestart?: () => void;
  restartLabel?: string;
};

export default function GameShell({
  title,
  accent,
  children,
  onRestart,
  restartLabel = "Restart",
}: Props) {
  const { theme } = useTheme();
  const { colors: COLORS, shadow: SHADOW, shadowNone: SHADOW_NONE, radius: RADIUS, spacing: SPACING } = theme;
  const styles = useMemo(() => makeStyles(theme), [theme]);
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.root, { backgroundColor: accent }]}>
      <View
        style={[
          styles.header,
          { paddingTop: insets.top + SPACING.sm },
        ]}
      >
        <Pressable
          testID="back-to-hub"
          onPress={() => {
            feedback.tap();
            router.back();
          }}
          style={({ pressed }) => [styles.iconBtn, pressed && styles.iconBtnPressed]}
          hitSlop={10}
        >
          <Ionicons name="arrow-back" size={22} color={COLORS.textPrimary} />
        </Pressable>
        <Text style={styles.title} numberOfLines={1}>
          {title}
        </Text>
        {onRestart ? (
          <Pressable
            testID="game-restart"
            onPress={() => {
              feedback.tap();
              onRestart();
            }}
            style={({ pressed }) => [styles.restartBtn, pressed && styles.iconBtnPressed]}
          >
            <Ionicons name="refresh" size={18} color={COLORS.textPrimary} />
            <Text style={styles.restartLabel}>{restartLabel}</Text>
          </Pressable>
        ) : (
          <View style={styles.iconBtn} />
        )}
      </View>

      <View style={[styles.body, { paddingBottom: insets.bottom + SPACING.md }]}>{children}</View>
    </View>
  );
}

function makeStyles(t: Theme) {
  const { colors: COLORS, shadow: SHADOW, shadowNone: SHADOW_NONE, radius: RADIUS, spacing: SPACING } = t;
  return StyleSheet.create({
  root: { flex: 1 },
  header: {
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.md,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: SPACING.sm,
  },
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
  restartBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.surface,
    borderWidth: 3,
    borderColor: COLORS.border,
    ...SHADOW,
  },
  restartLabel: { fontWeight: "800", fontSize: 13, color: COLORS.textPrimary },
  title: {
    flex: 1,
    textAlign: "center",
    fontSize: 22,
    fontWeight: "900",
    color: COLORS.textPrimary,
    letterSpacing: -0.5,
  },
  body: {
    flex: 1,
    backgroundColor: COLORS.background,
    borderTopLeftRadius: RADIUS.xl,
    borderTopRightRadius: RADIUS.xl,
    borderTopWidth: 3,
    borderColor: COLORS.border,
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.lg,
  },
});
}

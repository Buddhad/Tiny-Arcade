import { Ionicons } from "@expo/vector-icons";
import { useMemo } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { feedback } from "../utils/feedback";
import { shareScore } from "../utils/share";
import { useTheme } from "./ThemeProvider";
import type { Theme } from "../utils/themes";

type Props = {
  game: string;
  line: string;
  color?: string;
  testID?: string;
};

export default function ShareButton({ game, line, color, testID }: Props) {
  const { theme } = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  const bg = color ?? theme.colors.surface;
  return (
    <Pressable
      testID={testID ?? "share-score"}
      onPress={() => {
        feedback.tap();
        shareScore({ game, line });
      }}
      style={({ pressed }) => [
        styles.btn,
        { backgroundColor: bg },
        pressed && styles.pressed,
      ]}
    >
      <Ionicons name="share-social-outline" size={18} color={theme.colors.textPrimary} />
      <Text style={styles.label}>Share</Text>
    </Pressable>
  );
}

function makeStyles(t: Theme) {
  const { colors: COLORS, shadow: SHADOW, shadowNone: SHADOW_NONE } = t;
  return StyleSheet.create({
    btn: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      paddingHorizontal: 18,
      paddingVertical: 10,
      borderWidth: 3,
      borderColor: COLORS.border,
      borderRadius: 999,
      ...SHADOW,
    },
    pressed: {
      transform: [{ translateX: 3 }, { translateY: 3 }],
      ...SHADOW_NONE,
    },
    label: { fontWeight: "800", fontSize: 13, color: COLORS.textPrimary },
  });
}

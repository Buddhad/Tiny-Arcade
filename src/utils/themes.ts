// Theme palettes for Tiny Arcade.
// Three modes: light (default), dark, colorblind-safe (Okabe-Ito palette).
import { Platform, type ViewStyle } from "react-native";

export type ThemeId = "light" | "dark" | "cb";

export type Palette = {
  background: string;
  surface: string;
  textPrimary: string;
  textSecondary: string;
  border: string;
  shadow: string;
  // Inverse contrast for elements that sit on a game-color background.
  onAccent: string;
  games: {
    ticTacToe: string;
    memory: string;
    twenty48: string;
    snake: string;
    snakeBody: string;
    rps: string;
  };
  accent: {
    pink: string;
    blue: string;
    yellow: string;
    green: string;
    orange: string;
  };
  // Misc surfaces
  boardBg: string;
  emptyTile: string;
  modalBackdrop: string;
};

const LIGHT: Palette = {
  background: "#FDFBF7",
  surface: "#FFFFFF",
  textPrimary: "#1A1A24",
  textSecondary: "#4A4A5A",
  border: "#1A1A24",
  shadow: "#1A1A24",
  onAccent: "#1A1A24",
  games: {
    ticTacToe: "#FFD166",
    memory: "#EF476F",
    twenty48: "#06D6A0",
    snake: "#118AB2",
    snakeBody: "#48CAE4",
    rps: "#F4A261",
  },
  accent: {
    pink: "#EF476F",
    blue: "#118AB2",
    yellow: "#FFD166",
    green: "#06D6A0",
    orange: "#F4A261",
  },
  boardBg: "#EAF6FB",
  emptyTile: "#D6CDC4",
  modalBackdrop: "rgba(0,0,0,0.25)",
};

const DARK: Palette = {
  background: "#14141C",
  surface: "#22222E",
  textPrimary: "#F4F4F5",
  textSecondary: "#A1A1AA",
  border: "#F4F4F5",
  shadow: "#000000",
  onAccent: "#14141C",
  games: {
    ticTacToe: "#FFD166",
    memory: "#FF6B91",
    twenty48: "#10E6AE",
    snake: "#4FB8DA",
    snakeBody: "#6FD6E5",
    rps: "#F4A261",
  },
  accent: {
    pink: "#FF6B91",
    blue: "#4FB8DA",
    yellow: "#FFD166",
    green: "#10E6AE",
    orange: "#F4A261",
  },
  boardBg: "#1F2A33",
  emptyTile: "#2A2F3A",
  modalBackdrop: "rgba(0,0,0,0.55)",
};

// Okabe-Ito colorblind-safe palette
const CB: Palette = {
  background: "#FDFBF7",
  surface: "#FFFFFF",
  textPrimary: "#1A1A24",
  textSecondary: "#4A4A5A",
  border: "#1A1A24",
  shadow: "#1A1A24",
  onAccent: "#FFFFFF",
  games: {
    ticTacToe: "#E69F00", // orange
    memory: "#CC79A7", // reddish purple
    twenty48: "#009E73", // bluish green
    snake: "#0072B2", // blue
    snakeBody: "#56B4E9", // sky blue
    rps: "#D55E00", // vermillion
  },
  accent: {
    pink: "#CC79A7",
    blue: "#0072B2",
    yellow: "#E69F00",
    green: "#009E73",
    orange: "#D55E00",
  },
  boardBg: "#EAF6FB",
  emptyTile: "#D6CDC4",
  modalBackdrop: "rgba(0,0,0,0.25)",
};

export const PALETTES: Record<ThemeId, Palette> = {
  light: LIGHT,
  dark: DARK,
  cb: CB,
};

export const THEME_LABELS: Record<ThemeId, string> = {
  light: "Light",
  dark: "Dark",
  cb: "Colorblind",
};

export const THEME_ORDER: ThemeId[] = ["light", "dark", "cb"];

export type Theme = {
  id: ThemeId;
  colors: Palette;
  shadow: ViewStyle;
  shadowNone: ViewStyle;
  radius: { sm: number; md: number; lg: number; xl: number };
  spacing: { xs: number; sm: number; md: number; lg: number; xl: number };
};

export function buildTheme(id: ThemeId): Theme {
  const colors = PALETTES[id];
  const shadow: ViewStyle = Platform.select<ViewStyle>({
    web: {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      boxShadow: `4px 4px 0px ${colors.shadow}` as any,
    },
    default: {
      shadowColor: colors.shadow,
      shadowOffset: { width: 4, height: 4 },
      shadowOpacity: id === "dark" ? 0.5 : 1,
      shadowRadius: 0,
      elevation: 6,
    },
  }) as ViewStyle;
  const shadowNone: ViewStyle = Platform.select<ViewStyle>({
    web: {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      boxShadow: "none" as any,
    },
    default: {
      shadowOpacity: 0,
      elevation: 0,
    },
  }) as ViewStyle;
  return {
    id,
    colors,
    shadow,
    shadowNone,
    radius: { sm: 8, md: 14, lg: 20, xl: 28 },
    spacing: { xs: 4, sm: 8, md: 16, lg: 24, xl: 32 },
  };
}

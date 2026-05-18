// Shared design tokens for the mini-games app (Neo-Brutalist "Vibrant Play")
import { Platform, type ViewStyle } from "react-native";

export const COLORS = {
  background: "#FDFBF7",
  surface: "#FFFFFF",
  textPrimary: "#1A1A24",
  textSecondary: "#4A4A5A",
  border: "#1A1A24",
  shadow: "#1A1A24",
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
};

// Solid block shadow — uses `boxShadow` on web (modern RN) and `shadow*` on native.
export const SHADOW: ViewStyle = Platform.select<ViewStyle>({
  web: {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    boxShadow: "4px 4px 0px #1A1A24" as any,
  },
  default: {
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 6,
  },
}) as ViewStyle;

// "Pressed" no-shadow state — flips off the shadow without triggering web warnings.
export const SHADOW_NONE: ViewStyle = Platform.select<ViewStyle>({
  web: {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    boxShadow: "none" as any,
  },
  default: {
    shadowOpacity: 0,
    elevation: 0,
  },
}) as ViewStyle;

export const RADIUS = {
  sm: 8,
  md: 14,
  lg: 20,
  xl: 28,
};

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
};

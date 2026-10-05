import type { StyleProp, ViewStyle } from "react-native";
import { styles } from "./styles";

export function getPressableStyle(
  baseStyle: StyleProp<ViewStyle>,
  pressed: boolean,
) {
  return [baseStyle, pressed && styles.pressed];
}

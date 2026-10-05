import { Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import type { IconName } from "../types";
import { COLORS } from "../theme";
import { styles } from "../styles";

type IconButtonProps = { name: IconName; onPress: () => void; accessibilityLabel: string; color?: string };

export function IconButton({ name, onPress, accessibilityLabel, color = COLORS.green }: IconButtonProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      onPress={onPress}
      style={({ pressed }) => [styles.iconButton, pressed && styles.pressed]}
    >
      <Ionicons name={name} size={19} color={color} />
    </Pressable>
  );
}

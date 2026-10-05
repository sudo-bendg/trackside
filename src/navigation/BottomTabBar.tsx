import { Pressable, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { COLORS } from "../theme";
import { styles } from "../styles";
import { getPressableStyle } from "../pressableStyle";
import { TABS, type TabKey } from "./tabs";

type BottomTabBarProps = {
  activeTab: TabKey;
  onTabChange: (tab: TabKey) => void;
};

export function BottomTabBar({ activeTab, onTabChange }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.tabBar, { paddingBottom: Math.max(insets.bottom, 10) }]}>
      {TABS.map((tab) => {
        const active = activeTab === tab.key;
        return (
          <Pressable
            key={tab.key}
            accessibilityRole="tab"
            accessibilityState={{ selected: active }}
            onPress={() => onTabChange(tab.key)}
            style={({ pressed }) => getPressableStyle(styles.tabItem, pressed)}
          >
            <Ionicons
              name={active ? tab.activeIcon : tab.icon}
              size={21}
              color={active ? COLORS.green : COLORS.muted}
            />
            <Text style={[styles.tabLabel, active && styles.activeTabLabel]}>
              {tab.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

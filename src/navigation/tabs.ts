export type TabKey = "home" | "log" | "profile";

import type { IconName } from "../types";

export const TABS: ReadonlyArray<{
  key: TabKey;
  label: string;
  icon: IconName;
  activeIcon: IconName;
}> = [
  { key: "home", label: "Home", icon: "home-outline", activeIcon: "home" },
  { key: "log", label: "Log", icon: "add-circle-outline", activeIcon: "add-circle" },
  { key: "profile", label: "Profile", icon: "person-outline", activeIcon: "person" },
];

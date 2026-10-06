import { defineConfig } from "eslint/config";
import expoConfig from "eslint-config-expo/flat.js";

export default defineConfig([
  expoConfig,
  {
    ignores: ["coverage/**", "dist/**", "node_modules/**"],
  },
  {
    files: ["src/navigation/TracksideApp.tsx"],
    rules: {
      "react-hooks/set-state-in-effect": "off",
    },
  },
]);
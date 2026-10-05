import { SQLiteProvider } from "expo-sqlite";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { initializeDatabase } from "./src/database";
import { TracksideApp } from "./src/navigation/TracksideApp";
import { SQLiteIntegrationScreen } from "./src/testing/SQLiteIntegrationScreen";

export default function App() {
  if (process.env.EXPO_PUBLIC_SQLITE_INTEGRATION === "1") {
    return (
      <SafeAreaProvider>
        <SQLiteIntegrationScreen />
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider>
      <SQLiteProvider databaseName="trackside.db" onInit={initializeDatabase}>
        <TracksideApp />
      </SQLiteProvider>
    </SafeAreaProvider>
  );
}

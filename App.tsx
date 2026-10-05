import { SQLiteProvider } from "expo-sqlite";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { initializeDatabase } from "./src/database";
import { TracksideApp } from "./src/navigation/TracksideApp";

export default function App() {
  return (
    <SafeAreaProvider>
      <SQLiteProvider databaseName="trackside.db" onInit={initializeDatabase}>
        <TracksideApp />
      </SQLiteProvider>
    </SafeAreaProvider>
  );
}

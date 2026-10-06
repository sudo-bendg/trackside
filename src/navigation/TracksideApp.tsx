import { useCallback, useEffect, useState } from "react";
import { Alert, View } from "react-native";
import { StatusBar } from "expo-status-bar";
import { useSQLiteContext } from "expo-sqlite";
import * as FileSystem from "expo-file-system/legacy";
import { SafeAreaView } from "react-native-safe-area-context";
import { deleteSighting, getSightings } from "../database";
import type { Sighting } from "../types";
import { getErrorMessage } from "../utils";
import { styles } from "../styles";
import { HomeScreen } from "../screens/HomeScreen";
import { LogScreen } from "../screens/LogScreen";
import { ProfileScreen } from "../screens/ProfileScreen";
import type { TabKey } from "./tabs";
import { BottomTabBar } from "./BottomTabBar";

export function TracksideApp() {
  const database = useSQLiteContext();
  const [activeTab, setActiveTab] = useState<TabKey>("home");
  const [sightings, setSightings] = useState<Sighting[]>([]);
  const [loading, setLoading] = useState(true);

  const refreshSightings = useCallback(async () => {
    try {
      const records = await getSightings(database);
      setSightings(records);
    } catch (error) {
      Alert.alert("Couldn’t load your journal", getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  }, [database]);

  const handleRefresh = useCallback(() => {
    setLoading(true);
    void refreshSightings();
  }, [refreshSightings]);

  useEffect(() => {
    refreshSightings();
  }, [refreshSightings]);

  const handleDelete = async (sighting: Sighting) => {
    try {
      await deleteSighting(database, sighting.sighting_id);
      await refreshSightings();
      const documentDirectory = FileSystem.documentDirectory;
      if (
        sighting.photo_uri &&
        documentDirectory &&
        sighting.photo_uri.startsWith(documentDirectory)
      ) {
        try {
          await FileSystem.deleteAsync(sighting.photo_uri, { idempotent: true });
        } catch (error) {
          Alert.alert("Sighting removed", `Its photo couldn’t be removed: ${getErrorMessage(error)}`);
        }
      }
    } catch (error) {
      Alert.alert("Couldn’t remove this sighting", getErrorMessage(error));
    }
  };

  const handleSaved = async () => {
    await refreshSightings();
    setActiveTab("home");
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <StatusBar style="dark" />
      <View style={styles.flex}>
        {activeTab === "home" ? (
          <HomeScreen
            sightings={sightings}
            onLog={() => setActiveTab("log")}
            onDelete={handleDelete}
            onRefresh={handleRefresh}
            loading={loading}
          />
        ) : activeTab === "log" ? (
          <LogScreen onSaved={handleSaved} />
        ) : (
          <ProfileScreen sightings={sightings} />
        )}
      </View>
      <BottomTabBar activeTab={activeTab} onTabChange={setActiveTab} />
    </SafeAreaView>
  );
}

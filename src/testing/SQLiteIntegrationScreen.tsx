import { useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { openDatabaseAsync, type SQLiteDatabase } from "expo-sqlite";
import { deleteSighting, getSightings, initializeDatabase, saveSighting } from "../database";
import type { Sighting } from "../types";
import { getErrorMessage } from "../utils";

const FIRST_SIGHTING: Sighting = {
  sighting_id: "integration-first",
  tops_number: "37025",
  class_number: "37",
  location_spotted: null,
  location_destination: null,
  photo_uri: null,
  spotted_at: "2026-10-05T10:00:00.000Z",
};

const SECOND_SIGHTING: Sighting = {
  sighting_id: "integration-second",
  tops_number: "334002",
  class_number: "334",
  location_spotted: "Glasgow Central",
  location_destination: "Edinburgh Waverley",
  photo_uri: "file:///test/photo.jpg",
  spotted_at: "2026-10-05T11:00:00.000Z",
};

function assert(condition: boolean, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

async function expectRejected(
  operation: () => Promise<unknown>,
  description: string,
): Promise<void> {
  let rejected = false;
  try {
    await operation();
  } catch {
    rejected = true;
  }
  assert(rejected, `${description} should be rejected.`);
}

export async function runSQLiteIntegrationSuite(): Promise<void> {
  const database: SQLiteDatabase = await openDatabaseAsync(":memory:");
  try {
    await initializeDatabase(database);
    await initializeDatabase(database);
    assert((await getSightings(database)).length === 0, "New database should be empty.");

    await saveSighting(database, FIRST_SIGHTING);
    await saveSighting(database, SECOND_SIGHTING);
    const sightings = await getSightings(database);
    assert(sightings.length === 2, "Both sightings should be persisted.");
    assert(
      sightings[0].sighting_id === SECOND_SIGHTING.sighting_id,
      "Sightings should be ordered newest first.",
    );
    assert(
      sightings[1].location_spotted === null &&
        sightings[1].location_destination === null &&
        sightings[1].photo_uri === null,
      "Empty optional fields should be stored as SQL NULL.",
    );

    await expectRejected(
      () => saveSighting(database, FIRST_SIGHTING),
      "Duplicate primary key",
    );
    await expectRejected(
      () => database.runAsync("INSERT INTO missing_table (id) VALUES (?)", 1),
      "Invalid SQL operation",
    );

    await deleteSighting(database, FIRST_SIGHTING.sighting_id);
    const remaining = await getSightings(database);
    assert(
      remaining.length === 1 && remaining[0].sighting_id === SECOND_SIGHTING.sighting_id,
      "Deleting one sighting should preserve the other.",
    );
  } finally {
    await database.closeAsync();
  }
}

export function SQLiteIntegrationScreen() {
  const [status, setStatus] = useState<"NOT RUN" | "RUNNING" | "PASS" | "FAIL">("NOT RUN");
  const [details, setDetails] = useState<string | null>(null);

  const runSuite = async () => {
    setStatus("RUNNING");
    setDetails(null);
    try {
      await runSQLiteIntegrationSuite();
      setStatus("PASS");
    } catch (error) {
      setStatus("FAIL");
      setDetails(getErrorMessage(error));
    }
  };

  return (
    <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: "center", padding: 24 }}>
      <View style={{ gap: 16 }}>
        <Text style={{ fontSize: 24, fontWeight: "700" }}>Native SQLite integration</Text>
        <Text testID="sqlite-integration-status">SQLite integration: {status}</Text>
        {details ? <Text testID="sqlite-integration-error">{details}</Text> : null}
        <Pressable
          accessibilityRole="button"
          onPress={runSuite}
          disabled={status === "RUNNING"}
          style={{ backgroundColor: "#28583F", padding: 16, borderRadius: 12 }}
        >
          <Text style={{ color: "#FFFFFF", textAlign: "center", fontWeight: "700" }}>
            Run SQLite integration suite
          </Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

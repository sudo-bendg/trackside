import { fireEvent, render, screen, waitFor } from "@testing-library/react-native";
import { openDatabaseAsync, type SQLiteDatabase } from "expo-sqlite";
import {
  SQLiteIntegrationScreen,
  runSQLiteIntegrationSuite,
} from "./SQLiteIntegrationScreen";
import type { Sighting } from "../types";

const mockOpenDatabase = jest.mocked(openDatabaseAsync);

function createDatabase(options: { allowDuplicate?: boolean; returnEmptyAfterInsert?: boolean } = {}) {
  const rows: Sighting[] = [];
  let reads = 0;
  const database = {
    execAsync: jest.fn().mockResolvedValue(undefined),
    getAllAsync: jest.fn().mockImplementation(async () => {
      reads += 1;
      if (options.returnEmptyAfterInsert && reads > 1) {
        return [];
      }
      return [...rows].sort((first, second) =>
        second.spotted_at.localeCompare(first.spotted_at),
      );
    }),
    runAsync: jest.fn().mockImplementation(async (sql: string, ...values: unknown[]) => {
      if (sql.includes("INSERT INTO sightings")) {
        const [id, topsNumber, classNumber, location, destination, photo, spottedAt] =
          values as [string, string, string, string | null, string | null, string | null, string];
        if (rows.some((row) => row.sighting_id === id)) {
          if (options.allowDuplicate) return {};
          throw new Error("duplicate primary key");
        }
        rows.push({
          sighting_id: id,
          tops_number: topsNumber,
          class_number: classNumber,
          location_spotted: location,
          location_destination: destination,
          photo_uri: photo,
          spotted_at: spottedAt,
        });
        return {};
      }
      if (sql.includes("DELETE FROM sightings")) {
        const [id] = values as [string];
        const index = rows.findIndex((row) => row.sighting_id === id);
        if (index >= 0) rows.splice(index, 1);
        return {};
      }
      if (sql.includes("missing_table")) {
        throw new Error("no such table");
      }
      return {};
    }),
    closeAsync: jest.fn().mockResolvedValue(undefined),
  };
  return database;
}

describe("native SQLite integration harness", () => {
  beforeEach(() => {
    mockOpenDatabase.mockReset();
  });

  it("runs CRUD, schema, ordering, nullability, and error checks against its database connection", async () => {
    const database = createDatabase();
    mockOpenDatabase.mockResolvedValue(database as unknown as SQLiteDatabase);

    await expect(runSQLiteIntegrationSuite()).resolves.toBeUndefined();

    expect(mockOpenDatabase).toHaveBeenCalledWith(":memory:");
    expect(database.execAsync).toHaveBeenCalledTimes(2);
    expect(database.closeAsync).toHaveBeenCalledTimes(1);
  });

  it("displays successful integration results", async () => {
    mockOpenDatabase.mockResolvedValue(
      createDatabase() as unknown as SQLiteDatabase,
    );
    render(<SQLiteIntegrationScreen />);

    fireEvent.press(screen.getByRole("button", { name: "Run SQLite integration suite" }));

    await waitFor(() =>
      expect(screen.getByTestId("sqlite-integration-status").props.children).toContain(
        "PASS",
      ),
    );
  });

  it("displays database-open failures", async () => {
    mockOpenDatabase.mockRejectedValueOnce(new Error("native module unavailable"));
    render(<SQLiteIntegrationScreen />);

    fireEvent.press(screen.getByRole("button", { name: "Run SQLite integration suite" }));

    await waitFor(() =>
      expect(screen.getByTestId("sqlite-integration-status").props.children).toContain(
        "FAIL",
      ),
    );
    expect(screen.getByTestId("sqlite-integration-error").props.children).toBe(
      "native module unavailable",
    );
  });

  it("fails when the real database returns invalid results", async () => {
    mockOpenDatabase.mockResolvedValue(
      createDatabase({ returnEmptyAfterInsert: true }) as unknown as SQLiteDatabase,
    );

    await expect(runSQLiteIntegrationSuite()).rejects.toThrow(
      "Both sightings should be persisted.",
    );
  });

  it("fails when a duplicate insert unexpectedly succeeds", async () => {
    mockOpenDatabase.mockResolvedValue(
      createDatabase({ allowDuplicate: true }) as unknown as SQLiteDatabase,
    );

    await expect(runSQLiteIntegrationSuite()).rejects.toThrow(
      "Duplicate primary key should be rejected.",
    );
  });
});

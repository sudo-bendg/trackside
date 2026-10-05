import type { SQLiteDatabase } from "expo-sqlite";
import {
  deleteSighting,
  getSightings,
  initializeDatabase,
  saveSighting,
} from "./database";
import type { Sighting } from "./types";

const makeDatabase = () => ({
  execAsync: jest.fn<Promise<void>, [string]>().mockResolvedValue(undefined),
  getAllAsync: jest.fn<Promise<Sighting[]>, [string]>().mockResolvedValue([]),
  runAsync: jest.fn<Promise<unknown>, [string, ...unknown[]]>().mockResolvedValue({}),
});

const sighting: Sighting = {
  sighting_id: "id-1",
  tops_number: "37025",
  class_number: "37",
  location_spotted: "",
  location_destination: "",
  photo_uri: "",
  spotted_at: "2026-10-05T10:00:00.000Z",
};

describe("SQLite data access", () => {
  it("creates the sightings table, required fields, and date index", async () => {
    const database = makeDatabase();

    await initializeDatabase(database as unknown as SQLiteDatabase);

    expect(database.execAsync).toHaveBeenCalledTimes(1);
    expect(database.execAsync.mock.calls[0][0]).toContain(
      "CREATE TABLE IF NOT EXISTS sightings",
    );
    expect(database.execAsync.mock.calls[0][0]).toContain(
      "sighting_id TEXT PRIMARY KEY NOT NULL",
    );
    expect(database.execAsync.mock.calls[0][0]).toContain(
      "tops_number TEXT NOT NULL",
    );
    expect(database.execAsync.mock.calls[0][0]).toContain(
      "CREATE INDEX IF NOT EXISTS sightings_spotted_at_idx",
    );
  });

  it("returns the query result ordered by newest sighting first", async () => {
    const rows = [sighting];
    const database = makeDatabase();
    database.getAllAsync.mockResolvedValue(rows);

    await expect(getSightings(database as unknown as SQLiteDatabase)).resolves.toBe(
      rows,
    );
    expect(database.getAllAsync.mock.calls[0][0]).toContain("ORDER BY spotted_at DESC");
  });

  it("inserts all fields and stores blank optional values as SQL NULL", async () => {
    const database = makeDatabase();

    await saveSighting(database as unknown as SQLiteDatabase, sighting);

    expect(database.runAsync).toHaveBeenCalledWith(
      expect.stringContaining("INSERT INTO sightings"),
      "id-1",
      "37025",
      "37",
      null,
      null,
      null,
      "2026-10-05T10:00:00.000Z",
    );
  });

  it("preserves non-empty optional fields when inserting", async () => {
    const database = makeDatabase();
    const completeSighting = {
      ...sighting,
      location_spotted: "Glasgow Central",
      location_destination: "Edinburgh Waverley",
      photo_uri: "file:///sighting.jpg",
    };

    await saveSighting(database as unknown as SQLiteDatabase, completeSighting);

    expect(database.runAsync.mock.calls[0].slice(1)).toEqual([
      "id-1",
      "37025",
      "37",
      "Glasgow Central",
      "Edinburgh Waverley",
      "file:///sighting.jpg",
      "2026-10-05T10:00:00.000Z",
    ]);
  });

  it("deletes by sighting ID", async () => {
    const database = makeDatabase();

    await deleteSighting(database as unknown as SQLiteDatabase, "id-1");

    expect(database.runAsync).toHaveBeenCalledWith(
      "DELETE FROM sightings WHERE sighting_id = ?",
      "id-1",
    );
  });

  it("propagates database errors from setup, reads, writes, and deletes", async () => {
    const database = makeDatabase();
    const failure = new Error("sqlite unavailable");
    database.execAsync.mockRejectedValue(failure);
    database.getAllAsync.mockRejectedValue(failure);
    database.runAsync.mockRejectedValue(failure);

    await expect(initializeDatabase(database as unknown as SQLiteDatabase)).rejects.toBe(
      failure,
    );
    await expect(getSightings(database as unknown as SQLiteDatabase)).rejects.toBe(
      failure,
    );
    await expect(
      saveSighting(database as unknown as SQLiteDatabase, sighting),
    ).rejects.toBe(failure);
    await expect(
      deleteSighting(database as unknown as SQLiteDatabase, "id-1"),
    ).rejects.toBe(failure);
  });
});

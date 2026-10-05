export async function initializeDatabase(database) {
  await database.execAsync(`
    PRAGMA journal_mode = WAL;
    CREATE TABLE IF NOT EXISTS sightings (
      sighting_id TEXT PRIMARY KEY NOT NULL,
      tops_number TEXT NOT NULL,
      class_number TEXT NOT NULL,
      location_spotted TEXT,
      location_destination TEXT,
      photo_uri TEXT,
      spotted_at TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS sightings_spotted_at_idx
      ON sightings (spotted_at DESC);
  `);
}

export async function getSightings(database) {
  return database.getAllAsync(`
    SELECT sighting_id, tops_number, class_number, location_spotted,
      location_destination, photo_uri, spotted_at
    FROM sightings
    ORDER BY spotted_at DESC
  `);
}

export async function saveSighting(database, sighting) {
  await database.runAsync(
    `INSERT INTO sightings (
      sighting_id, tops_number, class_number, location_spotted,
      location_destination, photo_uri, spotted_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
    sighting.sighting_id,
    sighting.tops_number,
    sighting.class_number,
    sighting.location_spotted || null,
    sighting.location_destination || null,
    sighting.photo_uri || null,
    sighting.spotted_at,
  );
}

export async function deleteSighting(database, sightingId) {
  await database.runAsync(
    "DELETE FROM sightings WHERE sighting_id = ?",
    sightingId,
  );
}

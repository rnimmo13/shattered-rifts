// The SQL for which ghost rows can be met and listed (kept apart so a test can run it against a plain SQLite database).

/**
 * A deck saved before runs were told apart left one `ghosts` row for every save of the same run, so such a row (no `run`) is hidden once the
 * same player has a later ghost of the same Riftwalker: only the latest of those is shown. Rows that know their run are always shown (a
 * second run is a second deck). Nothing is deleted, so the records stay.
 */
export const CURRENT_GHOSTS_VIEW = `CREATE VIEW current_ghosts AS
  SELECT g.* FROM ghosts g
   WHERE g.run IS NOT NULL
      OR NOT EXISTS (
           SELECT 1 FROM ghosts n
            WHERE n.owner = g.owner AND n.hero = g.hero AND n.id != g.id
              AND (n.last_at > g.last_at OR (n.last_at = g.last_at AND n.id > g.id)))`;

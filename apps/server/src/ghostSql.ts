// The SQL for which ghost rows can be met and listed (kept apart so a test can run it against a plain SQLite database).

/**
 * A deck saved before runs were told apart left one `ghosts` row for every save of the same run, so such a row (no `run`) is hidden once the
 * same player has a later ghost of the same Riftwalker: only the latest of those is shown. Rows that know their run are always shown (a
 * second run is a second deck). Nothing is deleted, so the records stay.
 */
/** A ghost must have cleared Tier 3 (all three stages; GHOST_BOSS_MIN_TIER, DECISIONS #235): the rows that have not, in SQL. */
export const UNCLEARED_GHOSTS = `tier < 3 OR (tier = 3 AND COALESCE(stage, 0) < 3)`;

export const CURRENT_GHOSTS_VIEW = `CREATE VIEW current_ghosts AS
  SELECT g.* FROM ghosts g
   WHERE (g.tier > 3 OR (g.tier = 3 AND COALESCE(g.stage, 0) >= 3))
     AND (g.run IS NOT NULL
      OR NOT EXISTS (
           SELECT 1 FROM ghosts n
            WHERE n.owner = g.owner AND n.hero = g.hero AND n.id != g.id
              AND (n.last_at > g.last_at OR (n.last_at = g.last_at AND n.id > g.id))))`;

-- ============================================================
-- FUTDB — Esquema PostgreSQL para minijuegos de fútbol
-- Datos de referencia (solo lectura para el cliente).
-- Los CSV se importan aparte con \copy (psql).
-- ============================================================

-- ---------- ENTIDADES BASE ----------

CREATE TABLE countries (
  country_pk     INTEGER PRIMARY KEY,
  country_name   TEXT NOT NULL UNIQUE,
  country_id     INTEGER,            -- id Transfermarkt (puede ser NULL)
  confederation  TEXT,
  flag_url       TEXT
);

CREATE TABLE competitions (
  competition_id    TEXT PRIMARY KEY,   -- ej. 'ES1', 'CL', 'GB1'
  competition_code  TEXT,
  name              TEXT NOT NULL,
  sub_type          TEXT,
  type              TEXT,               -- domestic_league | domestic_cup | international_cup
  country_id        INTEGER,
  country_name      TEXT,
  domestic_league_code TEXT,
  confederation     TEXT,
  total_clubs       INTEGER,
  url               TEXT,
  logo_url          TEXT
);

CREATE TABLE clubs (
  club_id        INTEGER PRIMARY KEY,
  club_code      TEXT,
  name           TEXT NOT NULL,
  domestic_competition_id TEXT REFERENCES competitions(competition_id),
  total_market_value NUMERIC,
  squad_size     INTEGER,
  average_age    NUMERIC,
  foreigners_number INTEGER,
  foreigners_percentage NUMERIC,
  national_team_players INTEGER,
  stadium_name   TEXT,
  stadium_seats  INTEGER,
  net_transfer_record TEXT,
  coach_name     TEXT,
  last_season    INTEGER,
  filename       TEXT,
  url            TEXT,
  logo_url       TEXT
);

CREATE TABLE national_teams (
  national_team_id INTEGER PRIMARY KEY,
  name           TEXT NOT NULL,
  team_code      TEXT,
  country_id     INTEGER,
  country_name   TEXT,
  country_code   TEXT,
  confederation  TEXT,
  team_image_url TEXT,
  squad_size     INTEGER,
  average_age    NUMERIC,
  foreigners_number INTEGER,
  foreigners_percentage NUMERIC,
  total_market_value NUMERIC,
  coach_name     TEXT,
  fifa_ranking   INTEGER,
  last_season    INTEGER,
  url            TEXT
);

CREATE TABLE players (
  player_id      INTEGER PRIMARY KEY,
  first_name     TEXT,
  last_name      TEXT,
  name           TEXT NOT NULL,
  last_season    INTEGER,
  current_club_id INTEGER REFERENCES clubs(club_id),
  player_code    TEXT,
  country_of_birth TEXT,
  city_of_birth  TEXT,
  country_of_citizenship TEXT,
  date_of_birth  DATE,
  sub_position   TEXT,
  position       TEXT,
  foot           TEXT,
  height_in_cm   NUMERIC,
  contract_expiration_date DATE,
  agent_name     TEXT,
  image_url      TEXT,               -- foto oficial Transfermarkt (100% cobertura)
  international_caps  INTEGER,
  international_goals INTEGER,
  current_national_team_id INTEGER REFERENCES national_teams(national_team_id),
  url            TEXT,
  current_club_domestic_competition_id TEXT,
  current_club_name TEXT,
  market_value_in_eur NUMERIC,
  highest_market_value_in_eur NUMERIC
);

CREATE TABLE managers (
  manager_id     INTEGER PRIMARY KEY,
  wikidata_id    TEXT UNIQUE,
  name           TEXT NOT NULL,
  date_of_birth  DATE,
  nationality    TEXT,
  image_url      TEXT                -- foto Wikimedia Commons (licencia libre)
);

CREATE TABLE stadiums (
  stadium_id     INTEGER PRIMARY KEY,
  stadium_name   TEXT NOT NULL,
  capacity       INTEGER,
  club_id        INTEGER REFERENCES clubs(club_id),
  club_name      TEXT
);

CREATE TABLE positions (
  position_id    INTEGER PRIMARY KEY,
  name_en        TEXT,
  name_es        TEXT,
  code           TEXT,
  category       TEXT
);

CREATE TABLE formations (
  formation_id   INTEGER PRIMARY KEY,
  name           TEXT NOT NULL,
  positions      TEXT                -- lista de codes separada por comas
);

CREATE TABLE awards (
  award_id  INTEGER PRIMARY KEY,
  name      TEXT NOT NULL,
  organizer TEXT,
  since     INTEGER
);

CREATE TABLE trophies (
  trophy_id     INTEGER PRIMARY KEY,
  name          TEXT NOT NULL,
  scope         TEXT,               -- 'club' | 'international'
  confederation TEXT
);

-- ---------- TABLAS PUENTE / HECHOS ----------

CREATE TABLE player_clubs (              -- historial real de clubes (derivado de partidos jugados)
  player_id    INTEGER REFERENCES players(player_id),
  club_id      INTEGER,                  -- algunos clubes menores no están en clubs
  first_season INTEGER,
  last_season  INTEGER,
  matches INTEGER, goals INTEGER, assists INTEGER, minutes INTEGER,
  PRIMARY KEY (player_id, club_id)
);

CREATE TABLE player_season_stats (       -- la tabla más rica: jugador×club×temporada×competición
  player_id INTEGER REFERENCES players(player_id),
  club_id   INTEGER,
  season    INTEGER,
  competition_id TEXT REFERENCES competitions(competition_id),
  matches INTEGER, goals INTEGER, assists INTEGER,
  minutes INTEGER, yellow_cards INTEGER, red_cards INTEGER,
  PRIMARY KEY (player_id, club_id, season, competition_id)
);

CREATE TABLE season_rosters (            -- plantilla de cada club por temporada
  club_id   INTEGER,
  season    INTEGER,
  player_id INTEGER REFERENCES players(player_id),
  matches INTEGER, goals INTEGER, assists INTEGER, minutes INTEGER,
  PRIMARY KEY (club_id, season, player_id)
);

CREATE TABLE player_competitions (       -- en qué competiciones jugó cada futbolista
  player_id INTEGER REFERENCES players(player_id),
  competition_id TEXT REFERENCES competitions(competition_id),
  seasons INTEGER, matches INTEGER, goals INTEGER, assists INTEGER,
  first_season INTEGER, last_season INTEGER,
  PRIMARY KEY (player_id, competition_id)
);

CREATE TABLE player_national_teams (
  player_id INTEGER REFERENCES players(player_id),
  national_team_id INTEGER REFERENCES national_teams(national_team_id),
  caps INTEGER, goals INTEGER,
  PRIMARY KEY (player_id, national_team_id)
);

CREATE TABLE transfers (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  player_id INTEGER REFERENCES players(player_id),
  transfer_date DATE,
  transfer_season TEXT,
  from_club_id INTEGER, to_club_id INTEGER,
  from_club_name TEXT, to_club_name TEXT,
  transfer_fee NUMERIC, market_value_in_eur NUMERIC,
  player_name TEXT
);

CREATE TABLE manager_clubs (             -- historial de equipos dirigidos (Wikidata)
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  manager_id INTEGER REFERENCES managers(manager_id),
  club_id    INTEGER REFERENCES clubs(club_id),  -- NULL si no se pudo mapear a Transfermarkt
  team_name  TEXT,
  team_wikidata_id TEXT,
  start_date DATE, end_date DATE
);

CREATE TABLE award_winners (
  award_id INTEGER REFERENCES awards(award_id),
  year INTEGER,
  player_name TEXT,
  player_id INTEGER REFERENCES players(player_id),  -- NULL para históricos retirados
  PRIMARY KEY (award_id, year)
);

CREATE TABLE trophy_winners (
  trophy_id INTEGER REFERENCES trophies(trophy_id),
  year INTEGER,
  winner_name TEXT,                  -- club o selección
  club_id INTEGER REFERENCES clubs(club_id),
  PRIMARY KEY (trophy_id, year)
);

-- ---------- VISTAS DERIVADAS (relaciones "gratis") ----------
-- security_invoker: la vista respeta las políticas RLS del usuario que
-- consulta (sin esto, las vistas corren con permisos del creador y saltan RLS).

-- Compañeros de equipo: NO se materializa (serían decenas de millones de filas).
CREATE VIEW player_teammates WITH (security_invoker = true) AS
SELECT a.player_id, b.player_id AS teammate_id, a.club_id, a.season
FROM season_rosters a
JOIN season_rosters b
  ON a.club_id = b.club_id AND a.season = b.season AND a.player_id <> b.player_id;

-- Entrenador ↔ jugadores entrenados: cruce de periodos de dirección con temporadas
CREATE VIEW manager_players WITH (security_invoker = true) AS
SELECT DISTINCT mc.manager_id, sr.player_id, sr.club_id, sr.season
FROM manager_clubs mc
JOIN season_rosters sr
  ON sr.club_id = mc.club_id
 AND sr.season BETWEEN COALESCE(EXTRACT(YEAR FROM mc.start_date)::int, 1900)
               AND COALESCE(EXTRACT(YEAR FROM mc.end_date)::int, 2100)
WHERE mc.club_id IS NOT NULL;

-- ---------- ÍNDICES PARA LOS MINIJUEGOS ----------
CREATE INDEX idx_players_name ON players (name);
CREATE INDEX idx_players_citizenship ON players (country_of_citizenship);
CREATE INDEX idx_players_position ON players (position, sub_position);
CREATE INDEX idx_players_mv ON players (market_value_in_eur DESC NULLS LAST);
CREATE INDEX idx_rosters_club_season ON season_rosters (club_id, season);
CREATE INDEX idx_rosters_player ON season_rosters (player_id);
CREATE INDEX idx_pclubs_club ON player_clubs (club_id);
CREATE INDEX idx_pcomp_comp ON player_competitions (competition_id);
CREATE INDEX idx_transfers_player ON transfers (player_id);
CREATE INDEX idx_mgrclubs_club ON manager_clubs (club_id);
CREATE INDEX idx_mgrclubs_manager ON manager_clubs (manager_id);
CREATE INDEX idx_pss_comp_season ON player_season_stats (competition_id, season, goals DESC);

-- ---------- RLS: datos públicos de solo lectura ----------
-- Las tablas viven en el schema `public` (expuesto vía Data API), así que RLS
-- es obligatorio. Son datos de referencia: lectura para todos, escritura solo
-- desde el servidor (Prisma conecta como `postgres`, dueño de las tablas).

DO $$
DECLARE t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'countries','competitions','clubs','national_teams','players','managers',
    'stadiums','positions','formations','awards','trophies',
    'player_clubs','player_season_stats','season_rosters','player_competitions',
    'player_national_teams','transfers','manager_clubs','award_winners','trophy_winners'
  ] LOOP
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', t);
    EXECUTE format(
      'CREATE POLICY "futdb_public_read" ON %I FOR SELECT TO anon, authenticated USING (true)',
      t
    );
  END LOOP;
END $$;

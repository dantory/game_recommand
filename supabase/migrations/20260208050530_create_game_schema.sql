-- =============================================================
-- Game Discovery Schema
-- Master tables + M:N joins + denormalized arrays for fast recs
-- =============================================================

-- Master: genres
CREATE TABLE genres (
  id   INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE
);

-- Master: themes
CREATE TABLE themes (
  id   INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE
);

-- Master: game modes (single, multiplayer, coop, mmo, etc.)
CREATE TABLE game_modes (
  id   INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE
);

-- Master: platforms
CREATE TABLE platforms (
  id   INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE
);

-- Master: player perspectives (first_person, third_person, etc.)
CREATE TABLE player_perspectives (
  id   INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE
);

-- Master: companies
CREATE TABLE companies (
  id   INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT
);

-- Master: keywords
CREATE TABLE keywords (
  id   INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE
);

-- =============================================================
-- Games (core table with denormalized arrays for recommendation)
-- =============================================================
CREATE TABLE games (
  id                  INTEGER PRIMARY KEY,
  name                TEXT NOT NULL,
  slug                TEXT,
  summary             TEXT,
  storyline           TEXT,
  cover_image_id      TEXT,
  rating              DOUBLE PRECISION,
  rating_count        INTEGER DEFAULT 0,
  aggregated_rating   DOUBLE PRECISION,
  total_rating        DOUBLE PRECISION,
  first_release_date  TIMESTAMPTZ,
  category            INTEGER DEFAULT 0,
  status              INTEGER,
  hypes               INTEGER DEFAULT 0,

  genre_ids           INTEGER[] DEFAULT '{}',
  theme_ids           INTEGER[] DEFAULT '{}',
  mode_ids            INTEGER[] DEFAULT '{}',
  platform_ids        INTEGER[] DEFAULT '{}',
  perspective_ids     INTEGER[] DEFAULT '{}',
  keyword_ids         INTEGER[] DEFAULT '{}',
  developer_ids       INTEGER[] DEFAULT '{}',

  search_tsv          TSVECTOR,

  raw_igdb            JSONB,
  igdb_updated_at     TIMESTAMPTZ,

  created_at          TIMESTAMPTZ DEFAULT NOW(),
  updated_at          TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================================
-- M:N join tables
-- =============================================================
CREATE TABLE game_genres (
  game_id  INTEGER NOT NULL REFERENCES games(id) ON DELETE CASCADE,
  genre_id INTEGER NOT NULL REFERENCES genres(id) ON DELETE CASCADE,
  PRIMARY KEY (game_id, genre_id)
);

CREATE TABLE game_themes (
  game_id  INTEGER NOT NULL REFERENCES games(id) ON DELETE CASCADE,
  theme_id INTEGER NOT NULL REFERENCES themes(id) ON DELETE CASCADE,
  PRIMARY KEY (game_id, theme_id)
);

CREATE TABLE game_game_modes (
  game_id  INTEGER NOT NULL REFERENCES games(id) ON DELETE CASCADE,
  mode_id  INTEGER NOT NULL REFERENCES game_modes(id) ON DELETE CASCADE,
  PRIMARY KEY (game_id, mode_id)
);

CREATE TABLE game_platforms (
  game_id     INTEGER NOT NULL REFERENCES games(id) ON DELETE CASCADE,
  platform_id INTEGER NOT NULL REFERENCES platforms(id) ON DELETE CASCADE,
  PRIMARY KEY (game_id, platform_id)
);

CREATE TABLE game_perspectives (
  game_id        INTEGER NOT NULL REFERENCES games(id) ON DELETE CASCADE,
  perspective_id INTEGER NOT NULL REFERENCES player_perspectives(id) ON DELETE CASCADE,
  PRIMARY KEY (game_id, perspective_id)
);

CREATE TABLE game_companies (
  game_id    INTEGER NOT NULL REFERENCES games(id) ON DELETE CASCADE,
  company_id INTEGER NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  role       TEXT NOT NULL DEFAULT 'developer',
  PRIMARY KEY (game_id, company_id, role)
);

CREATE TABLE game_keywords (
  game_id    INTEGER NOT NULL REFERENCES games(id) ON DELETE CASCADE,
  keyword_id INTEGER NOT NULL REFERENCES keywords(id) ON DELETE CASCADE,
  PRIMARY KEY (game_id, keyword_id)
);

-- =============================================================
-- Media
-- =============================================================
CREATE TABLE game_screenshots (
  id       SERIAL PRIMARY KEY,
  game_id  INTEGER NOT NULL REFERENCES games(id) ON DELETE CASCADE,
  image_id TEXT NOT NULL
);

CREATE TABLE game_videos (
  id       SERIAL PRIMARY KEY,
  game_id  INTEGER NOT NULL REFERENCES games(id) ON DELETE CASCADE,
  video_id TEXT NOT NULL
);

-- =============================================================
-- Similarity + recommendations
-- =============================================================
CREATE TABLE game_similar (
  game_id         INTEGER NOT NULL REFERENCES games(id) ON DELETE CASCADE,
  similar_game_id INTEGER NOT NULL REFERENCES games(id) ON DELETE CASCADE,
  source          TEXT NOT NULL DEFAULT 'igdb',
  PRIMARY KEY (game_id, similar_game_id)
);

CREATE TABLE game_recommendations (
  game_id     INTEGER NOT NULL REFERENCES games(id) ON DELETE CASCADE,
  rec_game_id INTEGER NOT NULL REFERENCES games(id) ON DELETE CASCADE,
  score       DOUBLE PRECISION NOT NULL,
  computed_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (game_id, rec_game_id)
);

-- =============================================================
-- Indexes: GIN on denormalized arrays
-- =============================================================
CREATE INDEX idx_games_genre_ids       ON games USING GIN (genre_ids);
CREATE INDEX idx_games_theme_ids       ON games USING GIN (theme_ids);
CREATE INDEX idx_games_mode_ids        ON games USING GIN (mode_ids);
CREATE INDEX idx_games_keyword_ids     ON games USING GIN (keyword_ids);
CREATE INDEX idx_games_perspective_ids ON games USING GIN (perspective_ids);
CREATE INDEX idx_games_developer_ids   ON games USING GIN (developer_ids);
CREATE INDEX idx_games_platform_ids    ON games USING GIN (platform_ids);

-- Full-text search
CREATE INDEX idx_games_search_tsv ON games USING GIN (search_tsv);

-- Sorting / filtering
CREATE INDEX idx_games_rating_count ON games (rating_count DESC NULLS LAST);
CREATE INDEX idx_games_rating       ON games (rating DESC NULLS LAST);
CREATE INDEX idx_games_total_rating ON games (total_rating DESC NULLS LAST);
CREATE INDEX idx_games_release_date ON games (first_release_date DESC NULLS LAST);
CREATE INDEX idx_games_hypes        ON games (hypes DESC NULLS LAST);

-- Recommendations lookup
CREATE INDEX idx_game_recs_score ON game_recommendations (game_id, score DESC);

-- Join table reverse lookups
CREATE INDEX idx_game_genres_genre     ON game_genres (genre_id);
CREATE INDEX idx_game_themes_theme     ON game_themes (theme_id);
CREATE INDEX idx_game_platforms_plat   ON game_platforms (platform_id);
CREATE INDEX idx_game_companies_comp   ON game_companies (company_id);
CREATE INDEX idx_game_keywords_kw      ON game_keywords (keyword_id);
CREATE INDEX idx_game_screenshots_game ON game_screenshots (game_id);
CREATE INDEX idx_game_videos_game      ON game_videos (game_id);

-- =============================================================
-- Trigger: auto-update search_tsv on insert/update
-- =============================================================
CREATE OR REPLACE FUNCTION games_search_tsv_trigger() RETURNS TRIGGER AS $$
BEGIN
  NEW.search_tsv :=
    setweight(to_tsvector('simple', COALESCE(NEW.name, '')), 'A') ||
    setweight(to_tsvector('simple', COALESCE(NEW.summary, '')), 'B');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_games_search_tsv
  BEFORE INSERT OR UPDATE OF name, summary ON games
  FOR EACH ROW
  EXECUTE FUNCTION games_search_tsv_trigger();

-- =============================================================
-- Trigger: auto-update updated_at
-- =============================================================
CREATE OR REPLACE FUNCTION update_updated_at() RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_games_updated_at
  BEFORE UPDATE ON games
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- =============================================================
-- RLS: public read-only access
-- =============================================================
ALTER TABLE games ENABLE ROW LEVEL SECURITY;
ALTER TABLE genres ENABLE ROW LEVEL SECURITY;
ALTER TABLE themes ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_modes ENABLE ROW LEVEL SECURITY;
ALTER TABLE platforms ENABLE ROW LEVEL SECURITY;
ALTER TABLE player_perspectives ENABLE ROW LEVEL SECURITY;
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE keywords ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_genres ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_themes ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_game_modes ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_platforms ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_perspectives ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_keywords ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_screenshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_videos ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_similar ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_recommendations ENABLE ROW LEVEL SECURITY;

DO $$
DECLARE
  tbl TEXT;
BEGIN
  FOR tbl IN
    SELECT unnest(ARRAY[
      'games', 'genres', 'themes', 'game_modes', 'platforms',
      'player_perspectives', 'companies', 'keywords',
      'game_genres', 'game_themes', 'game_game_modes', 'game_platforms',
      'game_perspectives', 'game_companies', 'game_keywords',
      'game_screenshots', 'game_videos', 'game_similar', 'game_recommendations'
    ])
  LOOP
    EXECUTE format(
      'CREATE POLICY "public_read_%s" ON %I FOR SELECT TO anon, authenticated USING (true)',
      tbl, tbl
    );
  END LOOP;
END;
$$;
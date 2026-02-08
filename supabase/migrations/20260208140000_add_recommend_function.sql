-- Enable intarray extension for array set operations (&, |, icount)
CREATE EXTENSION IF NOT EXISTS intarray WITH SCHEMA public;

-- ---------------------------------------------------------------------------
-- Helper: Jaccard similarity between two integer arrays
-- Returns |A ∩ B| / |A ∪ B|, or 0 when both are empty/NULL.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.jaccard_similarity(a int[], b int[])
RETURNS float
LANGUAGE sql IMMUTABLE
AS $$
  SELECT CASE
    WHEN icount(COALESCE(a, '{}') | COALESCE(b, '{}')) > 0
    THEN icount(COALESCE(a, '{}') & COALESCE(b, '{}'))::float
         / icount(COALESCE(a, '{}') | COALESCE(b, '{}'))::float
    ELSE 0.0
  END;
$$;

-- ---------------------------------------------------------------------------
-- recommend_games(source_game_id, result_limit)
--
-- Phase 1: GIN-indexed array overlap filters candidates quickly.
-- Phase 2: Weighted Jaccard similarity scores candidates.
--
-- Weights:
--   genres      = 0.30
--   themes      = 0.25
--   keywords    = 0.15
--   game_modes  = 0.10
--   perspectives= 0.10
--   developers  = 0.10
-- ---------------------------------------------------------------------------
DROP FUNCTION IF EXISTS public.recommend_games(BIGINT, INT);
DROP FUNCTION IF EXISTS public.recommend_games(INT, INT);

CREATE OR REPLACE FUNCTION public.recommend_games(
  source_game_id INT,
  result_limit INT DEFAULT 10
)
RETURNS TABLE (
  id              INT,
  name            TEXT,
  slug            TEXT,
  summary         TEXT,
  cover_image_id  TEXT,
  rating          DOUBLE PRECISION,
  rating_count    INT,
  first_release_date TIMESTAMPTZ,
  genre_ids       INT[],
  theme_ids       INT[],
  platform_ids    INT[],
  similarity_score DOUBLE PRECISION
)
LANGUAGE plpgsql STABLE
AS $$
DECLARE
  src RECORD;
BEGIN
  -- Fetch source game feature vectors
  SELECT
    g.genre_ids    AS g_genres,
    g.theme_ids    AS g_themes,
    g.keyword_ids  AS g_keywords,
    g.mode_ids     AS g_modes,
    g.perspective_ids AS g_perspectives,
    g.developer_ids   AS g_developers
  INTO src
  FROM games g
  WHERE g.id = source_game_id;

  IF NOT FOUND THEN
    RETURN;
  END IF;

  RETURN QUERY
  SELECT
    c.id, c.name, c.slug, c.summary, c.cover_image_id,
    c.rating, c.rating_count, c.first_release_date,
    c.genre_ids, c.theme_ids, c.platform_ids,
    (
      0.30 * jaccard_similarity(src.g_genres,       c.genre_ids)
    + 0.25 * jaccard_similarity(src.g_themes,       c.theme_ids)
    + 0.15 * jaccard_similarity(src.g_keywords,     c.keyword_ids)
    + 0.10 * jaccard_similarity(src.g_modes,        c.mode_ids)
    + 0.10 * jaccard_similarity(src.g_perspectives, c.perspective_ids)
    + 0.10 * jaccard_similarity(src.g_developers,   c.developer_ids)
    ) AS similarity_score
  FROM games c
  WHERE c.id != source_game_id
    AND (
      c.genre_ids   && COALESCE(src.g_genres,   '{}')
      OR c.theme_ids  && COALESCE(src.g_themes,  '{}')
      OR c.keyword_ids && COALESCE(src.g_keywords, '{}')
    )
  ORDER BY similarity_score DESC, c.rating_count DESC NULLS LAST
  LIMIT result_limit;
END;
$$;

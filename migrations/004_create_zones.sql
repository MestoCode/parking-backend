CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS zones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  city VARCHAR(100) NOT NULL,
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT zones_name_not_empty
    CHECK (BTRIM(name) <> ''),
  CONSTRAINT zones_city_not_empty
    CHECK (BTRIM(city) <> '')
);

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS zones_set_updated_at ON zones;

CREATE TRIGGER zones_set_updated_at
BEFORE UPDATE ON zones
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

CREATE UNIQUE INDEX IF NOT EXISTS zones_city_name_unique_idx
  ON zones (LOWER(city), LOWER(name));

CREATE INDEX IF NOT EXISTS zones_city_idx
  ON zones (city);

CREATE INDEX IF NOT EXISTS zones_active_city_idx
  ON zones (city, is_active)
  WHERE is_active = TRUE;

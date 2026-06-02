CREATE EXTENSION IF NOT EXISTS pgcrypto;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'node_status') THEN
    CREATE TYPE node_status AS ENUM (
      'AVAILABLE',
      'OCCUPIED',
      'OFFLINE',
      'MAINTENANCE',
      'RESERVED',
      'UNKNOWN'
    );
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS parking_nodes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  node_uid VARCHAR(100) NOT NULL UNIQUE,
  name VARCHAR(100) NOT NULL,
  zone_id UUID NOT NULL,
  latitude NUMERIC(9, 6) NOT NULL,
  longitude NUMERIC(9, 6) NOT NULL,
  status node_status NOT NULL DEFAULT 'UNKNOWN',
  battery_level SMALLINT,
  signal_strength SMALLINT,
  firmware_version VARCHAR(50),
  is_online BOOLEAN NOT NULL DEFAULT FALSE,
  last_seen_at TIMESTAMPTZ,
  installed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT parking_nodes_zone_id_fk
    FOREIGN KEY (zone_id)
    REFERENCES zones (id)
    ON UPDATE CASCADE
    ON DELETE RESTRICT,
  CONSTRAINT parking_nodes_node_uid_not_empty
    CHECK (BTRIM(node_uid) <> ''),
  CONSTRAINT parking_nodes_name_not_empty
    CHECK (BTRIM(name) <> ''),
  CONSTRAINT parking_nodes_latitude_range
    CHECK (latitude BETWEEN -90 AND 90),
  CONSTRAINT parking_nodes_longitude_range
    CHECK (longitude BETWEEN -180 AND 180),
  CONSTRAINT parking_nodes_battery_level_range
    CHECK (battery_level IS NULL OR battery_level BETWEEN 0 AND 100),
  CONSTRAINT parking_nodes_signal_strength_range
    CHECK (signal_strength IS NULL OR signal_strength BETWEEN -120 AND 0),
  CONSTRAINT parking_nodes_last_seen_not_before_installed
    CHECK (last_seen_at IS NULL OR last_seen_at >= installed_at)
);

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS parking_nodes_set_updated_at ON parking_nodes;

CREATE TRIGGER parking_nodes_set_updated_at
BEFORE UPDATE ON parking_nodes
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

CREATE INDEX IF NOT EXISTS parking_nodes_zone_id_idx
  ON parking_nodes (zone_id);

CREATE INDEX IF NOT EXISTS parking_nodes_zone_status_idx
  ON parking_nodes (zone_id, status);

CREATE INDEX IF NOT EXISTS parking_nodes_online_idx
  ON parking_nodes (is_online);

CREATE INDEX IF NOT EXISTS parking_nodes_last_seen_at_idx
  ON parking_nodes (last_seen_at);

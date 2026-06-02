CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS node_heartbeats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  node_id UUID NOT NULL,
  battery_level SMALLINT,
  signal_strength SMALLINT,
  temperature NUMERIC(5, 2),
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT node_heartbeats_node_id_fk
    FOREIGN KEY (node_id)
    REFERENCES parking_nodes (id)
    ON UPDATE CASCADE
    ON DELETE CASCADE,
  CONSTRAINT node_heartbeats_battery_level_range
    CHECK (battery_level IS NULL OR battery_level BETWEEN 0 AND 100),
  CONSTRAINT node_heartbeats_signal_strength_range
    CHECK (signal_strength IS NULL OR signal_strength BETWEEN -120 AND 0),
  CONSTRAINT node_heartbeats_temperature_range
    CHECK (temperature IS NULL OR temperature BETWEEN -40.00 AND 125.00),
  CONSTRAINT node_heartbeats_metadata_is_object
    CHECK (jsonb_typeof(metadata) = 'object')
);

CREATE INDEX IF NOT EXISTS node_heartbeats_node_created_at_idx
  ON node_heartbeats (node_id, created_at DESC);

CREATE INDEX IF NOT EXISTS node_heartbeats_created_at_brin_idx
  ON node_heartbeats
  USING BRIN (created_at);

CREATE INDEX IF NOT EXISTS node_heartbeats_metadata_gin_idx
  ON node_heartbeats
  USING GIN (metadata);

CREATE INDEX IF NOT EXISTS node_heartbeats_low_battery_idx
  ON node_heartbeats (node_id, created_at DESC)
  WHERE battery_level IS NOT NULL AND battery_level <= 20;

CREATE INDEX IF NOT EXISTS node_heartbeats_weak_signal_idx
  ON node_heartbeats (node_id, created_at DESC)
  WHERE signal_strength IS NOT NULL AND signal_strength <= -90;

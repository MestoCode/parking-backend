CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS node_status_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  node_id UUID NOT NULL,
  old_status node_status NOT NULL,
  new_status node_status NOT NULL,
  changed_by UUID,
  source VARCHAR(50) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT node_status_history_node_id_fk
    FOREIGN KEY (node_id)
    REFERENCES parking_nodes (id)
    ON UPDATE CASCADE
    ON DELETE CASCADE,
  CONSTRAINT node_status_history_changed_by_fk
    FOREIGN KEY (changed_by)
    REFERENCES users (id)
    ON UPDATE CASCADE
    ON DELETE SET NULL,
  CONSTRAINT node_status_history_source_not_empty
    CHECK (BTRIM(source) <> ''),
  CONSTRAINT node_status_history_status_changed
    CHECK (old_status <> new_status)
);

CREATE INDEX IF NOT EXISTS node_status_history_node_created_at_idx
  ON node_status_history (node_id, created_at DESC);

CREATE INDEX IF NOT EXISTS node_status_history_changed_by_idx
  ON node_status_history (changed_by)
  WHERE changed_by IS NOT NULL;

CREATE INDEX IF NOT EXISTS node_status_history_new_status_created_at_idx
  ON node_status_history (new_status, created_at DESC);

CREATE INDEX IF NOT EXISTS node_status_history_source_created_at_idx
  ON node_status_history (source, created_at DESC);

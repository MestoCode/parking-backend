CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS node_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  node_id UUID NOT NULL,
  user_id UUID NOT NULL,
  action VARCHAR(100) NOT NULL,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT node_actions_node_id_fk
    FOREIGN KEY (node_id)
    REFERENCES parking_nodes (id)
    ON UPDATE CASCADE
    ON DELETE CASCADE,
  CONSTRAINT node_actions_user_id_fk
    FOREIGN KEY (user_id)
    REFERENCES users (id)
    ON UPDATE CASCADE
    ON DELETE RESTRICT,
  CONSTRAINT node_actions_action_not_empty
    CHECK (BTRIM(action) <> ''),
  CONSTRAINT node_actions_metadata_is_object
    CHECK (jsonb_typeof(metadata) = 'object')
);

CREATE INDEX IF NOT EXISTS node_actions_node_created_at_idx
  ON node_actions (node_id, created_at DESC);

CREATE INDEX IF NOT EXISTS node_actions_user_created_at_idx
  ON node_actions (user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS node_actions_action_created_at_idx
  ON node_actions (action, created_at DESC);

CREATE INDEX IF NOT EXISTS node_actions_metadata_gin_idx
  ON node_actions
  USING GIN (metadata);

CREATE EXTENSION IF NOT EXISTS pgcrypto;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'reservation_status') THEN
    CREATE TYPE reservation_status AS ENUM (
      'PENDING',
      'ACTIVE',
      'COMPLETED',
      'CANCELLED',
      'EXPIRED'
    );
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS parking_reservations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  node_id UUID NOT NULL,
  status reservation_status NOT NULL DEFAULT 'PENDING',
  reserved_until TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT parking_reservations_user_id_fk
    FOREIGN KEY (user_id)
    REFERENCES users (id)
    ON UPDATE CASCADE
    ON DELETE RESTRICT,
  CONSTRAINT parking_reservations_node_id_fk
    FOREIGN KEY (node_id)
    REFERENCES parking_nodes (id)
    ON UPDATE CASCADE
    ON DELETE RESTRICT,
  CONSTRAINT parking_reservations_reserved_until_after_created
    CHECK (reserved_until > created_at)
);

CREATE INDEX IF NOT EXISTS parking_reservations_user_created_at_idx
  ON parking_reservations (user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS parking_reservations_node_created_at_idx
  ON parking_reservations (node_id, created_at DESC);

CREATE INDEX IF NOT EXISTS parking_reservations_status_reserved_until_idx
  ON parking_reservations (status, reserved_until);

CREATE INDEX IF NOT EXISTS parking_reservations_expiry_idx
  ON parking_reservations (reserved_until)
  WHERE status IN ('PENDING', 'ACTIVE');

CREATE UNIQUE INDEX IF NOT EXISTS parking_reservations_active_node_unique_idx
  ON parking_reservations (node_id)
  WHERE status IN ('PENDING', 'ACTIVE');

CREATE UNIQUE INDEX IF NOT EXISTS parking_reservations_active_user_unique_idx
  ON parking_reservations (user_id)
  WHERE status IN ('PENDING', 'ACTIVE');

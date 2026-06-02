CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS otp_verifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone_number VARCHAR(20) NOT NULL,
  code VARCHAR(10) NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  is_used BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT otp_verifications_phone_number_not_empty
    CHECK (BTRIM(phone_number) <> ''),
  CONSTRAINT otp_verifications_code_format
    CHECK (code ~ '^[0-9]{4,10}$'),
  CONSTRAINT otp_verifications_expires_after_created
    CHECK (expires_at > created_at)
);

CREATE INDEX IF NOT EXISTS otp_verifications_phone_number_idx
  ON otp_verifications (phone_number);

CREATE INDEX IF NOT EXISTS otp_verifications_expires_at_idx
  ON otp_verifications (expires_at);

CREATE INDEX IF NOT EXISTS otp_verifications_unused_phone_number_idx
  ON otp_verifications (phone_number, created_at DESC)
  WHERE is_used = FALSE;

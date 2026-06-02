-- Hardcoded mesh node / gateway coordinates reported over the mesh network.
-- Stored on devices so each physical unit (gateway | node) carries its own lat/lng.
ALTER TABLE devices
  ADD COLUMN IF NOT EXISTS latitude DECIMAL(9, 6),
  ADD COLUMN IF NOT EXISTS longitude DECIMAL(9, 6);

-- Per-API-key ordered provider connection preference.
-- This is ranking metadata only; allowed_connections remains the access-control boundary.
ALTER TABLE api_keys ADD COLUMN preferred_connections TEXT;

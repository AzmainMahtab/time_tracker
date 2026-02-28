CREATE TABLE sessions (
  uuid UUID PRIMARY KEY DEFAULT uuidv7(),
  user_id uuid NOT NULL,
  device_id TEXT NOT NULL,
  token_hash TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, device_id)
);

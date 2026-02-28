CREATE TABLE IF NOT EXISTS sessions (
  uuid UUID PRIMARY KEY DEFAULT uuidv7(),
  user_id UUID NOT NULL REFERENCES users(uuid) ON DELETE CASCADE,
  device_id VARCHAR(255) NOT NULL,
  token_hash TEXT NOT NULL,
  
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, device_id)
);

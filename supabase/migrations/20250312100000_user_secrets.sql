-- user_secrets: store encrypted API keys per user. Only backend (service role) should read/write.
CREATE TABLE IF NOT EXISTS user_secrets (
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  secret_key TEXT NOT NULL,
  encrypted_value TEXT NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, secret_key)
);

CREATE INDEX IF NOT EXISTS idx_user_secrets_user_id ON user_secrets(user_id);

-- No RLS: access only via service role from API routes. Do not grant client access to this table.

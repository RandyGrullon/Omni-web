-- Omni chats: one row per conversation, max 5 per user (enforced in app)
CREATE TABLE IF NOT EXISTS omni_chats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL DEFAULT 'New Session',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_omni_chats_user_id ON omni_chats(user_id);
CREATE INDEX IF NOT EXISTS idx_omni_chats_updated_at ON omni_chats(user_id, updated_at DESC);

-- Omni messages: messages belong to a chat
CREATE TABLE IF NOT EXISTS omni_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chat_id UUID NOT NULL REFERENCES omni_chats(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_omni_messages_chat_id ON omni_messages(chat_id);

-- RLS: omni_chats
ALTER TABLE omni_chats ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can select own omni_chats"
  ON omni_chats FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own omni_chats"
  ON omni_chats FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own omni_chats"
  ON omni_chats FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own omni_chats"
  ON omni_chats FOR DELETE
  USING (auth.uid() = user_id);

-- RLS: omni_messages (via chat ownership)
ALTER TABLE omni_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can select own omni_messages"
  ON omni_messages FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM omni_chats c WHERE c.id = chat_id AND c.user_id = auth.uid())
  );

CREATE POLICY "Users can insert own omni_messages"
  ON omni_messages FOR INSERT
  WITH CHECK (
    EXISTS (SELECT 1 FROM omni_chats c WHERE c.id = chat_id AND c.user_id = auth.uid())
  );

CREATE POLICY "Users can delete own omni_messages"
  ON omni_messages FOR DELETE
  USING (
    EXISTS (SELECT 1 FROM omni_chats c WHERE c.id = chat_id AND c.user_id = auth.uid())
  );

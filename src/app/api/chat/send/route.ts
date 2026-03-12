import { type NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import Groq from 'groq-sdk';
import { decrypt } from '@/lib/encryption';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const GROQ_API_KEY_FALLBACK = process.env.GROQ_API_KEY;
const MAX_CHATS = 5;
const SECRET_KEY_GROQ = 'groq_api_key';
const GROQ_MODEL = 'llama-3.3-70b-versatile';
const SYSTEM_PROMPT =
  "LANGUAGE RULES: YOU MUST DETECT THE USER'S LANGUAGE AND REPLY IN THE SAME LANGUAGE. " +
  "IF THE USER WRITES IN ENGLISH, REPLY IN ENGLISH. IF THE USER WRITES IN SPANISH, REPLY IN SPANISH. " +
  "Act as a Senior Full Stack Developer. Provide Markdown code and concise explanations.";

async function getUserFromRequest(request: NextRequest) {
  const accessToken = request.headers.get('authorization')?.replace(/^Bearer\s+/i, '');
  const refreshToken = request.headers.get('x-refresh-token') ?? '';
  if (!accessToken) return null;
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, { auth: { persistSession: false } });
  const { error } = await supabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken });
  if (error) return null;
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

function getServiceRoleClient() {
  const key = SERVICE_ROLE_KEY || SUPABASE_ANON_KEY;
  return createClient(SUPABASE_URL, key, { auth: { persistSession: false } });
}

export async function POST(request: NextRequest) {
  const user = await getUserFromRequest(request);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  let groqApiKey: string | null = null;
  const supabaseAdmin = getServiceRoleClient();
  const { data: secretRow } = await supabaseAdmin
    .from('user_secrets')
    .select('encrypted_value')
    .eq('user_id', user.id)
    .eq('secret_key', SECRET_KEY_GROQ)
    .maybeSingle();
  if (secretRow?.encrypted_value) {
    try {
      groqApiKey = decrypt(secretRow.encrypted_value);
    } catch (_) {
      groqApiKey = null;
    }
  }
  if (!groqApiKey && GROQ_API_KEY_FALLBACK) groqApiKey = GROQ_API_KEY_FALLBACK;
  if (!groqApiKey) {
    return NextResponse.json(
      { error: 'Configure your Groq API key in your profile to use chat' },
      { status: 400 }
    );
  }

  let body: { chatId?: string | null; prompt?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }
  const prompt = typeof body.prompt === 'string' ? body.prompt.trim() : '';
  if (!prompt) return NextResponse.json({ error: 'Missing prompt' }, { status: 400 });

  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, { auth: { persistSession: false } });
  await supabase.auth.setSession({
    access_token: request.headers.get('authorization')?.replace(/^Bearer\s+/i, '') || '',
    refresh_token: request.headers.get('x-refresh-token') ?? '',
  });

  let chatId: string | null = body.chatId && typeof body.chatId === 'string' ? body.chatId : null;

  if (chatId) {
    const { data: chat } = await supabase.from('omni_chats').select('id').eq('id', chatId).eq('user_id', user.id).single();
    if (!chat) return NextResponse.json({ error: 'Chat not found' }, { status: 404 });
  }

  if (!chatId) {
    const { data: chats } = await supabase.from('omni_chats').select('id').eq('user_id', user.id).order('created_at', { ascending: true });
    const list = chats ?? [];
    while (list.length >= MAX_CHATS) {
      const oldest = list.shift();
      if (oldest) await supabase.from('omni_chats').delete().eq('id', oldest.id);
    }
    const title = prompt.slice(0, 50) + (prompt.length > 50 ? '...' : '');
    const { data: inserted, error: insertErr } = await supabase.from('omni_chats').insert({ user_id: user.id, title }).select('id').single();
    if (insertErr || !inserted) return NextResponse.json({ error: 'Failed to create chat' }, { status: 500 });
    chatId = inserted.id;
  }

  const { error: msgErr } = await supabase.from('omni_messages').insert({
    chat_id: chatId,
    role: 'user',
    content: prompt,
  });
  if (msgErr) return NextResponse.json({ error: 'Failed to save message' }, { status: 500 });

  const { data: historyRows } = await supabase
    .from('omni_messages')
    .select('role, content')
    .eq('chat_id', chatId)
    .order('created_at', { ascending: true });
  const messages = (historyRows ?? []).slice(0, -1).map((m) => ({
    role: m.role === 'assistant' ? 'assistant' : 'user',
    content: m.content,
  }));
  messages.push({ role: 'user' as const, content: prompt });

  const groq = new Groq({ apiKey: groqApiKey });
  const stream = await groq.chat.completions.create({
    model: GROQ_MODEL,
    messages: [{ role: 'system', content: SYSTEM_PROMPT }, ...messages],
    temperature: 0.7,
    max_tokens: 2048,
    stream: true,
  });

  const encoder = new TextEncoder();
  let fullContent = '';
  const readable = new ReadableStream({
    async start(controller) {
      try {
        for await (const chunk of stream) {
          const text = chunk.choices?.[0]?.delta?.content;
          if (text) {
            fullContent += text;
            controller.enqueue(encoder.encode(text));
          }
        }
        controller.close();
        if (fullContent) {
          await supabase.from('omni_messages').insert({
            chat_id: chatId,
            role: 'assistant',
            content: fullContent,
          });
          await supabase.from('omni_chats').update({ updated_at: new Date().toISOString() }).eq('id', chatId);
        }
      } catch (e) {
        controller.error(e);
      }
    },
  });

  return new NextResponse(readable, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'no-store',
      'X-Chat-Id': chatId,
    },
  });
}

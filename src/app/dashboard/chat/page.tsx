"use client";

import React, { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Loader2, MessageSquare, Plus, Copy, Check, Pencil, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { useToast } from '@/context/ToastContext';
import { Highlight, themes, Prism } from 'prism-react-renderer';

if (typeof globalThis !== 'undefined') {
  (globalThis as any).Prism = Prism;
}

const PRISM_READY = (async () => {
  await Promise.all([
    import('prismjs/components/prism-javascript'),
    import('prismjs/components/prism-typescript'),
    import('prismjs/components/prism-jsx'),
    import('prismjs/components/prism-tsx'),
    import('prismjs/components/prism-python'),
    import('prismjs/components/prism-css'),
    import('prismjs/components/prism-json'),
    import('prismjs/components/prism-bash'),
    import('prismjs/components/prism-sql'),
    import('prismjs/components/prism-markup'),
  ]);
})();

type Chat = { id: string; title: string; updated_at: string };
type Message = { role: string; content: string };

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

const LANG_ALIASES: Record<string, string> = {
  js: 'javascript',
  ts: 'typescript',
  jsx: 'jsx',
  tsx: 'tsx',
  py: 'python',
  sh: 'bash',
  bash: 'bash',
  html: 'markup',
  xml: 'markup',
};

function CodeBlock({ lang, code, blockKey }: { lang: string; code: string; blockKey: number }) {
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);
  const [ready, setReady] = useState(false);
  const text = code.trimEnd();
  const prismLang = LANG_ALIASES[lang.toLowerCase()] || lang || 'javascript';

  useEffect(() => {
    PRISM_READY.then(() => setReady(true));
  }, []);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      toast('Código copiado', 'success');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast('Error al copiar', 'error');
    }
  };

  const preClass = 'p-4 overflow-x-auto text-xs font-mono leading-relaxed m-0 text-gray-300';
  return (
    <div className="my-3 rounded-xl overflow-hidden border border-[#222] bg-[#0a0a0a]">
      <div className="flex items-center justify-between border-b border-[#222] bg-[#111] px-3 py-1.5">
        {lang ? <span className="text-[10px] font-bold uppercase tracking-wider text-[#00FF41]/70">{lang}</span> : <span />}
        <button
          type="button"
          onClick={handleCopy}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider text-gray-400 hover:text-[#00FF41] hover:bg-[#00FF41]/10 border border-transparent hover:border-[#00FF41]/20 transition-colors"
          title="Copiar código"
        >
          {copied ? <Check size={12} /> : <Copy size={12} />}
          {copied ? 'Copiado' : 'Copiar'}
        </button>
      </div>
      {ready ? (
        <Highlight theme={themes.oneDark} code={text} language={prismLang} Prism={Prism}>
          {({ className, style, tokens, getLineProps, getTokenProps }) => (
            <pre className={`${preClass} ${className}`} style={{ ...style, margin: 0 }}>
              {tokens.map((line, i) => (
                <div key={i} {...getLineProps({ line })}>
                  {line.map((token, k) => (
                    <span key={k} {...getTokenProps({ token })} />
                  ))}
                </div>
              ))}
            </pre>
          )}
        </Highlight>
      ) : (
        <pre className={preClass}><code>{escapeHtml(text)}</code></pre>
      )}
    </div>
  );
}

/** Renderiza contenido de mensaje con bloques de código decorados (```) e inline `code`. */
function ChatMessageContent({ content }: { content: string }) {
  const parts: React.ReactNode[] = [];
  const blocks = content.split(/(```[\s\S]*?```)/g);
  blocks.forEach((block, i) => {
    const match = block.match(/^```(\w*)\n?([\s\S]*?)```$/);
    if (match) {
      const [, lang, code] = match;
      parts.push(<CodeBlock key={i} blockKey={i} lang={lang || ''} code={code} />);
    } else {
      const lines = block.split('\n');
      const nodes: React.ReactNode[] = [];
      lines.forEach((line, j) => {
        const partsLine: React.ReactNode[] = [];
        let lastIndex = 0;
        const inlineRegex = /`([^`]+)`/g;
        let m: RegExpExecArray | null;
        while ((m = inlineRegex.exec(line)) !== null) {
          partsLine.push(<span key={`t-${j}-${lastIndex}`}>{escapeHtml(line.slice(lastIndex, m.index))}</span>);
          partsLine.push(<code key={`c-${j}-${m.index}`} className="px-1.5 py-0.5 rounded bg-[#00FF41]/10 border border-[#00FF41]/20 text-[#00FF41] font-mono text-xs">{m[1]}</code>);
          lastIndex = m.index + m[0].length;
        }
        partsLine.push(<span key={`t-${j}-end`}>{escapeHtml(line.slice(lastIndex))}</span>);
        nodes.push(<span key={j}>{partsLine}{j < lines.length - 1 ? '\n' : null}</span>);
      });
      parts.push(<div key={i} className="whitespace-pre-wrap break-words">{nodes}</div>);
    }
  });
  return <div className="space-y-0">{parts.length ? parts : <span className="whitespace-pre-wrap break-words">{content}</span>}</div>;
}

export default function DashboardChatPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [chats, setChats] = useState<Chat[]>([]);
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [streaming, setStreaming] = useState(false);
  const [streamingContent, setStreamingContent] = useState('');
  const [editingTitle, setEditingTitle] = useState('');
  const [editModalChat, setEditModalChat] = useState<Chat | null>(null);
  const [deleteModalChatId, setDeleteModalChatId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatInputRef = useRef<HTMLInputElement>(null);
  const sessionRef = useRef<{ access_token: string; refresh_token: string } | null>(null);
  const editInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/auth');
        return;
      }
      const { data: profileData } = await supabase.from('profiles').select('*').eq('id', user.id).single();
      setProfile(profileData || null);
      const { data: { session } } = await supabase.auth.getSession();
      sessionRef.current = session ? { access_token: session.access_token, refresh_token: session.refresh_token ?? '' } : null;
      const { data: chatsData } = await supabase
        .from('omni_chats')
        .select('id, title, updated_at')
        .order('updated_at', { ascending: false });
      setChats(chatsData ?? []);
      setLoading(false);
    })();
  }, [router]);

  useEffect(() => {
    if (!selectedChatId) {
      setMessages([]);
      return;
    }
    (async () => {
      const { data } = await supabase
        .from('omni_messages')
        .select('role, content')
        .eq('chat_id', selectedChatId)
        .order('created_at', { ascending: true });
      setMessages((data ?? []) as Message[]);
    })();
  }, [selectedChatId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streamingContent]);

  useEffect(() => {
    if (editModalChat) {
      setEditingTitle(editModalChat.title || 'New Session');
      setTimeout(() => editInputRef.current?.focus(), 0);
    }
  }, [editModalChat]);

  const handleUpdateChatTitle = async (id: string, newTitle: string) => {
    const title = newTitle.trim() || 'New Session';
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { error } = await supabase.from('omni_chats').update({ title, updated_at: new Date().toISOString() }).eq('id', id).eq('user_id', user.id);
    if (error) {
      toast('No se pudo actualizar el nombre', 'error');
      return;
    }
    setChats((prev) => prev.map((c) => (c.id === id ? { ...c, title, updated_at: new Date().toISOString() } : c)));
    setEditModalChat(null);
    setEditingTitle('');
    toast('Nombre actualizado', 'success');
  };

  const handleDeleteChatConfirm = async (id: string) => {
    setDeleteModalChatId(null);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { error } = await supabase.from('omni_chats').delete().eq('id', id).eq('user_id', user.id);
    if (error) {
      toast('No se pudo eliminar', 'error');
      return;
    }
    setChats((prev) => prev.filter((c) => c.id !== id));
    if (selectedChatId === id) {
      setSelectedChatId(null);
      setMessages([]);
    }
    setDeleteModalChatId(null);
    toast('Conversación eliminada', 'success');
  };

  const sendMessage = async () => {
    const prompt = input.trim();
    if (!prompt) return;
    if (streaming) return; // Un solo mensaje a la vez: esperar a que la IA termine
    // Si no hay sesión en el ref, intentar refrescar una vez (p. ej. tras login en otra pestaña o callback reciente)
    if (!sessionRef.current) {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        sessionRef.current = { access_token: session.access_token, refresh_token: session.refresh_token ?? '' };
      } else {
        toast('Sesión expirada. Vuelve a iniciar sesión.', 'error');
        router.push('/auth');
        return;
      }
    }
    setInput('');
    setStreaming(true);
    setStreamingContent('');
    const chatId = selectedChatId;
    setMessages((prev) => [...prev, { role: 'user', content: prompt }]);
    try {
      const res = await fetch('/api/chat/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sessionRef.current.access_token}`,
          'X-Refresh-Token': sessionRef.current.refresh_token,
        },
        body: JSON.stringify({ chatId, prompt }),
      });
      const newChatId = res.headers.get('X-Chat-Id');
      if (newChatId && !chatId) {
        setSelectedChatId(newChatId);
        const { data: chatRow } = await supabase.from('omni_chats').select('id, title, updated_at').eq('id', newChatId).single();
        if (chatRow) setChats((prev) => [chatRow as Chat, ...prev]);
      }
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        toast((err as { error?: string }).error || 'Error sending message', 'error');
        setMessages((prev) => prev.slice(0, -1));
        setStreaming(false);
        setTimeout(() => chatInputRef.current?.focus(), 0);
        return;
      }
      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      let full = '';
      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const text = decoder.decode(value, { stream: true });
          full += text;
          setStreamingContent(full);
        }
      }
      setMessages((prev) => [...prev, { role: 'assistant', content: full }]);
      setStreamingContent('');
      const { data: list } = await supabase.from('omni_chats').select('id, title, updated_at').order('updated_at', { ascending: false });
      setChats(list ?? []);
    } catch (e) {
      toast('Network error', 'error');
      setMessages((prev) => prev.slice(0, -1));
    } finally {
      setStreaming(false);
      setTimeout(() => chatInputRef.current?.focus(), 0);
    }
  };

  if (loading || !profile) {
    return (
      <div className="min-h-screen bg-[#0D0D0D] flex items-center justify-center">
        <Loader2 className="text-[#00FF41] animate-spin" size={40} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0D0D0D] text-white font-mono flex flex-col">
      <header className="border-b border-[#222] bg-black/40 shrink-0">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center gap-4">
          <Link href="/dashboard" className="text-[10px] font-bold uppercase tracking-widest text-[#00FF41] hover:underline">
            ← Dashboard
          </Link>
          <span className="text-gray-500">|</span>
          <h1 className="text-sm font-black uppercase tracking-tight flex items-center gap-2">
            <MessageSquare className="text-[#00FF41]" size={18} />
            Omni_Chat
          </h1>
        </div>
      </header>
      <div className="flex-1 flex min-h-0 justify-center">
        <div className="w-full max-w-5xl flex flex-1 min-h-0 border-x border-[#222] bg-[#0a0a0a] shadow-2xl">
          <aside className="w-56 border-r border-[#222] bg-black/30 flex flex-col shrink-0">
            <button
              type="button"
              onClick={() => { setSelectedChatId(null); setMessages([]); }}
              className="m-3 flex items-center gap-2 px-3 py-2.5 rounded-xl border border-[#00FF41]/30 bg-[#00FF41]/5 text-[#00FF41] text-[10px] font-bold uppercase tracking-wider hover:bg-[#00FF41]/10 transition-colors"
            >
              <Plus size={14} /> New chat
            </button>
            <ul className="flex-1 overflow-y-auto p-2 space-y-1">
              {chats.map((c) => (
                <li key={c.id} className="group flex items-center gap-1 rounded-xl border border-transparent hover:border-[#222]">
                  <button
                    type="button"
                    onClick={() => setSelectedChatId(c.id)}
                    className={`flex-1 min-w-0 text-left px-3 py-2 rounded-xl text-[10px] font-bold truncate transition-colors ${
                      selectedChatId === c.id ? 'bg-[#00FF41]/20 text-[#00FF41] border border-[#00FF41]/30' : 'text-gray-400 hover:bg-[#222] hover:text-gray-300 border border-transparent'
                    }`}
                  >
                    {c.title || 'New Session'}
                  </button>
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); setEditModalChat(c); }}
                    className={`p-1.5 rounded-lg text-gray-500 hover:text-[#00FF41] hover:bg-[#00FF41]/10 transition-opacity ${selectedChatId === c.id ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}
                    title="Editar nombre"
                    aria-label="Editar nombre"
                  >
                    <Pencil size={12} />
                  </button>
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); setDeleteModalChatId(c.id); }}
                    className={`p-1.5 rounded-lg text-gray-500 hover:text-red-400 hover:bg-red-500/10 transition-opacity ${selectedChatId === c.id ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}
                    title="Eliminar chat"
                    aria-label="Eliminar chat"
                  >
                    <Trash2 size={12} />
                  </button>
                </li>
              ))}
            </ul>
          </aside>
          <main className="flex-1 flex flex-col min-h-0 min-w-0">
            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
              {messages.length === 0 && !streamingContent ? (
                <div className="h-full flex flex-col items-center justify-center text-center py-16">
                  <MessageSquare className="text-[#00FF41]/40 mb-4" size={48} />
                  <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-1">Omni_Chat</p>
                  <p className="text-xs text-gray-600 max-w-xs">Elige una conversación o inicia una nueva. Escribe abajo para preguntar.</p>
                </div>
              ) : (
                <>
                  {messages.map((m, i) => (
                    <div key={i} className={m.role === 'user' ? 'flex justify-end' : 'flex justify-start'}>
                      <div className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                        m.role === 'user' ? 'bg-[#00FF41]/10 border border-[#00FF41]/20 text-gray-200' : 'bg-[#111] border border-[#222] text-gray-300'
                      }`}>
                        {m.role === 'assistant' ? <ChatMessageContent content={m.content} /> : <p className="whitespace-pre-wrap break-words">{m.content}</p>}
                      </div>
                    </div>
                  ))}
                  {streamingContent && (
                    <div className="flex justify-start">
                      <div className="max-w-[85%] rounded-2xl px-4 py-3 text-sm bg-[#111] border border-[#222] text-gray-300 leading-relaxed">
                        <ChatMessageContent content={streamingContent} />
                        <span className="animate-pulse">▌</span>
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </>
              )}
            </div>
            <div className="p-4 border-t border-[#222] bg-black/20">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (streaming) return;
                  sendMessage();
                }}
                className="flex gap-3 max-w-3xl mx-auto"
              >
                <input
                  ref={chatInputRef}
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask Omni..."
                  className="flex-1 bg-[#111] border border-[#222] rounded-xl px-4 py-3 text-sm text-white placeholder-gray-500 focus:border-[#00FF41]/50 focus:outline-none disabled:opacity-60 disabled:cursor-not-allowed"
                  disabled={streaming}
                  readOnly={streaming}
                  aria-busy={streaming}
                />
                <button
                  type="submit"
                  disabled={streaming || !input.trim()}
                  className="px-6 py-3 rounded-xl bg-[#00FF41] text-black font-bold text-xs uppercase tracking-wider disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#00FF41]/90 transition-opacity"
                >
                  {streaming ? <Loader2 className="animate-spin" size={18} /> : 'Send'}
                </button>
              </form>
            </div>
          </main>
        </div>
      </div>

      {/* Modal editar nombre */}
      {editModalChat && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70" onClick={() => setEditModalChat(null)} role="dialog" aria-modal="true" aria-labelledby="edit-chat-title">
          <div className="bg-[#0a0a0a] border border-[#00FF41]/30 rounded-2xl shadow-2xl w-full max-w-sm mx-4 overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="p-5 border-b border-[#222]">
              <h2 id="edit-chat-title" className="text-xs font-bold uppercase tracking-wider text-[#00FF41]">Editar nombre del chat</h2>
            </div>
            <div className="p-5 space-y-4">
              <input
                ref={editInputRef}
                type="text"
                value={editingTitle}
                onChange={(e) => setEditingTitle(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleUpdateChatTitle(editModalChat.id, editingTitle);
                  if (e.key === 'Escape') setEditModalChat(null);
                }}
                className="w-full bg-[#111] border border-[#222] rounded-xl px-4 py-3 text-sm text-white placeholder-gray-500 focus:border-[#00FF41]/50 focus:outline-none focus:ring-1 focus:ring-[#00FF41]/30"
                placeholder="Nombre del chat"
              />
              <div className="flex gap-2 justify-end">
                <button type="button" onClick={() => setEditModalChat(null)} className="px-4 py-2 rounded-xl border border-[#222] text-gray-400 text-xs font-bold uppercase tracking-wider hover:bg-[#222] hover:text-gray-300 transition-colors">
                  Cancelar
                </button>
                <button type="button" onClick={() => handleUpdateChatTitle(editModalChat.id, editingTitle)} className="px-4 py-2 rounded-xl bg-[#00FF41] text-black text-xs font-bold uppercase tracking-wider hover:bg-[#00FF41]/90 transition-opacity">
                  Guardar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal eliminar chat */}
      {deleteModalChatId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70" onClick={() => setDeleteModalChatId(null)} role="dialog" aria-modal="true" aria-labelledby="delete-chat-title">
          <div className="bg-[#0a0a0a] border border-red-500/30 rounded-2xl shadow-2xl w-full max-w-sm mx-4 overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="p-5 border-b border-[#222]">
              <h2 id="delete-chat-title" className="text-xs font-bold uppercase tracking-wider text-red-400">Eliminar conversación</h2>
            </div>
            <div className="p-5 space-y-4">
              <p className="text-sm text-gray-400">¿Eliminar esta conversación? Esta acción no se puede deshacer.</p>
              <div className="flex gap-2 justify-end">
                <button type="button" onClick={() => setDeleteModalChatId(null)} className="px-4 py-2 rounded-xl border border-[#222] text-gray-400 text-xs font-bold uppercase tracking-wider hover:bg-[#222] hover:text-gray-300 transition-colors">
                  Cancelar
                </button>
                <button type="button" onClick={() => handleDeleteChatConfirm(deleteModalChatId)} className="px-4 py-2 rounded-xl bg-red-600 text-white text-xs font-bold uppercase tracking-wider hover:bg-red-500 transition-colors">
                  Eliminar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

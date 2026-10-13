import { ChevronDown, ChevronLeft, Clock, Home, Mail, MessageCircle, Phone, Send, X } from 'lucide-react';
import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';

/**
 * Widget de contacto global (burbuja flotante) con llamada, correo y chat.
 *
 * El chat YA está construido en la UI (bienvenida, burbujas, nombres, "Online",
 * indicador "escribiendo", respuestas rápidas, historial local), pero NO tiene backend
 * propio: se conectará al módulo de Tasks & Support cuando esté terminado, pasando un
 * `ChatAdapter` en la config. Mientras tanto:
 *   - si hay `chatUrl`  → el botón abre ese chat externo (WhatsApp, Crisp, Tawk…)
 *   - si no hay nada    → el chat aparece deshabilitado ("Coming soon").
 *
 * Uso: envuelve tu layout principal
 *   <ContactWidgetProvider config={{ email: 'support@tu-dominio.com', phone: '+593...', userName: 'Tam' }}>
 *     ...
 *   </ContactWidgetProvider>
 *
 * Conectar el soporte más adelante (ejemplo):
 *   const chat: ChatAdapter = {
 *     async send(text, history) {
 *       const res = await fetch('/api/support/chat', { method: 'POST', body: JSON.stringify({ text, history }) });
 *       const { reply } = await res.json();
 *       return reply; // string o string[]
 *     },
 *   };
 *   <ContactWidgetProvider config={{ email: '...', chat }}>
 *
 * Color: usa `accentColor` (por defecto un morado). Los degradados y tintes se derivan solos.
 */

/* ------------------------------------------------------------------ */
/* Tipos                                                               */
/* ------------------------------------------------------------------ */

export interface ChatMessage {
    id: string;
    role: 'user' | 'agent';
    text: string;
    createdAt: number;
    /** Marca mensajes de error del sistema (se muestran con otro estilo). */
    error?: boolean;
}

/** Contrato mínimo con el backend del chat. Devuelve una o varias respuestas del agente. */
export interface ChatAdapter {
    send: (text: string, history: ChatMessage[]) => Promise<string | string[]>;
}

export interface ContactConfig {
    email: string;
    /** Número en formato internacional para tel: (ej. +593991234567). Si falta, el botón se oculta. */
    phone?: string;
    /** Backend del chat integrado (módulo de soporte). Cuando exista, el chat se abre dentro del widget. */
    chat?: ChatAdapter;
    /** URL del chat externo. Se usa solo si NO hay `chat`. */
    chatUrl?: string;
    /** Texto corto, ej. "Mon–Fri, 9:00–18:00". */
    hours?: string;
    /** Nombre del usuario para el saludo: "Hi Tam!". Por defecto "there". */
    userName?: string;
    /** Línea bajo el saludo. */
    greeting?: string;
    /** Nombre que se muestra como remitente del agente. */
    agentName?: string;
    /** Color principal del widget (hex). */
    accentColor?: string;
    /** Primer mensaje del chat. */
    chatWelcome?: string;
    /** Botones de respuesta rápida bajo el mensaje de bienvenida (admiten emoji). */
    quickReplies?: string[];
    /** Texto del pie, ej. "Powered by Tu Marca". Si falta, no se muestra. */
    poweredBy?: string;
    /** Clave de localStorage para el historial. Pasa `null` para no guardar nada. */
    storageKey?: string | null;
}

interface ContactContextValue {
    config: ContactConfig;
    open: boolean;
    setOpen: (v: boolean) => void;
    /** Abre el widget directamente en el chat (útil desde un botón "Hablar con ventas"). */
    openChat: () => void;
    messages: ChatMessage[];
    typing: boolean;
    sendMessage: (text: string) => Promise<void>;
    clearChat: () => void;
}

type View = 'home' | 'chat';

const DEFAULT_STORAGE_KEY = 'contact-widget:chat';
const DEFAULT_ACCENT = '#6d45e8';
const DEFAULT_WELCOME = 'Hello! How can I assist you today? Please describe what you need in as much detail as you can so I can help you effectively.';
const MAX_STORED_MESSAGES = 50;

const ContactContext = createContext<ContactContextValue | null>(null);

/** Devuelve null si no hay provider, así los componentes pueden degradar sin romperse. */
export function useContactWidget() {
    return useContext(ContactContext);
}

/* ------------------------------------------------------------------ */
/* Lógica del chat                                                     */
/* ------------------------------------------------------------------ */

const makeMessage = (role: ChatMessage['role'], text: string, error = false): ChatMessage => ({
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    role,
    text,
    createdAt: Date.now(),
    ...(error ? { error: true } : {}),
});

function loadMessages(key: string | null): ChatMessage[] {
    if (!key || typeof window === 'undefined') return [];
    try {
        const raw = window.localStorage.getItem(key);
        const parsed = raw ? JSON.parse(raw) : [];
        return Array.isArray(parsed) ? parsed : [];
    } catch {
        return [];
    }
}

function saveMessages(key: string | null, messages: ChatMessage[]) {
    if (!key || typeof window === 'undefined') return;
    try {
        window.localStorage.setItem(key, JSON.stringify(messages.slice(-MAX_STORED_MESSAGES)));
    } catch {
        /* almacenamiento lleno o bloqueado: el chat sigue funcionando en memoria */
    }
}

/* ------------------------------------------------------------------ */
/* Provider                                                            */
/* ------------------------------------------------------------------ */

export function ContactWidgetProvider({ config, children }: { config: ContactConfig; children: React.ReactNode }) {
    const [open, setOpen] = useState(false);
    const [view, setView] = useState<View>('home');
    const storageKey = config.storageKey === undefined ? DEFAULT_STORAGE_KEY : config.storageKey;

    const [messages, setMessages] = useState<ChatMessage[]>(() => loadMessages(storageKey));
    const [typing, setTyping] = useState(false);
    const messagesRef = useRef(messages);
    messagesRef.current = messages;

    useEffect(() => {
        saveMessages(storageKey, messages);
    }, [storageKey, messages]);

    useEffect(() => {
        if (!open) return;
        const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [open]);

    // Al cerrar, la próxima apertura vuelve al inicio (salvo que se use openChat()).
    const handleSetOpen = useCallback((v: boolean) => {
        setOpen(v);
        if (!v) setView('home');
    }, []);

    // Sin adapter (soporte aún no conectado) abre el widget en el inicio, no en un chat vacío.
    const openChat = useCallback(() => {
        setView(config.chat ? 'chat' : 'home');
        setOpen(true);
    }, [config.chat]);

    const sendMessage = useCallback(
        async (text: string) => {
            const clean = text.trim();
            if (!clean || typing || !config.chat) return;

            const history = [...messagesRef.current, makeMessage('user', clean)];
            setMessages(history);
            setTyping(true);

            try {
                const reply = await config.chat.send(clean, history);
                const replies = (Array.isArray(reply) ? reply : [reply]).filter(Boolean).map((t) => makeMessage('agent', t));
                setMessages((m) => [...m, ...replies]);
            } catch {
                setMessages((m) => [...m, makeMessage('agent', `We couldn’t send your message. Try again, or email us at ${config.email}.`, true)]);
            } finally {
                setTyping(false);
            }
        },
        [config.chat, config.email, typing],
    );

    const clearChat = useCallback(() => setMessages([]), []);

    return (
        <ContactContext.Provider value={{ config, open, setOpen: handleSetOpen, openChat, messages, typing, sendMessage, clearChat }}>
            {children}
            <ContactWidget view={view} setView={setView} />
        </ContactContext.Provider>
    );
}

/* ------------------------------------------------------------------ */
/* Piezas pequeñas de UI                                               */
/* ------------------------------------------------------------------ */

const ACCENT_GRADIENT = 'bg-[linear-gradient(135deg,var(--cw-accent-light),var(--cw-accent))]';
const FOCUS_RING = 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--cw-accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-background';

function IconButton({ label, onClick, className = '', children }: { label: string; onClick: () => void; className?: string; children: React.ReactNode }) {
    return (
        <button
            type="button"
            aria-label={label}
            onClick={onClick}
            className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition-colors ${FOCUS_RING} ${className}`}
        >
            {children}
        </button>
    );
}

function Avatar({ name, small, online }: { name: string; small?: boolean; online?: boolean }) {
    return (
        <span
            className={`relative inline-flex shrink-0 items-center justify-center rounded-full font-semibold text-white ${ACCENT_GRADIENT} ${small ? 'h-6 w-6 text-[10px]' : 'h-8 w-8 text-xs'
                }`}
            aria-hidden
        >
            {name.charAt(0).toUpperCase()}
            {online && <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full border-2 border-background bg-emerald-500" />}
        </span>
    );
}

type ActionProps = {
    icon?: React.ComponentType<{ className?: string }>;
    children: React.ReactNode;
    variant: 'primary' | 'secondary';
    href?: string;
    onClick?: () => void;
    disabled?: boolean;
    external?: boolean;
};

/** Botón tipo píldora: el principal es morado, el secundario es blanco con borde. */
function ActionButton({ icon: Icon, children, variant, href, onClick, disabled, external }: ActionProps) {
    const base = `flex h-11 w-full items-center justify-center gap-2 rounded-full text-sm font-semibold transition ${FOCUS_RING}`;
    const styles = disabled
        ? 'cursor-not-allowed bg-muted text-muted-foreground'
        : variant === 'primary'
            ? 'bg-[var(--cw-accent)] text-white shadow-[inset_0_-2px_0_rgba(0,0,0,0.18)] hover:brightness-110 active:brightness-95'
            : 'border border-border bg-background text-foreground hover:bg-muted/60';
    const cls = `${base} ${styles}`;
    const content = (
        <>
            {Icon && <Icon className="h-4 w-4" />}
            {children}
        </>
    );

    if (disabled) {
        return (
            <div role="button" aria-disabled="true" className={cls}>
                {content}
            </div>
        );
    }
    if (href) {
        return (
            <a href={href} className={cls} {...(external ? { target: '_blank', rel: 'noreferrer' } : {})}>
                {content}
            </a>
        );
    }
    return (
        <button type="button" onClick={onClick} className={cls}>
            {content}
        </button>
    );
}

function Tab({ icon: Icon, label, active, href, onClick, disabled }: { icon: React.ComponentType<{ className?: string }>; label: string; active?: boolean; href?: string; onClick?: () => void; disabled?: boolean }) {
    const cls = `flex flex-1 flex-col items-center gap-0.5 rounded-xl py-2 text-[11px] font-medium transition-colors ${FOCUS_RING} ${active ? 'bg-muted text-foreground' : 'text-muted-foreground'
        } ${disabled ? 'cursor-not-allowed opacity-50' : active ? '' : 'hover:bg-muted/50 hover:text-foreground'}`;
    const content = (
        <>
            <Icon className="h-5 w-5" />
            {label}
        </>
    );
    if (disabled) {
        return (
            <div aria-disabled="true" className={cls}>
                {content}
            </div>
        );
    }
    if (href) {
        return (
            <a href={href} target="_blank" rel="noreferrer" className={cls}>
                {content}
            </a>
        );
    }
    return (
        <button type="button" onClick={onClick} aria-current={active ? 'page' : undefined} className={cls}>
            {content}
        </button>
    );
}

/* ------------------------------------------------------------------ */
/* Vista: inicio                                                       */
/* ------------------------------------------------------------------ */

function HomeView({ onOpenChat, onClose }: { onOpenChat: () => void; onClose: () => void }) {
    const { config, messages } = useContactWidget()!;
    const agentName = config.agentName ?? 'Support';
    const hasChat = !!config.chat;
    const externalChat = !config.chat && !!config.chatUrl;
    const hasHistory = messages.length > 0;

    return (
        <>
            {/* Hero con degradado */}
            <div className="flex min-h-0 flex-1 flex-col bg-[linear-gradient(165deg,var(--cw-accent-light)_0%,var(--cw-accent)_50%,var(--cw-accent-dark)_100%)] px-6 pb-16 pt-5 text-white">
                <div className="flex items-center justify-between">
                    <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/20 text-sm font-bold backdrop-blur" aria-hidden>
                        {agentName.charAt(0).toUpperCase()}
                    </span>
                    <IconButton label="Close" onClick={onClose} className="text-white/80 hover:bg-white/15 hover:text-white">
                        <X className="h-4 w-4" />
                    </IconButton>
                </div>
                <h2 className="mt-auto pt-8 text-[1.75rem] font-bold leading-tight tracking-tight">
                    Hi {config.userName ?? 'there'}! 👋
                    <br />
                    {config.greeting ?? 'How can we help you?'}
                </h2>
            </div>

            {/* Tarjeta superpuesta */}
            <div className="-mt-10 px-4">
                <div className="space-y-2 rounded-2xl border border-border/60 bg-background p-3 shadow-lg">
                    {hasChat ? (
                        <ActionButton variant="primary" icon={MessageCircle} onClick={onOpenChat}>
                            {hasHistory ? 'Continue conversation' : 'Chat with us'}
                        </ActionButton>
                    ) : externalChat ? (
                        <ActionButton variant="primary" icon={MessageCircle} href={config.chatUrl} external>
                            Chat with us
                        </ActionButton>
                    ) : (
                        <ActionButton variant="primary" icon={MessageCircle} disabled>
                            Chat · Coming soon
                        </ActionButton>
                    )}
                    <ActionButton variant="secondary" icon={Mail} href={`mailto:${config.email}`}>
                        Send an email
                    </ActionButton>
                    {config.phone && (
                        <ActionButton variant="secondary" icon={Phone} href={`tel:${config.phone}`}>
                            Request a call
                        </ActionButton>
                    )}
                    {config.hours && (
                        <p className="flex items-center justify-center gap-1.5 pt-1 text-xs text-muted-foreground">
                            <Clock className="h-3.5 w-3.5" />
                            {config.hours}
                        </p>
                    )}
                </div>
            </div>

            {/* Tabs */}
            <nav className="mt-3 flex gap-1 px-4" aria-label="Widget sections">
                <Tab icon={Home} label="Home" active />
                <Tab icon={MessageCircle} label="Chat" onClick={onOpenChat} href={externalChat ? config.chatUrl : undefined} disabled={!hasChat && !externalChat} />
            </nav>

            {config.poweredBy && <p className="pb-3 pt-1 text-center text-[10px] text-muted-foreground">{config.poweredBy}</p>}
            {!config.poweredBy && <div className="pb-3" />}
        </>
    );
}

/* ------------------------------------------------------------------ */
/* Vista: chat                                                         */
/* ------------------------------------------------------------------ */

function TypingIndicator() {
    return (
        <div className="flex w-fit items-center gap-1 rounded-2xl rounded-tl-md bg-muted px-4 py-3.5" role="status" aria-label="Agent is typing">
            {[0, 1, 2].map((i) => (
                <span
                    key={i}
                    className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground/60 motion-reduce:animate-none"
                    style={{ animationDelay: `${i * 150}ms` }}
                />
            ))}
        </div>
    );
}

function Bubble({ message }: { message: ChatMessage }) {
    const isUser = message.role === 'user';
    const tone = message.error
        ? 'rounded-tl-md border border-destructive/40 bg-destructive/10 text-destructive'
        : isUser
            ? 'ml-auto rounded-tr-md bg-[var(--cw-accent)] text-white'
            : 'rounded-tl-md bg-muted text-foreground';
    return <div className={`w-fit max-w-[85%] whitespace-pre-wrap break-words rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${tone}`}>{message.text}</div>;
}

function SenderLabel({ role, agentName }: { role: ChatMessage['role']; agentName: string }) {
    if (role === 'user') return <p className="mb-1.5 mt-3 text-right text-xs text-muted-foreground">You</p>;
    return (
        <p className="mb-1.5 mt-3 flex items-center gap-2 text-xs text-muted-foreground">
            <Avatar name={agentName} small />
            {agentName}
        </p>
    );
}

function ChatView({ onBack, onClose }: { onBack: () => void; onClose: () => void }) {
    const { config, messages, typing, sendMessage } = useContactWidget()!;
    const agentName = config.agentName ?? 'Support';
    const [draft, setDraft] = useState('');
    const listRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    const all: ChatMessage[] = [{ id: 'welcome', role: 'agent', text: config.chatWelcome ?? DEFAULT_WELCOME, createdAt: 0 }, ...messages];
    const showQuickReplies = messages.length === 0 && (config.quickReplies?.length ?? 0) > 0;

    useEffect(() => {
        const el = listRef.current;
        if (el) el.scrollTop = el.scrollHeight;
    }, [messages, typing]);

    useEffect(() => {
        inputRef.current?.focus();
    }, []);

    const submit = (text: string) => {
        if (!text.trim() || typing) return;
        setDraft('');
        void sendMessage(text);
    };

    return (
        <>
            <div className="flex items-center gap-1.5 border-b border-border/60 px-3 py-3">
                <IconButton label="Back" onClick={onBack} className="text-muted-foreground hover:bg-muted hover:text-foreground">
                    <ChevronLeft className="h-5 w-5" />
                </IconButton>
                <p className="flex-1 text-base font-semibold">Chat</p>
                <Avatar name={agentName} online />
                <span className="mr-1 text-sm text-muted-foreground">Online</span>
                <IconButton label="Close" onClick={onClose} className="text-muted-foreground hover:bg-muted hover:text-foreground">
                    <X className="h-4 w-4" />
                </IconButton>
            </div>

            <div ref={listRef} className="flex-1 overflow-y-auto px-4 pb-4 pt-1" role="log" aria-live="polite" aria-label="Conversation">
                {all.map((m, i) => (
                    <div key={m.id} className="space-y-1.5">
                        {all[i - 1]?.role !== m.role && <SenderLabel role={m.role} agentName={agentName} />}
                        <Bubble message={m} />
                        {i === 0 && showQuickReplies && (
                            <div className="flex flex-wrap gap-2 pt-1.5">
                                {config.quickReplies!.map((q) => (
                                    <button
                                        key={q}
                                        type="button"
                                        onClick={() => submit(q)}
                                        className={`rounded-full border border-[var(--cw-accent)]/50 px-3 py-1.5 text-xs font-medium text-[var(--cw-accent)] transition-colors hover:bg-[var(--cw-tint)] ${FOCUS_RING}`}
                                    >
                                        {q}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                ))}
                {typing && (
                    <div className="pt-2">
                        <TypingIndicator />
                    </div>
                )}
            </div>

            <form
                className="px-3 pb-3 pt-1"
                onSubmit={(e) => {
                    e.preventDefault();
                    submit(draft);
                }}
            >
                <div className="flex items-center gap-1 rounded-full border border-border bg-background pl-4 pr-1.5 transition-colors focus-within:border-[var(--cw-accent)]">
                    <input
                        ref={inputRef}
                        value={draft}
                        onChange={(e) => setDraft(e.target.value)}
                        placeholder="Ask me anything"
                        aria-label="Type your message"
                        maxLength={1000}
                        autoComplete="off"
                        className="h-11 min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                    />
                    <button
                        type="submit"
                        aria-label="Send message"
                        disabled={!draft.trim() || typing}
                        className={`flex h-9 w-9 items-center justify-center rounded-full text-[var(--cw-accent)] transition-colors hover:bg-[var(--cw-tint)] disabled:cursor-not-allowed disabled:text-muted-foreground/50 disabled:hover:bg-transparent ${FOCUS_RING}`}
                    >
                        <Send className="h-5 w-5" />
                    </button>
                </div>
                {config.poweredBy && <p className="pt-2 text-center text-[10px] text-muted-foreground">{config.poweredBy}</p>}
            </form>
        </>
    );
}

/* ------------------------------------------------------------------ */
/* Contenedor flotante                                                 */
/* ------------------------------------------------------------------ */

function ContactWidget({ view, setView }: { view: View; setView: (v: View) => void }) {
    const { config, open, setOpen } = useContactWidget()!;
    const accent = config.accentColor ?? DEFAULT_ACCENT;

    // Variables CSS: del color principal se derivan el claro, el oscuro y el tinte.
    const theme = {
        '--cw-accent': accent,
        '--cw-accent-light': `color-mix(in srgb, ${accent} 62%, white)`,
        '--cw-accent-dark': `color-mix(in srgb, ${accent} 62%, #14062f)`,
        '--cw-tint': `color-mix(in srgb, ${accent} 10%, transparent)`,
    } as React.CSSProperties;

    return (
        <div style={theme} className="fixed bottom-4 right-4 z-40 flex flex-col items-end gap-3">
            {open && (
                <div
                    role="dialog"
                    aria-label="Contact us"
                    className="flex h-[36rem] max-h-[calc(100dvh-6.5rem)] w-[calc(100vw-2rem)] max-w-[22rem] flex-col overflow-hidden rounded-3xl border border-border/60 bg-background text-foreground shadow-2xl duration-200 animate-in fade-in slide-in-from-bottom-2 motion-reduce:animate-none"
                >
                    {view === 'chat' ? (
                        <ChatView onBack={() => setView('home')} onClose={() => setOpen(false)} />
                    ) : (
                        <HomeView onOpenChat={() => setView('chat')} onClose={() => setOpen(false)} />
                    )}
                </div>
            )}

            <button
                type="button"
                aria-label={open ? 'Close contact options' : 'Contact us'}
                aria-expanded={open}
                onClick={() => setOpen(!open)}
                className={`flex h-14 w-14 items-center justify-center rounded-full shadow-xl transition-transform hover:scale-105 active:scale-95 motion-reduce:transition-none ${FOCUS_RING} ${open ? 'border border-border bg-background text-foreground' : `${ACCENT_GRADIENT} text-white`
                    }`}
            >
                {open ? <ChevronDown className="h-6 w-6" /> : <MessageCircle className="h-6 w-6" />}
            </button>
        </div>
    );
}
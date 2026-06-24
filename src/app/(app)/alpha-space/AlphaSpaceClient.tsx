"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { cn } from "@/shared/lib/cn";
import { fetchJson } from "@/shared/lib/api";
import { Button, Icon, type IconName } from "@/shared/ui";

/* ------------------------------------------------------------------ */
/* Types                                                               */
/* ------------------------------------------------------------------ */

interface SessionSummary {
  id: string;
  title: string;
  framework: string;
  challenge: string | null;
  status: string;
  step: number;
  createdAt: string;
  updatedAt: string;
  completedAt: string | null;
  _count: { messages: number };
}

interface FrameworkOption {
  key: string;
  name: string;
  tagline: string;
}

interface AlphaSpaceClientProps {
  leaderName: string;
  sessions: SessionSummary[];
  weeklyLimit: number;
  usedThisWeek: number;
  plan: string;
}

interface ChatMessage {
  role: "user" | "coach";
  content: string;
  meta?: { step?: number; suggestion?: string | null } | null;
}

interface LiveDoc {
  sections: { id: string; label: string; content: string }[];
}

/* ------------------------------------------------------------------ */
/* Component                                                           */
/* ------------------------------------------------------------------ */

export function AlphaSpaceClient({
  leaderName,
  sessions: initialSessions,
  weeklyLimit,
  usedThisWeek: initialUsed,
  plan,
}: AlphaSpaceClientProps) {
  const [sessions, setSessions] = useState<SessionSummary[]>(initialSessions);
  const [usedThisWeek, setUsedThisWeek] = useState(initialUsed);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [showNew, setShowNew] = useState(false);
  const [frameworks, setFrameworks] = useState<FrameworkOption[]>([]);
  const [docPanelOpen, setDocPanelOpen] = useState(true);

  const remaining = Math.max(0, weeklyLimit - usedThisWeek);
  const premiumLocked = weeklyLimit <= 0;

  useEffect(() => {
    fetchJson<{ frameworks: FrameworkOption[] }>("/api/alpha-space/sessions")
      .then((d) => setFrameworks(d.frameworks))
      .catch(() => undefined);
  }, []);

  const active = useMemo(
    () => sessions.find((s) => s.id === activeId) ?? null,
    [sessions, activeId]
  );

  return (
    <div className="flex h-full flex-col overflow-hidden bg-[radial-gradient(110%_50%_at_50%_-10%,#1c1830,var(--color-bg)_60%)]">
      {/* Header */}
      <header className="flex flex-none items-center justify-between gap-3 border-b border-line px-5 py-4 lg:px-7">
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex h-9 w-9 flex-none items-center justify-center rounded-xl bg-accent-soft">
            <Icon name="compass" size={20} color="var(--color-accent)" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="font-display text-[20px] leading-none text-ink">Alpha Space</h1>
              <span className="hidden sm:inline-flex items-center gap-1 rounded-full border border-line-2 bg-white/[0.03] px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.12em] text-glow">
                <Icon name="lock" size={10} color="var(--color-glow)" /> Privado
              </span>
            </div>
            <p className="text-[12px] text-ink-3 truncate">
              Espacio de pensamiento estratégico · Solo tú y Atlas
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="hidden md:flex items-center gap-2 rounded-full border border-line bg-surface px-3 py-1.5 text-[11px] text-ink-2">
            <Icon name="clock" size={13} color="var(--color-glow)" />
            <span className="font-semibold text-ink">{remaining}</span>/{weeklyLimit} esta semana
          </div>
          <Button size="sm" icon="plus" onClick={() => setShowNew(true)}>
            Nueva sesión
          </Button>
        </div>
      </header>

      <div className="flex min-h-0 flex-1">
        {/* Sessions rail */}
        <aside className="hidden w-[240px] flex-none flex-col border-r border-line bg-bg-2/40 lg:flex">
          <div className="px-3 pb-1 pt-3 text-[10.5px] font-bold uppercase tracking-[0.14em] text-ink-3">
            Sesiones
          </div>
          <div className="flex-1 overflow-y-auto scrollbar-hide px-2 pb-3">
            {sessions.length === 0 ? (
              <p className="px-2 py-4 text-xs text-ink-3">
                Aún no tienes sesiones. Empieza una nueva.
              </p>
            ) : (
              sessions.map((s) => (
                <button
                  key={s.id}
                  onClick={() => setActiveId(s.id)}
                  className={cn(
                    "mb-1 w-full rounded-xl px-3 py-2.5 text-left transition-colors",
                    activeId === s.id
                      ? "bg-accent-soft"
                      : "hover:bg-white/[0.03]"
                  )}
                >
                  <div className="flex items-center gap-2">
                    <span
                      className={cn(
                        "h-1.5 w-1.5 flex-none rounded-full",
                        s.status === "completed"
                          ? "bg-sage"
                          : s.status === "archived"
                          ? "bg-ink-3"
                          : "bg-accent"
                      )}
                    />
                    <span className="truncate text-[13.5px] font-semibold text-ink">
                      {s.title}
                    </span>
                  </div>
                  <div className="mt-1 pl-3.5 text-[11px] text-ink-3">
                    {s.framework.replace(/_/g, " ")} · {s._count.messages} msgs
                  </div>
                </button>
              ))
            )}
          </div>
          {premiumLocked && (
            <div className="m-2 rounded-xl border border-glow bg-glow-soft/40 p-3 text-[11px] text-glow">
              Tu plan <b className="uppercase">{plan}</b> no incluye Alpha Space. Actualiza para acceder.
            </div>
          )}
        </aside>

        {/* Conversation / empty state */}
        <main className="flex min-w-0 flex-1 flex-col">
          {active ? (
            <Conversation
              key={active.id}
              sessionId={active.id}
              leaderName={leaderName}
              session={active}
              docPanelOpen={docPanelOpen}
              onToggleDoc={() => setDocPanelOpen((v) => !v)}
            />
          ) : (
            <EmptyState
              leaderName={leaderName}
              onStart={() => (premiumLocked ? toast.error("Alpha Space requiere un plan premium.") : setShowNew(true))}
              frameworks={frameworks}
            />
          )}
        </main>
      </div>

      {showNew && (
        <NewSessionModal
          frameworks={frameworks}
          remaining={remaining}
          weeklyLimit={weeklyLimit}
          onClose={() => setShowNew(false)}
          onCreated={(s) => {
            setSessions((prev) => [
              {
                ...s.session,
                _count: { messages: 1 },
                createdAt: s.session.createdAt ?? new Date().toISOString(),
                updatedAt: s.session.updatedAt ?? new Date().toISOString(),
              } as SessionSummary,
              ...prev,
            ]);
            setUsedThisWeek(s.usedThisWeek);
            setActiveId(s.session.id);
            setShowNew(false);
            toast.success("Sesión creada. Atlas te espera.");
          }}
        />
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Empty state                                                         */
/* ------------------------------------------------------------------ */

function EmptyState({
  leaderName,
  onStart,
  frameworks,
}: {
  leaderName: string;
  onStart: () => void;
  frameworks: FrameworkOption[];
}) {
  return (
    <div className="flex flex-1 items-center justify-center overflow-y-auto scrollbar-hide px-6 py-10">
      <div className="w-full max-w-xl text-center">
        <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-accent-soft">
          <Icon name="compass" size={32} color="var(--color-accent)" />
        </div>
        <h2 className="font-display text-[26px] text-ink">
          Bienvenido a tu espacio, {leaderName.split(" ")[0]}.
        </h2>
        <p className="mx-auto mt-3 max-w-md text-[15px] leading-relaxed text-ink-2">
          Un entorno privado donde Atlas, tu coach estratégico, te guía para pensar
          con claridad. Preguntas, no respuestas. Estructura, no ruido.
        </p>
        <div className="mt-6">
          <Button size="lg" icon="plus" onClick={onStart}>
            Iniciar sesión de pensamiento
          </Button>
        </div>

        {frameworks.length > 0 && (
          <div className="mt-10 text-left">
            <p className="mb-3 text-[10.5px] font-bold uppercase tracking-[0.14em] text-ink-3">
              Marcos disponibles
            </p>
            <div className="grid gap-2.5 sm:grid-cols-2">
              {frameworks.slice(0, 6).map((f) => (
                <div
                  key={f.key}
                  className="rounded-2xl border border-line bg-surface p-4"
                >
                  <div className="text-[14px] font-bold text-ink">{f.name}</div>
                  <div className="mt-1 text-[12px] text-ink-3">{f.tagline}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* New session modal                                                   */
/* ------------------------------------------------------------------ */

function NewSessionModal({
  frameworks,
  remaining,
  weeklyLimit,
  onClose,
  onCreated,
}: {
  frameworks: FrameworkOption[];
  remaining: number;
  weeklyLimit: number;
  onClose: () => void;
  onCreated: (data: {
    session: {
      id: string;
      title: string;
      framework: string;
      createdAt?: string;
      updatedAt?: string;
    };
    usedThisWeek: number;
  }) => void;
}) {
  const [framework, setFramework] = useState("strategic_dialogue");
  const [title, setTitle] = useState("");
  const [creating, setCreating] = useState(false);

  const create = async () => {
    const finalTitle = title.trim() || frameworkTitle(framework);
    setCreating(true);
    try {
      const data = await fetchJson<{
        session: { id: string; title: string; framework: string };
        usedThisWeek: number;
      }>("/api/alpha-space/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: finalTitle, framework }),
      });
      onCreated(data);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "No pudimos crear la sesión.");
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-lg rounded-3xl border border-line-2 bg-bg-2 p-6 shadow-2xl">
        <div className="mb-1 flex items-center justify-between">
          <h3 className="font-display text-[20px] text-ink">Nueva sesión</h3>
          <button
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-line text-ink-3 hover:text-ink"
          >
            <Icon name="close" size={18} />
          </button>
        </div>
        <p className="mb-5 text-[13px] text-ink-3">
          Te quedan <b className="text-ink-2">{remaining}</b> de {weeklyLimit} sesiones esta semana.
        </p>

        <label className="mb-2 block text-[11px] font-bold uppercase tracking-[0.14em] text-ink-3">
          Marco de trabajo
        </label>
        <div className="mb-4 grid max-h-[260px] gap-2 overflow-y-auto scrollbar-hide">
          {frameworks.map((f) => (
            <button
              key={f.key}
              onClick={() => setFramework(f.key)}
              className={cn(
                "rounded-2xl border p-3 text-left transition-colors",
                framework === f.key
                  ? "border-accent bg-accent-soft"
                  : "border-line bg-surface hover:bg-surface-2"
              )}
            >
              <div className="flex items-center gap-2">
                <span className="text-[14px] font-bold text-ink">{f.name}</span>
                {framework === f.key && (
                  <Icon name="check" size={14} color="var(--color-accent)" />
                )}
              </div>
              <div className="mt-0.5 text-[12px] text-ink-3">{f.tagline}</div>
            </button>
          ))}
        </div>

        <label className="mb-2 block text-[11px] font-bold uppercase tracking-[0.14em] text-ink-3">
          Título (opcional)
        </label>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder={frameworkTitle(framework)}
          className="mb-5 w-full rounded-2xl border border-line bg-surface px-4 py-3 text-[15px] text-ink outline-none placeholder:text-ink-3 focus:border-accent"
        />

        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button icon="arrow" onClick={create} disabled={creating}>
            {creating ? "Creando…" : "Empezar"}
          </Button>
        </div>
      </div>
    </div>
  );
}

function frameworkTitle(key: string): string {
  const map: Record<string, string> = {
    strategic_dialogue: "Desafío estratégico",
    lean_ux: "Hipótesis de iniciativa",
    decision_brief: "Decisión a preparar",
    action_plan: "Plan de acción",
    difficult_convo: "Conversación difícil",
    prep_meeting: "Reunión de alto impacto",
    speech_practice: "Práctica de presentación",
  };
  return map[key] ?? "Sesión de pensamiento";
}

/* ------------------------------------------------------------------ */
/* Conversation                                                        */
/* ------------------------------------------------------------------ */

function Conversation({
  sessionId,
  leaderName,
  session,
  docPanelOpen,
  onToggleDoc,
}: {
  sessionId: string;
  leaderName: string;
  session: SessionSummary;
  docPanelOpen: boolean;
  onToggleDoc: () => void;
}) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [doc, setDoc] = useState<LiveDoc>({ sections: [] });
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [suggestion, setSuggestion] = useState<string | null>(null);
  const [exportOpen, setExportOpen] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const d = await fetchJson<{
          session: {
            documentJson: { sections: LiveDoc["sections"] } | null;
            messages: { role: string; content: string; meta: unknown }[];
          };
          framework: { steps: { id: string; label: string }[] };
        }>(`/api/alpha-space/sessions/${sessionId}`);
        if (cancelled) return;
        setMessages(
          d.session.messages
            .filter((m) => m.role === "user" || m.role === "coach")
            .map((m) => ({
              role: m.role as "user" | "coach",
              content: m.content,
              meta: (m.meta as ChatMessage["meta"]) ?? null,
            }))
        );
        const sections =
          d.session.documentJson?.sections ??
          d.framework.steps.map((s) => ({ id: s.id, label: s.label, content: "" }));
        setDoc({ sections });
      } catch {
        if (!cancelled) toast.error("No pudimos cargar la sesión.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [sessionId]);

  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages, sending]);

  const send = async () => {
    const text = input.trim();
    if (!text || sending) return;
    setInput("");
    setSending(true);
    setSuggestion(null);
    setMessages((prev) => [...prev, { role: "user", content: text }]);
    try {
      const data = await fetchJson<{
        reply: string;
        step: number;
        stepComplete: boolean;
        completed: boolean;
        suggestion: string | null;
        document: LiveDoc;
      }>(`/api/alpha-space/sessions/${sessionId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text }),
      });
      setMessages((prev) => [
        ...prev,
        { role: "coach", content: data.reply, meta: { step: data.step, suggestion: data.suggestion } },
      ]);
      setDoc(data.document);
      setSuggestion(data.suggestion);
      if (data.completed) toast.success("Sesión completada. Tu documento está listo.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Atlas no pudo responder.");
    } finally {
      setSending(false);
    }
  };

  const updateSection = async (id: string, content: string) => {
    setDoc((prev) => {
      const sections = prev.sections.map((s) => (s.id === id ? { ...s, content } : s));
      void persistDoc(sessionId, { sections });
      return { sections };
    });
  };

  return (
    <div className="flex h-full min-h-0">
      {/* Chat column */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Sub-header */}
        <div className="flex flex-none items-center justify-between gap-3 border-b border-line px-5 py-3 lg:px-7">
          <div className="min-w-0">
            <div className="truncate font-display text-[17px] text-ink">{session.title}</div>
            <div className="text-[11px] text-ink-3">
              {session.framework.replace(/_/g, " ")} · etapa {session.step + 1}
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              onClick={onToggleDoc}
              className={cn(
                "flex h-9 items-center gap-1.5 rounded-full border px-3 text-[12px] font-semibold transition-colors",
                docPanelOpen
                  ? "border-accent bg-accent-soft text-accent"
                  : "border-line text-ink-3 hover:text-ink"
              )}
            >
              <Icon name="doc" size={14} /> Documento
            </button>
            <button
              onClick={() => setExportOpen(true)}
              className="flex h-9 items-center gap-1.5 rounded-full border border-line px-3 text-[12px] font-semibold text-ink-2 hover:text-ink"
            >
              <Icon name="download" size={14} /> Exportar
            </button>
          </div>
        </div>

        {/* Messages */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto scrollbar-hide px-5 py-5 lg:px-7">
          {loading ? (
            <div className="flex h-full items-center justify-center">
              <Typing />
            </div>
          ) : (
            <div className="mx-auto flex max-w-2xl flex-col gap-4">
              {messages.map((m, i) => (
                <Bubble key={i} role={m.role} content={m.content} leaderName={leaderName} />
              ))}
              {sending && (
                <div className="flex items-start gap-2.5">
                  <CoachAvatar />
                  <div className="rounded-2xl rounded-tl-sm bg-surface px-4 py-3">
                    <Typing />
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Suggestion */}
        {suggestion && (
          <div className="mx-auto w-full max-w-2xl px-5 lg:px-7">
            <div className="mb-2 flex items-center gap-2 rounded-xl border border-glow bg-glow-soft/30 px-3 py-2 text-[12px] text-glow">
              <Icon name="spark" size={14} color="var(--color-glow)" />
              <span className="flex-1">{suggestion}</span>
            </div>
          </div>
        )}

        {/* Composer */}
        <div className="flex-none border-t border-line px-5 py-3.5 lg:px-7">
          <div className="mx-auto flex max-w-2xl items-end gap-2">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  void send();
                }
              }}
              rows={1}
              placeholder="Escribe tu respuesta… (Enter para enviar)"
              className="max-h-32 min-h-[48px] flex-1 resize-none rounded-2xl border border-line bg-surface px-4 py-3 text-[15px] text-ink outline-none placeholder:text-ink-3 focus:border-accent"
            />
            <Button
              size="icon"
              icon="send"
              onClick={send}
              disabled={sending || !input.trim()}
              aria-label="Enviar"
            />
          </div>
        </div>
      </div>

      {/* Document panel */}
      {docPanelOpen && (
        <aside className="hidden w-[360px] flex-none flex-col border-l border-line bg-bg-2/40 xl:flex">
          <div className="flex items-center justify-between border-b border-line px-4 py-3">
            <div className="flex items-center gap-2">
              <Icon name="doc" size={16} color="var(--color-accent)" />
              <span className="font-display text-[15px] text-ink">Documento ejecutivo</span>
            </div>
            <span className="text-[10.5px] font-bold uppercase tracking-[0.14em] text-sage">
              {doc.sections.filter((s) => s.content.trim()).length}/{doc.sections.length}
            </span>
          </div>
          <div className="flex-1 overflow-y-auto scrollbar-hide px-4 py-4">
            <p className="mb-4 text-[12px] leading-relaxed text-ink-3">
              Se construye automáticamente mientras conversas. Edita cualquier sección.
            </p>
            <div className="flex flex-col gap-3">
              {doc.sections.map((s) => (
                <DocField
                  key={s.id}
                  label={s.label}
                  value={s.content}
                  onChange={(v) => updateSection(s.id, v)}
                />
              ))}
            </div>
          </div>
          <div className="border-t border-line p-3">
            <Button full size="sm" icon="download" onClick={() => setExportOpen(true)}>
              Exportar documento
            </Button>
          </div>
        </aside>
      )}

      {exportOpen && (
        <ExportModal
          sessionId={sessionId}
          title={session.title}
          onClose={() => setExportOpen(false)}
        />
      )}
    </div>
  );
}

function persistDoc(sessionId: string, doc: LiveDoc) {
  void fetchJson(`/api/alpha-space/sessions/${sessionId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ document: doc }),
  }).catch(() => undefined);
}

function Bubble({
  role,
  content,
  leaderName,
}: {
  role: "user" | "coach";
  content: string;
  leaderName: string;
}) {
  if (role === "user") {
    return (
      <div className="flex justify-end">
        <div className="max-w-[80%]">
          <div className="mb-1 text-right text-[10.5px] font-bold uppercase tracking-[0.12em] text-ink-3">
            {leaderName.split(" ")[0]}
          </div>
          <div className="rounded-2xl rounded-tr-sm bg-accent px-4 py-3 text-[14.5px] text-accent-ink">
            {content}
          </div>
        </div>
      </div>
    );
  }
  return (
    <div className="flex items-start gap-2.5">
      <CoachAvatar />
      <div className="max-w-[80%]">
        <div className="mb-1 text-[10.5px] font-bold uppercase tracking-[0.12em] text-glow">
          Atlas
        </div>
        <div className="rounded-2xl rounded-tl-sm bg-surface px-4 py-3 text-[14.5px] leading-relaxed text-ink-2">
          {content}
        </div>
      </div>
    </div>
  );
}

function CoachAvatar() {
  return (
    <div className="flex h-8 w-8 flex-none items-center justify-center rounded-full bg-gradient-to-br from-glow to-accent">
      <Icon name="compass" size={16} color="var(--color-bg)" />
    </div>
  );
}

function Typing() {
  return (
    <div className="flex items-center gap-1 py-1">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="h-1.5 w-1.5 rounded-full bg-ink-3"
          style={{
            animation: "typing-dot 1.2s infinite ease-in-out",
            animationDelay: `${i * 0.15}s`,
          }}
        />
      ))}
    </div>
  );
}

function DocField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  const filled = value.trim().length > 0;
  return (
    <div
      className={cn(
        "rounded-xl border p-3 transition-colors",
        filled ? "border-accent/40 bg-accent-soft/30" : "border-line bg-surface"
      )}
    >
      <div className="mb-1.5 flex items-center gap-1.5">
        <span
          className={cn(
            "h-1.5 w-1.5 rounded-full",
            filled ? "bg-accent" : "bg-ink-3"
          )}
        />
        <span className="text-[11px] font-bold uppercase tracking-[0.12em] text-ink-3">
          {label}
        </span>
      </div>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={2}
        placeholder="—"
        className="w-full resize-none bg-transparent text-[13px] leading-relaxed text-ink outline-none placeholder:text-ink-3"
      />
    </div>
  );
}

function ExportModal({
  sessionId,
  title,
  onClose,
}: {
  sessionId: string;
  title: string;
  onClose: () => void;
}) {
  const [format, setFormat] = useState<"pdf" | "word" | "slides">("pdf");
  const [busy, setBusy] = useState(false);

  const doExport = async () => {
    setBusy(true);
    try {
      const res = await fetch(`/api/alpha-space/sessions/${sessionId}/export`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ format, title }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => null);
        throw new Error(j?.error ?? "No pudimos exportar.");
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${title.replace(/[^\w\s-]/g, "").trim().slice(0, 60) || "alpha-space"}.${format === "word" ? "doc" : format === "slides" ? "html" : "html"}`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      toast.success("Documento exportado.");
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error al exportar.");
    } finally {
      setBusy(false);
    }
  };

  const options: { key: "pdf" | "word" | "slides"; label: string; icon: IconName }[] = [
    { key: "pdf", label: "PDF", icon: "doc" },
    { key: "word", label: "Word", icon: "doc" },
    { key: "slides", label: "Presentación", icon: "grid" },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-md rounded-3xl border border-line-2 bg-bg-2 p-6 shadow-2xl">
        <div className="mb-1 flex items-center justify-between">
          <h3 className="font-display text-[20px] text-ink">Exportar documento</h3>
          <button
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-line text-ink-3 hover:text-ink"
          >
            <Icon name="close" size={18} />
          </button>
        </div>
        <p className="mb-5 text-[13px] text-ink-3">{title}</p>
        <div className="mb-5 grid grid-cols-3 gap-2">
          {options.map((o) => (
            <button
              key={o.key}
              onClick={() => setFormat(o.key)}
              className={cn(
                "flex flex-col items-center gap-2 rounded-2xl border p-4 transition-colors",
                format === o.key
                  ? "border-accent bg-accent-soft"
                  : "border-line bg-surface hover:bg-surface-2"
              )}
            >
              <Icon name={o.icon} size={20} color={format === o.key ? "var(--color-accent)" : "var(--color-ink-3)"} />
              <span className="text-[12px] font-semibold text-ink-2">{o.label}</span>
            </button>
          ))}
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button icon="download" onClick={doExport} disabled={busy}>
            {busy ? "Exportando…" : "Descargar"}
          </Button>
        </div>
      </div>
    </div>
  );
}

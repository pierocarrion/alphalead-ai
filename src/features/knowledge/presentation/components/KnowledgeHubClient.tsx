"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Button, Card, Icon, TopBar } from "@/shared/ui";
import { toast } from "sonner";
import { fetchJson, ApiError } from "@/shared/lib/api";
import { cn } from "@/shared/lib/cn";

interface Category {
  id: string;
  key: string;
  name: string;
  color: string | null;
  icon: string | null;
}

interface Resource {
  id: string;
  title: string;
  summary: string | null;
  contentText: string;
  fileType: string;
  sourceUrl: string | null;
  isPremium: boolean;
  tags: string[];
  categoryId: string | null;
  viewCount: number;
  useCount: number;
  updatedAt: string;
}

interface SearchHit {
  resource: {
    id: string;
    title: string;
    summary: string | null;
    tags: string[];
    isPremium: boolean;
    fileType: string;
  };
  score: number;
  snippet: string;
  source: "semantic" | "keyword" | "hybrid";
}

interface KnowledgeHubClientProps {
  workspaceId: string;
}

const FILE_LABELS: Record<string, string> = {
  text: "Texto",
  pdf: "PDF",
  docx: "Word",
  xlsx: "Excel",
  pptx: "Slides",
  image: "Imagen",
  video: "Video",
  link: "Enlace",
};

export function KnowledgeHubClient({ workspaceId }: KnowledgeHubClientProps) {
  const baseUrl = `/api/workspaces/${workspaceId}/knowledge-hub`;
  const [resources, setResources] = useState<Resource[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [semanticMode, setSemanticMode] = useState(false);
  const [searchHits, setSearchHits] = useState<SearchHit[] | null>(null);
  const [searching, setSearching] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const params = new URLSearchParams();
        if (search.trim() && !semanticMode) params.set("search", search.trim());
        if (activeCategory) params.set("categoryId", activeCategory);
        const res = await fetchJson<{ items: Resource[]; categories: Category[]; total: number }>(
          `${baseUrl}?${params.toString()}`
        );
        if (!active) return;
        setResources(res.items);
        setCategories(res.categories);
      } catch (err) {
        if (!active) return;
        toast.error(err instanceof Error ? err.message : "No pudimos cargar la biblioteca.");
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [baseUrl, search, activeCategory, semanticMode]);

  const reload = useCallback(async () => {
    try {
      const res = await fetchJson<{ items: Resource[]; categories: Category[]; total: number }>(
        `${baseUrl}?`
      );
      setResources(res.items);
      setCategories(res.categories);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "No pudimos recargar la biblioteca.");
    }
  }, [baseUrl]);

  const runSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!search.trim()) {
      setSearchHits(null);
      void reload();
      return;
    }
    setSearching(true);
    try {
      if (semanticMode) {
        const res = await fetchJson<{ results: SearchHit[] }>(`${baseUrl}/search`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ query: search.trim(), mode: "hybrid" }),
        });
        setSearchHits(res.results);
      } else {
        await reload();
        setSearchHits(null);
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "La búsqueda falló.");
    } finally {
      setSearching(false);
    }
  };

  const onUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const form = new FormData();
      form.append("file", file);
      if (activeCategory) form.append("categoryId", activeCategory);
      const res = await fetchJson<{ resource: Resource }>(`${baseUrl}/upload`, {
        method: "POST",
        body: form,
      });
      toast.success(`"${res.resource.title}" subido. Procesando con IA en segundo plano…`);
      void reload();
    } catch (err) {
      toast.error(err instanceof ApiError || err instanceof Error ? err.message : "No pudimos subir el archivo.");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const remove = async (id: string) => {
    try {
      await fetchJson(`${baseUrl}/${id}`, { method: "DELETE" });
      setResources((prev) => prev.filter((r) => r.id !== id));
      toast.success("Recurso eliminado.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "No pudimos eliminar el recurso.");
    }
  };

  return (
    <div className="flex h-full flex-col">
      <TopBar className="lg:hidden" kicker="Coordinación" title="Knowledge Hub" />
      <div className="flex-1 overflow-y-auto scrollbar-hide px-5 pt-6 pb-10 lg:mx-auto lg:w-full lg:max-w-3xl lg:pt-8">
        <header className="mb-6">
          <div className="flex items-center gap-2.5">
            <Icon name="doc" size={22} color="var(--color-accent)" />
            <h1 className="font-display text-2xl text-ink">Knowledge Hub</h1>
          </div>
          <p className="mt-2 max-w-2xl text-[14.5px] leading-relaxed text-ink-2">
            Biblioteca inteligente del equipo. Mira indexa cada documento con IA
            para responder preguntas, sugerir recursos y enriquecer el chat.
          </p>
        </header>

        {/* Search */}
        <form onSubmit={runSearch} className="mb-4 flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2">
                <Icon name="search" size={16} color="var(--color-ink-3)" />
              </span>
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Busca por palabra clave o pregunta en lenguaje natural…"
                className="w-full rounded-2xl border border-line-2 bg-surface py-3 pl-9 pr-3 text-[14.5px] text-ink placeholder:text-ink-3 outline-none focus:border-accent"
              />
            </div>
            <Button type="submit" size="sm" disabled={searching}>
              {searching ? "Buscando…" : "Buscar"}
            </Button>
          </div>
          <label className="flex items-center gap-2 text-xs text-ink-3">
            <input
              type="checkbox"
              checked={semanticMode}
              onChange={(e) => setSemanticMode(e.target.checked)}
              className="accent-[var(--color-accent)]"
            />
            Búsqueda semántica con IA (RAG)
          </label>
        </form>

        {/* Category filter */}
        <div className="mb-5 flex flex-wrap gap-2">
          <CategoryChip
            active={activeCategory === null}
            onClick={() => {
              setActiveCategory(null);
              setSearchHits(null);
            }}
            label="Todos"
          />
          {categories.map((c) => (
            <CategoryChip
              key={c.id}
              active={activeCategory === c.id}
              onClick={() => {
                setActiveCategory(c.id);
                setSearchHits(null);
              }}
              label={c.name}
              color={c.color ?? undefined}
            />
          ))}
        </div>

        {/* Actions */}
        <div className="mb-5 flex flex-wrap items-center gap-2">
          <Button size="sm" variant="ghost" onClick={() => setShowCreate((v) => !v)}>
            <Icon name="plus" size={14} color="currentColor" /> Nueva entrada
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
          >
            <Icon name="doc" size={14} color="currentColor" />
            {uploading ? "Subiendo…" : "Subir archivo"}
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            onChange={onUpload}
            accept=".pdf,.doc,.docx,.txt,.md,.csv,.xlsx,.pptx,image/*"
          />
        </div>

        {showCreate && (
          <CreateResourceForm
            baseUrl={baseUrl}
            categories={categories}
            defaultCategoryId={activeCategory}
            onCreated={() => {
              setShowCreate(false);
              void reload();
            }}
            onCancel={() => setShowCreate(false)}
          />
        )}

        {/* Semantic results */}
        {searchHits && (
          <section className="mb-6">
            <div className="mb-2 text-xs font-bold uppercase tracking-[0.14em] text-ink-3">
              Resultados por relevancia
            </div>
            {searchHits.length === 0 ? (
              <EmptyState text="No encontramos nada relevante. Prueba a reformular la pregunta." />
            ) : (
              <div className="flex flex-col gap-3">
                {searchHits.map((hit) => (
                  <Card key={hit.resource.id} className="flex flex-col gap-2">
                    <div className="flex items-start justify-between gap-3">
                      <p className="text-[15px] font-bold text-ink">{hit.resource.title}</p>
                      <SourceBadge source={hit.source} />
                    </div>
                    {hit.snippet && (
                      <p className="text-sm text-ink-2">{hit.snippet}</p>
                    )}
                    {hit.resource.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {hit.resource.tags.slice(0, 5).map((t) => (
                          <span key={t} className="rounded-full bg-surface-2 px-2 py-0.5 text-[11px] text-ink-3">
                            #{t}
                          </span>
                        ))}
                      </div>
                    )}
                  </Card>
                ))}
              </div>
            )}
          </section>
        )}

        {/* Resource list */}
        {!searchHits && (
          <section>
            {loading ? (
              <p className="text-sm text-ink-3">Cargando…</p>
            ) : resources.length === 0 ? (
              <EmptyState text="Aún no hay recursos. Sube un documento o crea una entrada para que Mira empiece a aprender." />
            ) : (
              <div className="flex flex-col gap-3">
                {resources.map((r) => (
                  <Card key={r.id} className="flex flex-col gap-2">
                    <div className="flex items-start gap-3">
                      <div className="flex h-9 w-9 flex-none items-center justify-center rounded-[12px] bg-surface-2">
                        <Icon name="doc" size={18} color="var(--color-ink-2)" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <p className="break-words text-[15px] font-bold text-ink">{r.title}</p>
                          {r.isPremium && <PremiumBadge />}
                        </div>
                        <div className="mt-0.5 flex flex-wrap items-center gap-2 text-[11px] text-ink-3">
                          <span>{FILE_LABELS[r.fileType] ?? r.fileType}</span>
                          <span>·</span>
                          <span>{r.viewCount} vistas</span>
                          {r.sourceUrl && (
                            <>
                              <span>·</span>
                              <a
                                href={r.sourceUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 hover:text-accent"
                              >
                                <Icon name="link" size={11} color="currentColor" /> origen
                              </a>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                    {r.summary && <p className="text-sm text-ink-2">{r.summary}</p>}
                    {r.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {r.tags.slice(0, 6).map((t) => (
                          <span key={t} className="rounded-full bg-surface-2 px-2 py-0.5 text-[11px] text-ink-3">
                            #{t}
                          </span>
                        ))}
                      </div>
                    )}
                    <div className="flex justify-end">
                      <Button size="sm" variant="ghost" onClick={() => remove(r.id)}>
                        Eliminar
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </section>
        )}
      </div>
    </div>
  );
}

function CategoryChip({
  active,
  onClick,
  label,
  color,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  color?: string;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "rounded-full border px-3 py-1.5 text-[12.5px] font-semibold transition-colors",
        active
          ? "border-accent bg-accent-soft text-ink"
          : "border-line-2 bg-surface text-ink-2 hover:bg-white/[0.04]"
      )}
      style={active && color ? { borderColor: color } : undefined}
    >
      {label}
    </button>
  );
}

function SourceBadge({ source }: { source: SearchHit["source"] }) {
  const map: Record<SearchHit["source"], string> = {
    semantic: "IA",
    keyword: "Texto",
    hybrid: "IA + Texto",
  };
  return (
    <span className="flex-none rounded-full bg-surface-2 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-ink-3">
      {map[source]}
    </span>
  );
}

function PremiumBadge() {
  return (
    <span className="rounded-full bg-accent px-1.5 py-0.5 text-[10px] font-bold text-accent-ink">
      PRO
    </span>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="rounded-2xl border border-line bg-surface p-8 text-center">
      <p className="text-[15px] text-ink-2">{text}</p>
    </div>
  );
}

function CreateResourceForm({
  baseUrl,
  categories,
  defaultCategoryId,
  onCreated,
  onCancel,
}: {
  baseUrl: string;
  categories: Category[];
  defaultCategoryId: string | null;
  onCreated: () => void;
  onCancel: () => void;
}) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [categoryId, setCategoryId] = useState<string | null>(defaultCategoryId);
  const [tags, setTags] = useState("");
  const [saving, setSaving] = useState(false);

  const canSave = title.trim().length > 0 && content.trim().length > 0 && !saving;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSave) return;
    setSaving(true);
    try {
      await fetchJson(`${baseUrl}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          contentText: content.trim(),
          categoryId: categoryId ?? undefined,
          tags: tags.split(",").map((t) => t.trim()).filter(Boolean),
          ingest: true,
        }),
      });
      toast.success("Recurso creado y procesado con IA.");
      onCreated();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "No pudimos guardar el recurso.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={submit} className="mb-6 flex flex-col gap-3 rounded-card border border-line bg-surface p-5">
      <div className="text-xs font-bold uppercase tracking-[0.14em] text-ink-3">Nueva entrada</div>
      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        maxLength={200}
        placeholder="Título del recurso"
        className="w-full rounded-2xl border border-line-2 bg-surface px-4 py-3 text-ink placeholder:text-ink-3 outline-none focus:border-accent"
      />
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        rows={6}
        placeholder="Pega aquí el contenido. Mira lo troceará, indexará y generará resumen + etiquetas."
        className="w-full resize-y rounded-2xl border border-line-2 bg-surface px-4 py-3 text-ink placeholder:text-ink-3 outline-none focus:border-accent"
      />
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <select
          value={categoryId ?? ""}
          onChange={(e) => setCategoryId(e.target.value || null)}
          className="rounded-2xl border border-line-2 bg-surface px-4 py-3 text-ink outline-none focus:border-accent"
        >
          <option value="">Sin categoría</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        <input
          value={tags}
          onChange={(e) => setTags(e.target.value)}
          placeholder="Etiquetas separadas por coma"
          className="rounded-2xl border border-line-2 bg-surface px-4 py-3 text-ink placeholder:text-ink-3 outline-none focus:border-accent"
        />
      </div>
      <div className="flex justify-end gap-2">
        <Button type="button" variant="ghost" size="sm" onClick={onCancel} disabled={saving}>
          Cancelar
        </Button>
        <Button type="submit" size="sm" disabled={!canSave}>
          {saving ? "Guardando…" : "Crear e indexar"}
        </Button>
      </div>
    </form>
  );
}

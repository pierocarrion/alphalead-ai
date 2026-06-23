"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Card } from "@/shared/ui";
import { toast } from "sonner";
import { fetchJson, ApiError } from "@/shared/lib/api";

interface ProjectSettings {
  id: string;
  name: string;
  emoji: string | null;
  hashtag: string;
  description: string | null;
  industry: string | null;
  category: string | null;
  teamSize: string | null;
}

const EMOJIS = ["🚀", "🌱", "🎨", "🛠️", "📊", "🔬", "📚", "💡", "🎯", "⚡", "🌍", "❤️"];

const INDUSTRIES = [
  "Tecnología",
  "Educación",
  "Salud",
  "Marketing",
  "Diseño",
  "Finanzas",
  "Construcción",
  "Retail",
  "Otro",
];

const CATEGORIES = [
  "Lanzamiento",
  "Producto",
  "Investigación",
  "Campaña",
  "Operaciones",
  "Evento",
  "Otro",
];

const TEAM_SIZES = [
  { id: "solo", label: "Solo yo (por ahora)" },
  { id: "2-5", label: "2 a 5 personas" },
  { id: "6-15", label: "6 a 15 personas" },
  { id: "16-50", label: "16 a 50 personas" },
  { id: "50+", label: "Más de 50" },
];

export function ProjectSettingsClient({ project }: { project: ProjectSettings }) {
  const router = useRouter();
  const [name, setName] = useState(project.name);
  const [emoji, setEmoji] = useState(project.emoji ?? "🚀");
  const [description, setDescription] = useState(project.description ?? "");
  const [industry, setIndustry] = useState<string | null>(project.industry);
  const [category, setCategory] = useState<string | null>(project.category);
  const [teamSize, setTeamSize] = useState<string | null>(project.teamSize);
  const [saving, setSaving] = useState(false);

  const canSave = name.trim().length >= 2 && !saving;

  const save = async () => {
    if (!canSave) return;
    setSaving(true);
    try {
      await fetchJson(`/api/workspaces/${project.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          emoji,
          description: description.trim() || undefined,
          industry: industry ?? undefined,
          category: category ?? undefined,
          teamSize: teamSize ?? undefined,
        }),
      });
      toast.success("Ajustes guardados.");
      router.refresh();
    } catch (err) {
      const msg =
        err instanceof ApiError || err instanceof Error
          ? err.message
          : "No pudimos guardar los cambios. Inténtalo de nuevo.";
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex h-full flex-col overflow-y-auto">
      <div className="mx-auto w-full max-w-2xl px-5 py-6 lg:px-8 lg:py-8">
        <div className="mb-6">
          <div className="text-xs font-bold uppercase tracking-[0.14em] text-ink-3">
            Coordinación
          </div>
          <h1 className="mt-1 font-display text-2xl text-ink">
            Ajustes del proyecto
          </h1>
          <p className="mt-1 text-[14.5px] text-ink-2">
            Identidad y contexto de {emoji} {project.name}. El hashtag no se
            puede cambiar una vez creado.
          </p>
        </div>

        <div className="flex flex-col gap-5">
          <Card className="flex flex-col gap-5 p-5">
            <div>
              <label className="block text-xs font-bold uppercase tracking-[0.14em] text-ink-3">
                Nombre
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                maxLength={60}
                className="mt-2 w-full rounded-2xl border border-line-2 bg-surface px-4 py-3 text-ink outline-none focus:border-accent"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-[0.14em] text-ink-3">
                Emoji
              </label>
              <div className="mt-2 flex flex-wrap gap-2">
                {EMOJIS.map((e) => (
                  <button
                    key={e}
                    type="button"
                    onClick={() => setEmoji(e)}
                    className={`flex h-11 w-11 items-center justify-center rounded-2xl border-[1.5px] text-xl transition-all ${
                      emoji === e
                        ? "border-accent bg-accent-soft"
                        : "border-line hover:bg-surface-2"
                    }`}
                  >
                    {e}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-[0.14em] text-ink-3">
                Hashtag <span className="font-normal normal-case text-ink-3">(no editable)</span>
              </label>
              <div className="mt-2 w-full rounded-2xl border border-line bg-surface-2 px-4 py-3 font-mono text-ink-3">
                {project.hashtag}
              </div>
            </div>
          </Card>

          <Card className="flex flex-col gap-4 p-5">
            <div>
              <label className="block text-xs font-bold uppercase tracking-[0.14em] text-ink-3">
                Descripción
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="En una o dos frases, ¿qué buscan lograr?"
                maxLength={600}
                rows={3}
                className="mt-2 w-full resize-none rounded-2xl border border-line-2 bg-surface px-4 py-3 text-ink placeholder:text-ink-3 outline-none focus:border-accent"
              />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-bold uppercase tracking-[0.14em] text-ink-3">
                  Industria
                </label>
                <div className="mt-2 flex flex-wrap gap-2">
                  {INDUSTRIES.map((ind) => (
                    <Chip
                      key={ind}
                      selected={industry === ind}
                      onClick={() =>
                        setIndustry(industry === ind ? null : ind)
                      }
                    >
                      {ind}
                    </Chip>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-[0.14em] text-ink-3">
                  Categoría
                </label>
                <div className="mt-2 flex flex-wrap gap-2">
                  {CATEGORIES.map((cat) => (
                    <Chip
                      key={cat}
                      selected={category === cat}
                      onClick={() =>
                        setCategory(category === cat ? null : cat)
                      }
                    >
                      {cat}
                    </Chip>
                  ))}
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-[0.14em] text-ink-3">
                Tamaño del equipo
              </label>
              <div className="mt-2 flex flex-wrap gap-2">
                {TEAM_SIZES.map((t) => (
                  <Chip
                    key={t.id}
                    selected={teamSize === t.id}
                    onClick={() =>
                      setTeamSize(teamSize === t.id ? null : t.id)
                    }
                  >
                    {t.label}
                  </Chip>
                ))}
              </div>
            </div>
          </Card>

          <div className="flex justify-end">
            <Button size="lg" disabled={!canSave} onClick={save}>
              {saving ? "Guardando…" : "Guardar cambios"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Chip({
  selected,
  onClick,
  children,
}: {
  selected: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full border-[1.5px] px-3 py-1.5 text-sm font-semibold transition-all ${
        selected
          ? "border-accent bg-accent-soft text-ink"
          : "border-line text-ink-2 hover:bg-surface-2"
      }`}
    >
      {children}
    </button>
  );
}

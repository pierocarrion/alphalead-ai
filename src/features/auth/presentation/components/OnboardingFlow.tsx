"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Mira, Button, Card } from "@/shared/ui";

const ROLES = [
  "I build / make",
  "I lead a team",
  "I design",
  "I write",
  "A bit of everything",
];

const HARD = [
  { id: "morning", emoji: "🌅", label: "Mornings — facing the day" },
  { id: "afternoon", emoji: "🌤️", label: "Afternoons — the slump" },
  { id: "night", emoji: "🌙", label: "Late at night" },
];

const PROFILES = [
  {
    id: "rbp",
    emoji: "📱",
    label: "I scroll late and lose sleep",
    name: "Bedtime revenge scroll",
    plan: "A calm night wind‑down to help you set the phone down and reclaim sleep.",
    when: "Evenings, ~10:30pm",
  },
  {
    id: "multi",
    emoji: "🌀",
    label: "Too many things — I freeze",
    name: "Multitask overload",
    plan: "A daytime nudge that hides the pile and points you at one single thing.",
    when: "Daytime, your first slump",
  },
];

export function OnboardingFlow() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [role, setRole] = useState<string | null>(null);
  const [hard, setHard] = useState<string | null>(null);
  const [profile, setProfile] = useState<string | null>(null);
  const [tone] = useState<"warm" | "balanced">("warm");
  const [saving, setSaving] = useState(false);

  const prof = PROFILES.find((p) => p.id === profile);

  const complete = async () => {
    if (!role || !hard || !profile) return;
    setSaving(true);
    const res = await fetch("/api/onboarding", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role, hardMoment: hard, profileId: profile, tone }),
    });
    setSaving(false);
    if (res.ok) {
      router.push("/home");
      router.refresh();
    }
  };

  const canContinue =
    (step === 0 && role) ||
    (step === 1 && hard) ||
    (step === 2 && profile) ||
    step === 3;

  return (
    <div className="flex flex-1 flex-col px-5 py-6">
      <div className="flex flex-none items-center gap-3 pb-4">
        {step > 0 ? (
          <button
            onClick={() => setStep((s) => s - 1)}
            className="flex h-10 w-10 flex-none items-center justify-center rounded-full border border-line bg-white/[0.04]"
          >
            <span className="text-ink-2">←</span>
          </button>
        ) : (
          <div className="w-10" />
        )}
        <div className="flex flex-1 gap-1.5">
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className={`h-1.5 flex-1 rounded-full transition-colors ${
                i <= step ? "bg-accent" : "bg-line-2"
              }`}
            />
          ))}
        </div>
        <span className="w-10 text-right text-xs text-ink-3">{step + 1}/4</span>
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-hide py-2">
        {step === 0 && (
          <Step>
            <Mira size={56} mood="happy" className="mb-5" />
            <h1 className="font-display text-[28px] leading-tight text-ink">
              Nice to meet you.
            </h1>
            <p className="mt-3 text-ink-2">
              What kind of work fills your days? This helps me speak your
              language.
            </p>
            <div className="mt-6 space-y-2.5">
              {ROLES.map((r) => (
                <OptionTile
                  key={r}
                  selected={role === r}
                  onClick={() => setRole(r)}
                >
                  {r}
                </OptionTile>
              ))}
            </div>
          </Step>
        )}

        {step === 1 && (
          <Step>
            <Mira size={56} mood="calm" className="mb-5" />
            <h1 className="font-display text-[28px] leading-tight text-ink">
              When is starting hardest?
            </h1>
            <p className="mt-3 text-ink-2">
              I&apos;ll show up at the moment you need a hand — and stay quiet
              the rest of the time.
            </p>
            <div className="mt-6 space-y-2.5">
              {HARD.map((h) => (
                <OptionTile
                  key={h.id}
                  selected={hard === h.id}
                  onClick={() => setHard(h.id)}
                >
                  <span className="text-xl">{h.emoji}</span>
                  {h.label}
                </OptionTile>
              ))}
            </div>
          </Step>
        )}

        {step === 2 && (
          <Step>
            <Mira size={56} mood="thinking" className="mb-5" />
            <h1 className="font-display text-[28px] leading-tight text-ink">
              What pulls you off the most?
            </h1>
            <p className="mt-3 text-ink-2">
              Be honest — I&apos;m the only one who sees this.
            </p>
            <div className="mt-6 space-y-3">
              {PROFILES.map((p) => (
                <OptionTile
                  key={p.id}
                  selected={profile === p.id}
                  onClick={() => setProfile(p.id)}
                  stacked
                >
                  <span className="flex items-center gap-3">
                    <span className="text-xl">{p.emoji}</span>
                    <span className="font-bold">{p.label}</span>
                  </span>
                </OptionTile>
              ))}
            </div>
          </Step>
        )}

        {step === 3 && prof && (
          <Step center>
            <Mira size={80} mood="happy" ring className="mb-5" />
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-accent">
              Here&apos;s how I&apos;ll show up
            </p>
            <h1 className="mt-3 font-display text-[28px] leading-tight text-ink">
              {prof.name}
            </h1>
            <p className="mt-4 max-w-[280px] text-ink-2">{prof.plan}</p>
            <Card className="mt-6 flex w-full max-w-[300px] items-center gap-3">
              <span className="text-xl">🕙</span>
              <div>
                <div className="text-xs text-ink-3">I&apos;ll gently check in</div>
                <div className="text-[15px] font-bold text-ink">{prof.when}</div>
              </div>
            </Card>
            <p className="mt-4 text-xs text-ink-3">
              You can change this anytime in Settings. No alarms, ever.
            </p>
          </Step>
        )}
      </div>

      <div className="flex-none pt-4">
        {step < 3 ? (
          <Button
            full
            size="lg"
            icon="arrow"
            disabled={!canContinue}
            onClick={() => setStep((s) => s + 1)}
          >
            Continue
          </Button>
        ) : (
          <Button
            full
            size="lg"
            disabled={saving}
            onClick={complete}
          >
            {saving ? "Saving..." : "Take me in"}
          </Button>
        )}
      </div>
    </div>
  );
}

function Step({
  children,
  center,
}: {
  children: React.ReactNode;
  center?: boolean;
}) {
  return (
    <div
      className={`flex min-h-full flex-col ${
        center ? "items-center text-center" : ""
      }`}
    >
      {children}
    </div>
  );
}

function OptionTile({
  selected,
  onClick,
  children,
  stacked,
}: {
  selected: boolean;
  onClick: () => void;
  children: React.ReactNode;
  stacked?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full rounded-[20px] border-[1.5px] bg-surface p-4 text-left text-ink transition-all active:scale-[0.98] ${
        selected
          ? "border-accent bg-accent-soft"
          : "border-line hover:bg-surface-2"
      } ${stacked ? "flex flex-col gap-1" : "flex items-center gap-3.5"}`}
    >
      {children}
    </button>
  );
}

"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Button } from "@/shared/ui";
import { fetchJson, ApiError } from "@/shared/lib/api";

interface Slot {
  start: string;
  end: string;
  weekday: string;
  dateLabel: string;
  timeLabel: string;
}

interface SlotsResponse {
  timeZone: string;
  slots: Slot[];
}

interface DemoBookingProps {
  initialEmail?: string;
  timeZone: string;
}

export function DemoBooking({ initialEmail = "", timeZone }: DemoBookingProps) {
  const [slots, setSlots] = useState<Slot[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(true);
  const [slotsError, setSlotsError] = useState("");

  const [selectedStart, setSelectedStart] = useState<string | null>(null);
  const [email, setEmail] = useState(initialEmail);
  const [name, setName] = useState("");
  const [company, setCompany] = useState("");
  const [notes, setNotes] = useState("");

  const [booking, setBooking] = useState(false);
  const [booked, setBooked] = useState<Slot | null>(null);
  const [bookError, setBookError] = useState("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoadingSlots(true);
      setSlotsError("");
      try {
        const data = await fetchJson<SlotsResponse>("/api/demo/slots");
        if (!cancelled) setSlots(data.slots);
      } catch (err) {
        if (cancelled) return;
        const msg =
          err instanceof ApiError || err instanceof Error
            ? err.message
            : "We couldn't load available times right now.";
        setSlotsError(msg);
      } finally {
        if (!cancelled) setLoadingSlots(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Group slots by day label for the calendar UI.
  const byDay = useMemo(() => {
    const groups = new Map<string, Slot[]>();
    for (const s of slots) {
      const key = `${s.weekday}, ${s.dateLabel}`;
      const arr = groups.get(key) ?? [];
      arr.push(s);
      groups.set(key, arr);
    }
    return Array.from(groups.entries());
  }, [slots]);

  const selectedSlot = useMemo(
    () => slots.find((s) => s.start === selectedStart) ?? null,
    [slots, selectedStart]
  );

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSlot) {
      setBookError("Please pick a time first.");
      return;
    }
    setBooking(true);
    setBookError("");
    try {
      await fetchJson("/api/demo/book", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          name,
          company: company || undefined,
          notes: notes || undefined,
          start: selectedSlot.start,
        }),
      });
      setBooked(selectedSlot);
      // Remove the taken slot from the list so the UI reflects reality.
      setSlots((prev) => prev.filter((s) => s.start !== selectedSlot.start));
      setSelectedStart(null);
    } catch (err) {
      const msg =
        err instanceof ApiError || err instanceof Error
          ? err.message
          : "We couldn't confirm your booking. Please try again.";
      setBookError(msg);
    } finally {
      setBooking(false);
    }
  };

  if (booked) {
    return (
      <div className="rounded-[28px] border border-sage/30 bg-sage-soft px-8 py-10 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-sage text-white">
          ✓
        </div>
        <h2 className="mt-4 font-display text-2xl text-ink">You&apos;re booked!</h2>
        <p className="mt-2 text-ink-2">
          {booked.weekday}, {booked.dateLabel} at {booked.timeLabel}{" "}
          <span className="text-ink-3">({timeZone})</span>
        </p>
        <p className="mt-3 text-sm text-ink-2">
          A calendar invite is on its way to{" "}
          <span className="font-semibold text-ink">{email}</span>. Reply to that
          email anytime to reschedule.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Link
            href="/"
            className="rounded-full bg-accent px-6 py-3 text-sm font-semibold text-white transition hover:opacity-90"
          >
            Back to home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[1.2fr_1fr]">
      {/* Calendar / slot picker */}
      <div className="rounded-[24px] border border-line bg-surface p-6">
        <div className="flex items-center justify-between">
          <h3 className="font-display text-lg text-ink">Pick a time</h3>
          <span className="text-xs text-ink-3">Times in {timeZone}</span>
        </div>

        {loadingSlots && (
          <p className="mt-6 text-sm text-ink-3">Loading availability…</p>
        )}

        {slotsError && (
          <p className="mt-6 text-sm text-red-400">{slotsError}</p>
        )}

        {!loadingSlots && !slotsError && byDay.length === 0 && (
          <p className="mt-6 text-sm text-ink-3">
            No open slots right now. Email{" "}
            <a
              href="mailto:hello@alphalead.space"
              className="text-accent underline"
            >
              hello@alphalead.space
            </a>{" "}
            and we&apos;ll find a time.
          </p>
        )}

        <div className="mt-6 max-h-[420px] space-y-5 overflow-y-auto pr-1">
          {byDay.map(([dayLabel, daySlots]) => (
            <div key={dayLabel}>
              <p className="mb-2 text-xs font-bold uppercase tracking-wider text-ink-3">
                {dayLabel}
              </p>
              <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                {daySlots.map((s) => {
                  const active = s.start === selectedStart;
                  return (
                    <button
                      key={s.start}
                      type="button"
                      onClick={() => setSelectedStart(s.start)}
                      className={`rounded-xl border px-3 py-2.5 text-sm font-semibold transition ${
                        active
                          ? "border-accent bg-accent text-white"
                          : "border-line-2 bg-bg text-ink hover:border-accent/50"
                      }`}
                    >
                      {s.timeLabel}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Details form */}
      <form
        onSubmit={submit}
        className="flex flex-col rounded-[24px] border border-line bg-surface p-6"
      >
        <h3 className="font-display text-lg text-ink">Your details</h3>

        {selectedSlot ? (
          <div className="mt-3 rounded-2xl border border-accent/30 bg-accent-soft px-4 py-3 text-sm text-ink">
            <span className="font-semibold">
              {selectedSlot.weekday}, {selectedSlot.dateLabel}
            </span>{" "}
            at {selectedSlot.timeLabel}{" "}
            <span className="text-ink-3">({timeZone})</span>
          </div>
        ) : (
          <p className="mt-3 text-sm text-ink-3">
            ← Pick a time on the left to continue.
          </p>
        )}

        <div className="mt-5 space-y-3">
          <Field label="Work email">
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@company.com"
              className={inputClass}
            />
          </Field>
          <Field label="Full name">
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Jordan Lee"
              className={inputClass}
            />
          </Field>
          <Field label="Company (optional)">
            <input
              type="text"
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              placeholder="Acme Inc."
              className={inputClass}
            />
          </Field>
          <Field label="What do you want to see? (optional)">
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. AI task prioritization, async standups…"
              rows={3}
              className={`${inputClass} resize-none`}
            />
          </Field>
        </div>

        {bookError && <p className="mt-3 text-sm text-red-400">{bookError}</p>}

        <Button
          type="submit"
          full
          size="lg"
          className="mt-5"
          loading={booking}
          disabled={!selectedSlot || booking}
        >
          Confirm demo
        </Button>
        <p className="mt-3 text-center text-xs text-ink-3">
          20-minute call · We&apos;ll send a calendar invite to your email.
        </p>
      </form>
    </div>
  );
}

const inputClass =
  "w-full rounded-2xl border border-line-2 bg-bg px-4 py-3 text-ink placeholder:text-ink-3 outline-none focus:border-accent";

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-ink-3">
        {label}
      </span>
      {children}
    </label>
  );
}

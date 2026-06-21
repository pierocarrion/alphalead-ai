"use client";

import { useState } from "react";
import { Button } from "./Button";
import { fetchJson } from "@/shared/lib/api";

interface FeedbackWidgetProps {
  onSubmitted?: () => void;
}

export function FeedbackWidget({ onSubmitted }: FeedbackWidgetProps) {
  const [type, setType] = useState<"win" | "struggle" | "testimonial" | "metric">("win");
  const [content, setContent] = useState("");
  const [status, setStatus] = useState<"idle" | "submitting" | "done" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");

  const submit = async () => {
    if (!content.trim()) return;
    setStatus("submitting");
    setErrorMessage("");
    try {
      await fetchJson("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, content, tags: ["onboarding"] }),
      });
      setStatus("done");
      setContent("");
      onSubmitted?.();
    } catch (err) {
      setStatus("error");
      setErrorMessage(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    }
  };

  return (
    <div className="rounded-card border border-line bg-surface p-5">
      <p className="text-xs font-bold uppercase tracking-[0.14em] text-ink-3">Help us improve</p>
      <div className="mt-3 flex gap-2">
        {(["win", "struggle", "testimonial"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setType(t)}
            className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
              type === t ? "bg-accent text-accent-ink" : "bg-surface-2 text-ink-2"
            }`}
          >
            {t}
          </button>
        ))}
      </div>
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="What happened? How did it feel?"
        rows={3}
        className="mt-3 w-full resize-none rounded-[18px] border border-line-2 bg-bg p-3 text-sm text-ink outline-none placeholder:text-ink-3"
      />
      <div className="mt-3 flex items-center justify-between">
        <span className="text-xs text-ink-3">
          {status === "done"
            ? "Thank you — saved."
            : status === "error"
            ? errorMessage
            : ""}
        </span>
        <Button size="sm" onClick={submit} disabled={!content.trim() || status === "submitting"}>
          Share
        </Button>
      </div>
    </div>
  );
}

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Mira, Button } from "@/shared/ui";

export function CaptureClient() {
  const [text, setText] = useState("");
  const router = useRouter();

  return (
    <div className="flex h-full flex-col">
      <div className="h-[58px] flex-none" />
      <div className="flex flex-1 flex-col justify-center px-6 pb-6">
        <Mira size={64} mood="calm" className="mx-auto mb-5" />
        <h1 className="h1 text-center text-wrap-pretty">What’s on your mind?</h1>
        <p className="body mt-2.5 text-center text-ink-2">
          Just say it plainly. Don’t organize it — that’s my job.
        </p>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="e.g. I keep avoiding the budget review…"
          rows={3}
          className="mt-5 w-full resize-none rounded-[18px] border-[1.5px] border-line-2 bg-surface p-4 text-[16.5px] leading-relaxed text-ink outline-none placeholder:text-ink-3"
        />
        <p className="mt-3 text-center text-xs text-ink-3">No due dates. No labels. Just the thing.</p>
        <div className="mt-5">
          <Button
            full
            size="lg"
            icon="arrow"
            disabled={!text.trim()}
            onClick={() => {
              // TODO: wire to API that creates a task from plain text.
              router.push("/chat");
            }}
          >
            Shrink it to one tiny step
          </Button>
        </div>
        <button
          onClick={() => router.push("/home")}
          className="mt-3 text-center text-[15px] font-semibold text-ink-3 transition-colors hover:text-ink-2"
        >
          Close
        </button>
      </div>
    </div>
  );
}

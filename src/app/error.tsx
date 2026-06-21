"use client";

import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[app-error]", error);
  }, [error]);

  return (
    <div className="flex min-h-full flex-1 flex-col items-center justify-center bg-[#15131a] p-8 text-[#f3ece1]">
      <div className="max-w-md text-center space-y-4">
        <h1 className="text-2xl font-bold" style={{ fontFamily: "var(--font-fredoka), sans-serif" }}>
          Something went wrong
        </h1>
        <p className="text-[#b7afa4]">
          We ran into a problem on our end. Please try again — your work is safe.
        </p>
        <button
          onClick={reset}
          className="mt-4 rounded-full bg-[#e6ac73] px-6 py-2 text-sm font-semibold text-[#231a10] transition hover:opacity-90"
        >
          Try again
        </button>
      </div>
    </div>
  );
}

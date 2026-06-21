"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[global-error]", error);
  }, [error]);

  return (
    <html lang="en">
      <body className="min-h-full flex flex-col items-center justify-center bg-[#15131a] text-[#f3ece1] p-8">
        <div className="max-w-md text-center space-y-4">
          <h1 className="text-2xl font-bold" style={{ fontFamily: "var(--font-fredoka), sans-serif" }}>
            Something went wrong
          </h1>
          <p className="text-[#b7afa4]">
            We hit an unexpected snag. Don&apos;t worry — your work is safe. Please try again.
          </p>
          <button
            onClick={reset}
            className="mt-4 rounded-full bg-[#e6ac73] px-6 py-2 text-sm font-semibold text-[#231a10] transition hover:opacity-90"
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}

"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const router = useRouter();

  useEffect(() => {
    console.error("[app-route-error]", error);
  }, [error]);

  return (
    <div className="flex min-h-full flex-1 flex-col items-center justify-center bg-[#15131a] p-8 text-[#f3ece1]">
      <div className="max-w-md text-center space-y-4">
        <h1 className="text-2xl font-bold" style={{ fontFamily: "var(--font-fredoka), sans-serif" }}>
          Something went wrong
        </h1>
        <p className="text-[#b7afa4]">
          We ran into a problem loading this page. Please try again.
        </p>
        <div className="mt-4 flex gap-3 justify-center">
          <button
            onClick={reset}
            className="rounded-full bg-[#e6ac73] px-6 py-2 text-sm font-semibold text-[#231a10] transition hover:opacity-90"
          >
            Try again
          </button>
          <button
            onClick={() => router.push("/home")}
            className="rounded-full border border-[rgba(255,236,214,0.14)] px-6 py-2 text-sm font-semibold text-[#f3ece1] transition hover:bg-[#2a2733]"
          >
            Go home
          </button>
        </div>
      </div>
    </div>
  );
}

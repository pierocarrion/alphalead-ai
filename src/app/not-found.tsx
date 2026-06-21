import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-full flex-1 flex-col items-center justify-center bg-[#15131a] p-8 text-[#f3ece1]">
      <div className="max-w-md text-center space-y-4">
        <h1 className="text-2xl font-bold" style={{ fontFamily: "var(--font-fredoka), sans-serif" }}>
          We couldn&apos;t find that page
        </h1>
        <p className="text-[#b7afa4]">
          The page you&apos;re looking for may have moved or no longer exists.
        </p>
        <Link
          href="/"
          className="mt-4 inline-block rounded-full bg-[#e6ac73] px-6 py-2 text-sm font-semibold text-[#231a10] transition hover:opacity-90"
        >
          Go home
        </Link>
      </div>
    </div>
  );
}

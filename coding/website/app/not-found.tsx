import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Page not found",
  description: "The page you're looking for doesn't exist.",
  robots: { index: false, follow: false },
};

export default function NotFound() {
  return (
    <main className="flex-1 flex items-center justify-center px-6 py-24">
      <div className="text-center max-w-md">
        <div className="serif text-amber text-sm mb-4 font-medium tracking-widest uppercase">
          404
        </div>
        <h1 className="serif text-4xl md:text-5xl font-medium text-forest tracking-tight mb-4">
          Page not found.
        </h1>
        <p className="text-muted mb-8 leading-relaxed">
          We couldn&apos;t find what you were looking for. The link may be
          broken or the page may have moved.
        </p>
        <Link
          href="/"
          className="inline-block bg-forest text-cream px-6 py-3 rounded-full text-sm font-medium hover:bg-forest-deep transition-colors"
        >
          Back to home
        </Link>
      </div>
    </main>
  );
}

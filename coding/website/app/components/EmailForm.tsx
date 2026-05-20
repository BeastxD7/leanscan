"use client";

import { useState } from "react";

export default function EmailForm({
  variant = "light",
}: {
  variant?: "light" | "dark";
}) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "ok" | "err">(
    "idle"
  );
  const [message, setMessage] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email || status === "loading") return;
    setStatus("loading");
    setMessage("");

    try {
      const res = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Something went wrong");
      setStatus("ok");
      setMessage("You're on the list. We'll be in touch.");
      setEmail("");
    } catch (err) {
      setStatus("err");
      setMessage(err instanceof Error ? err.message : "Try again in a moment");
    }
  }

  const isDark = variant === "dark";

  return (
    <form
      onSubmit={handleSubmit}
      className={`flex gap-2 rounded-full p-1.5 max-w-md w-full border ${
        isDark
          ? "bg-cream/10 border-cream/20"
          : "bg-paper border-line"
      }`}
    >
      <input
        type="email"
        required
        placeholder="you@example.com"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        disabled={status === "loading"}
        className={`flex-1 bg-transparent px-4 py-2.5 text-[15px] outline-none ${
          isDark
            ? "text-cream placeholder:text-cream/50"
            : "text-charcoal placeholder:text-muted"
        }`}
      />
      <button
        type="submit"
        disabled={status === "loading"}
        className={`px-5 py-2.5 rounded-full text-sm font-medium transition-colors disabled:opacity-60 ${
          isDark
            ? "bg-cream text-forest hover:bg-cream-dark"
            : "bg-forest text-cream hover:bg-forest-deep"
        }`}
      >
        {status === "loading" ? "…" : "Join waitlist"}
      </button>

      {message && (
        <p
          className={`absolute mt-14 text-sm ${
            status === "ok"
              ? isDark
                ? "text-cream/85"
                : "text-sage"
              : "text-amber"
          }`}
          role="status"
        >
          {message}
        </p>
      )}
    </form>
  );
}

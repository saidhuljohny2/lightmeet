"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

export function LoginForm() {
  const router = useRouter();
  const [username, setUsername] = useState("saidh");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");

    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });

    setLoading(false);
    if (!response.ok) {
      setError("Invalid admin username or password.");
      return;
    }

    router.push("/");
    router.refresh();
  }

  return (
    <main className="grid min-h-screen place-items-center bg-pearl px-5 text-ink">
      <form className="w-full max-w-md rounded-lg border border-white/80 bg-white/90 p-6 shadow-premium backdrop-blur-xl" onSubmit={submit}>
        <div className="mb-6">
          <div className="mb-3 grid h-12 w-12 place-items-center rounded-md bg-obsidian text-sm font-bold text-white">LM</div>
          <h1 className="text-2xl font-bold">Admin login</h1>
          <p className="mt-2 text-sm text-slate-500">Start meetings and control student participation.</p>
        </div>

        <label className="mb-1 block text-sm font-semibold text-slate-700" htmlFor="username">
          Username
        </label>
        <input id="username" className="mb-4 w-full rounded-md border border-line px-3 py-3 outline-none focus:border-brand focus:ring-4 focus:ring-blue-100" value={username} onChange={(event) => setUsername(event.target.value)} />

        <label className="mb-1 block text-sm font-semibold text-slate-700" htmlFor="password">
          Password
        </label>
        <input id="password" className="mb-4 w-full rounded-md border border-line px-3 py-3 outline-none focus:border-brand focus:ring-4 focus:ring-blue-100" type="password" value={password} onChange={(event) => setPassword(event.target.value)} />

        {error ? <p className="mb-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p> : null}

        <button className="w-full rounded-md bg-obsidian px-4 py-3 font-semibold text-white shadow-control transition hover:bg-slate-800" disabled={loading} type="submit">
          {loading ? "Signing in..." : "Sign in"}
        </button>
      </form>
    </main>
  );
}

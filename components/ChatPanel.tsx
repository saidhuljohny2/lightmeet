"use client";

import { FormEvent, useState } from "react";
import type { ChatMessage } from "@/types/meeting";

type ChatPanelProps = {
  messages: ChatMessage[];
  onSend: (message: string) => void;
};

export function ChatPanel({ messages, onSend }: ChatPanelProps) {
  const [draft, setDraft] = useState("");

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onSend(draft);
    setDraft("");
  }

  return (
    <aside className="flex min-h-[420px] flex-col rounded-lg border border-white/10 bg-white/[0.08] shadow-control backdrop-blur-xl">
      <div className="border-b border-white/10 px-4 py-3">
        <h2 className="font-semibold">Chat</h2>
      </div>
      <div className="flex-1 space-y-3 overflow-y-auto p-4">
        {messages.length === 0 ? (
          <p className="text-sm text-slate-400">Messages will appear here.</p>
        ) : (
          messages.map((message) => (
            <div key={message.id} className={message.mine ? "text-right" : ""}>
              <div className="mb-1 text-xs text-slate-400">
                {message.mine ? "You" : message.name} · {new Date(message.sentAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
              </div>
              <p className={`inline-block max-w-full rounded-md px-3 py-2 text-sm ${message.mine ? "bg-brand text-white" : "bg-white/10 text-white"}`}>
                {message.text}
              </p>
            </div>
          ))
        )}
      </div>
      <form className="flex gap-2 border-t border-white/10 p-3" onSubmit={submit}>
        <input
          className="min-w-0 flex-1 rounded-md border border-white/10 bg-white/10 px-3 py-2 text-white outline-none placeholder:text-slate-400 focus:border-blue-300 focus:ring-4 focus:ring-blue-400/20"
          placeholder="Type a message"
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
        />
        <button className="rounded-md bg-white px-4 py-2 text-sm font-semibold text-obsidian transition hover:bg-slate-100" type="submit">
          Send
        </button>
      </form>
    </aside>
  );
}

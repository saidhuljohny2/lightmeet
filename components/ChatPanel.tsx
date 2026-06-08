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
    <aside className="flex min-h-[420px] flex-col rounded-lg border border-line bg-white shadow-sm dark:border-slate-800 dark:bg-slate-950">
      <div className="border-b border-line px-4 py-3 dark:border-slate-800">
        <h2 className="font-semibold">Chat</h2>
      </div>
      <div className="flex-1 space-y-3 overflow-y-auto p-4">
        {messages.length === 0 ? (
          <p className="text-sm text-slate-500 dark:text-slate-400">Messages will appear here.</p>
        ) : (
          messages.map((message) => (
            <div key={message.id} className={message.mine ? "text-right" : ""}>
              <div className="mb-1 text-xs text-slate-500 dark:text-slate-400">
                {message.mine ? "You" : message.name} · {new Date(message.sentAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
              </div>
              <p className={`inline-block max-w-full rounded-md px-3 py-2 text-sm ${message.mine ? "bg-brand text-white" : "bg-slate-100 dark:bg-slate-900"}`}>
                {message.text}
              </p>
            </div>
          ))
        )}
      </div>
      <form className="flex gap-2 border-t border-line p-3 dark:border-slate-800" onSubmit={submit}>
        <input
          className="min-w-0 flex-1 rounded-md border border-line bg-white px-3 py-2 outline-none focus:border-brand focus:ring-4 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-950 dark:focus:ring-blue-950"
          placeholder="Type a message"
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
        />
        <button className="rounded-md bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700" type="submit">
          Send
        </button>
      </form>
    </aside>
  );
}

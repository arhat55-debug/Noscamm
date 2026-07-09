"use client";

import { useEffect, useMemo, useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import type { TradeMessage } from "@/lib/marketplace/types";

export function RealtimeTradeMessages({ tradeId, initialMessages }: { tradeId: string; initialMessages: TradeMessage[] }) {
  const [messages, setMessages] = useState(initialMessages);
  const configured = useMemo(() => Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY), []);

  useEffect(() => {
    if (!configured) return;

    const supabase = createSupabaseBrowserClient();
    const channel = supabase
      .channel(`trade-room:${tradeId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "trade_messages", filter: `trade_id=eq.${tradeId}` },
        (payload) => {
          setMessages((current) => [...current, payload.new as TradeMessage]);
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [configured, tradeId]);

  return (
    <div className="space-y-3">
      {messages.map((message) => (
        <div key={message.id ?? `${message.created_at}-${message.message}`} className="rounded-3xl border border-white/10 bg-white/[0.03] p-4">
          <div className="mb-2 flex items-center justify-between gap-3 text-xs text-zinc-500">
            <span className="font-bold uppercase tracking-wide text-gold">{message.sender?.username ?? "System"}</span>
            <span>{message.created_at ? new Date(message.created_at).toLocaleString() : "Now"}</span>
          </div>
          <p className="whitespace-pre-wrap text-sm leading-6 text-zinc-200">{message.message}</p>
          {message.attachment ? <a className="mt-3 inline-flex text-sm font-bold text-gold underline" href={message.attachment} target="_blank" rel="noreferrer">Open attachment</a> : null}
        </div>
      ))}
    </div>
  );
}

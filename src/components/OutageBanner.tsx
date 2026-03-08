"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase-browser";
import type { ServiceOutage } from "@/lib/types";

export default function OutageBanner() {
  const [outage, setOutage] = useState<ServiceOutage | null>(null);
  const [dismissed, setDismissed] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();

    // Initial fetch
    supabase
      .from("service_outages")
      .select("*")
      .eq("is_resolved", false)
      .order("start_time", { ascending: false })
      .limit(1)
      .then(({ data }) => {
        if (data?.[0]) setOutage(data[0]);
      });

    // Realtime subscription
    const channel = supabase
      .channel("outages:active")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "service_outages",
          filter: "is_resolved=eq.false",
        },
        (payload) => {
          if (payload.eventType === "DELETE" || (payload.new as ServiceOutage)?.is_resolved) {
            setOutage(null);
          } else {
            setOutage(payload.new as ServiceOutage);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  if (!outage || dismissed === outage.id) return null;

  const severityColors = {
    info: "bg-blue/10 border-blue text-blue",
    warning: "bg-amber-500/10 border-amber-500 text-amber-500",
    critical: "bg-red-500/10 border-red-500 text-red-500",
  };

  return (
    <div
      className={`fixed top-0 left-0 right-0 z-[60] border-b px-4 py-3 text-center text-sm ${
        severityColors[outage.severity] || severityColors.info
      }`}
    >
      <div className="container-ew flex items-center justify-center gap-3">
        <span className="font-semibold">{outage.title}</span>
        {outage.description && (
          <span className="hidden sm:inline opacity-80">— {outage.description}</span>
        )}
        <button
          onClick={() => setDismissed(outage.id)}
          className="ml-2 opacity-60 hover:opacity-100 transition-opacity"
          aria-label="Dismiss"
        >
          ✕
        </button>
      </div>
    </div>
  );
}

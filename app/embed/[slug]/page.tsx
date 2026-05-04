"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import FlowViewer from "@/components/FlowViewer";
import { getFlowByIdOrSlug } from "@/lib/queries";
import type { Flow } from "@/lib/types";

export default function EmbedFluxoPage() {
  const params = useParams();
  const slug = params.slug as string;
  const [flow, setFlow] = useState<Flow | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadFlow() {
      try {
        const data = await getFlowByIdOrSlug(slug);
        setFlow(data);
      } catch (err) {
        console.error("Error loading flow:", err);
      } finally {
        setLoading(false);
      }
    }
    if (slug) loadFlow();
  }, [slug]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-50 text-slate-800">
        <div className="animate-pulse">Carregando diagrama...</div>
      </div>
    );
  }

  if (!flow) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-slate-50 text-slate-800 p-6 text-center">
        <h1 className="text-xl font-bold mb-2">Diagrama não encontrado</h1>
        <p className="text-slate-500">Pode ter sido removido ou o link está incorreto.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden">
      <FlowViewer flow={flow} />
    </div>
  );
}

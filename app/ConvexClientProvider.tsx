"use client";

import { ConvexProvider, ConvexReactClient } from "convex/react";
import { useState, type ReactNode } from "react";

export function ConvexClientProvider({ children }: { children: ReactNode }) {
  const url = process.env.NEXT_PUBLIC_CONVEX_URL;
  const [client] = useState(() => url ? new ConvexReactClient(url) : null);
  if (!client) return <main className="grid min-h-screen place-items-center p-6 text-center"><div><h1 className="text-2xl font-black">Bağlantı kurulamadı</h1><p className="mt-2 text-slate-500">Lütfen sayfayı yenileyip tekrar deneyin.</p></div></main>;
  return <ConvexProvider client={client}>{children}</ConvexProvider>;
}

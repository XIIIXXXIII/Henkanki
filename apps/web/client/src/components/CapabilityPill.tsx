/** Kanso Industrial: compact, high-contrast status markings used across the workspace. */
import { cn } from "@/lib/utils";

export function CapabilityPill({ status, className }: { status: "available" | "optional dependency" | "experimental"; className?: string }) {
  const palette = status === "available" ? "border-cyan-400/40 bg-cyan-400/10 text-cyan-100" : status === "experimental" ? "border-amber-300/40 bg-amber-300/10 text-amber-100" : "border-zinc-500 bg-zinc-800/70 text-zinc-300";
  return <span className={cn("inline-flex items-center gap-1.5 border px-2 py-1 font-mono text-[10px] uppercase tracking-[0.14em]", palette, className)}><span className="h-1.5 w-1.5 rounded-full bg-current" />{status}</span>;
}

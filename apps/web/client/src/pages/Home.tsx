/** Kanso Industrial: an asymmetric local conversion desk with explicit routes and signals. */
import { useMemo, useRef, useState } from "react";
import { ArrowDownToLine, ArrowRight, Braces, Check, ChevronDown, CircleAlert, Clipboard, FileUp, FolderOpen, HardDrive, Layers3, LoaderCircle, MonitorCog, RotateCcw, ShieldCheck, Sparkles, TerminalSquare, WandSparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CapabilityPill } from "@/components/CapabilityPill";
import { browserFormats, convertInBrowser, detectBrowserFormat, planBrowserRoute, type BrowserFormat } from "@/lib/local-converter";
import { useTheme } from "@/contexts/ThemeContext";
import { toast } from "sonner";

const heroImage = "/brand/hero-workspace.png";
const atlasImage = "/brand/format-atlas.png";
const platformImage = "/brand/platform-map.png";
const markImage = "/brand/mark.png";

const sampleJson = '{\n  "project": "Henkanki",\n  "localFirst": true,\n  "ports": ["FreeBSD", "Haiku"]\n}\n';

export default function Home() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [source, setSource] = useState(sampleJson); const [from, setFrom] = useState<BrowserFormat>("json"); const [to, setTo] = useState<BrowserFormat>("yaml");
  const [result, setResult] = useState(""); const [fileName, setFileName] = useState("manifest.json"); const [busy, setBusy] = useState(false);
  const { theme, toggleTheme } = useTheme();
  const plan = useMemo(() => planBrowserRoute(from, to), [from, to]);
  const targetLabel = browserFormats.find((format) => format.id === to)?.label ?? to;

  async function openFile(file?: File) {
    if (!file) return; setFileName(file.name); const detected = detectBrowserFormat(file.name);
    if (browserFormats.some((format) => format.id === detected)) setFrom(detected);
    const content = await file.text(); setSource(content); setResult(""); toast.success("File read locally", { description: `${file.name} stays in your browser.` });
  }
  function swap() { setFrom(to); setTo(from); setResult(""); }
  async function execute() {
    if (plan.status !== "available") { toast.error("Route needs the native engine", { description: plan.message }); return; }
    setBusy(true); await new Promise((resolve) => setTimeout(resolve, 180));
    try { const output = convertInBrowser(source, from, to); setResult(output); toast.success("Conversion complete", { description: "No file left this device." }); }
    catch (error) { toast.error("Conversion stopped", { description: error instanceof Error ? error.message : "Invalid input" }); }
    finally { setBusy(false); }
  }
  function download() {
    if (!result) return; const name = fileName.replace(/\.[^.]+$/, "") + `.${to === "text" ? "txt" : to}`;
    const link = document.createElement("a"); link.href = URL.createObjectURL(new Blob([result], { type: "text/plain;charset=utf-8" })); link.download = name; link.click(); URL.revokeObjectURL(link.href);
  }
  async function copyResult() { await navigator.clipboard.writeText(result); toast.success("Output copied locally"); }

  return <div className="min-h-screen overflow-x-hidden bg-[#121211] text-stone-100 selection:bg-[#d83a32] selection:text-white">
    <div className="noise pointer-events-none fixed inset-0 opacity-30" />
    <header className="relative z-10 flex items-center justify-between border-b border-white/10 px-5 py-4 md:px-10">
      <div className="flex items-center gap-3"><img src={markImage} alt="Henkanki mark" className="h-11 w-11 object-contain" /><div><p className="font-mono text-[10px] uppercase tracking-[0.22em] text-cyan-300">Local conversion engine</p><p className="font-display text-xl font-bold tracking-tight">Henkanki</p></div></div>
      <div className="flex items-center gap-3"><span className="hidden font-mono text-[10px] uppercase tracking-[0.14em] text-stone-400 sm:block">v1 / local-first</span><button aria-label="Toggle color theme" onClick={toggleTheme} className="border border-white/15 px-3 py-2 font-mono text-[10px] uppercase tracking-[0.13em] text-stone-300 transition hover:border-cyan-300 hover:text-cyan-100">{theme === "dark" ? "Light desk" : "Dark desk"}</button></div>
    </header>

    <main className="relative z-10 mx-auto max-w-[1480px] px-5 pb-20 pt-6 md:px-10">
      <section className="grid gap-5 lg:grid-cols-[0.8fr_1.35fr]">
        <div className="relative min-h-[410px] overflow-hidden border border-white/10 bg-[#e7dfd1] text-[#161616]">
          <img src={heroImage} alt="Abstract Henkanki conversion workspace" className="absolute inset-0 h-full w-full object-cover opacity-75 mix-blend-multiply" />
          <div className="relative flex h-full flex-col justify-between p-7 md:p-9"><div className="flex items-center justify-between"><span className="font-mono text-[10px] uppercase tracking-[0.18em]">01 / Transform locally</span><ShieldCheck className="h-5 w-5 text-[#d83a32]" /></div><div className="max-w-md"><p className="mb-3 font-mono text-xs uppercase tracking-[0.18em] text-[#d83a32]">No upload. No account. No tracking.</p><h1 className="font-display text-5xl font-bold leading-[0.91] tracking-[-0.06em] md:text-6xl">Convert where your files live.</h1><p className="mt-5 max-w-sm text-sm leading-6 text-black/70">Build a verified route before you run it. Browser for text; native adapters for heavier work.</p></div><div className="flex items-end justify-between"><p className="font-mono text-[11px] uppercase tracking-[0.13em]">JSON · PDF · WAV · ZIP</p><span className="grid h-12 w-12 place-items-center bg-[#d83a32] text-xl text-white">変</span></div></div>
        </div>

        <section className="workspace-grid border border-white/10 bg-[#1a1a18] p-1 shadow-[0_25px_80px_rgba(0,0,0,.25)]">
          <div className="grid gap-px bg-white/10 lg:grid-cols-[180px_1fr]">
            <aside className="bg-[#171716] p-5"><p className="font-mono text-[10px] uppercase tracking-[0.18em] text-stone-500">Conversion route</p><ol className="mt-7 space-y-5"><li className="route-step active"><span>01</span><div><b>Input</b><small>{fileName}</small></div></li><li className="route-step active"><span>02</span><div><b>Plan</b><small>{plan.status}</small></div></li><li className="route-step"><span>03</span><div><b>Output</b><small>{targetLabel}</small></div></li></ol><div className="mt-10 border-t border-white/10 pt-5"><HardDrive className="h-4 w-4 text-cyan-300" /><p className="mt-2 text-xs leading-5 text-stone-400">Workspace state stays in this browser.</p></div></aside>
            <div className="bg-[#20201e] p-5 md:p-6"><div className="flex flex-wrap items-start justify-between gap-4"><div><p className="font-mono text-[10px] uppercase tracking-[0.18em] text-stone-500">Live conversion desk</p><h2 className="mt-1 font-display text-2xl font-bold tracking-tight">Build the route</h2></div><CapabilityPill status={plan.status === "available" ? "available" : "optional dependency"} /></div>
              <div className="mt-5 grid gap-3 md:grid-cols-[1fr_auto_1fr]"><label className="field-label">From<select value={from} onChange={(event) => setFrom(event.target.value as BrowserFormat)}>{browserFormats.map((format) => <option key={format.id} value={format.id}>{format.label}</option>)}</select></label><button onClick={swap} aria-label="Swap source and target" className="self-end border border-white/15 p-3 text-stone-400 transition hover:border-[#d83a32] hover:text-[#ff6058]"><ArrowRight className="h-4 w-4 md:rotate-0 rotate-90" /></button><label className="field-label">To<select value={to} onChange={(event) => setTo(event.target.value as BrowserFormat)}>{browserFormats.map((format) => <option key={format.id} value={format.id}>{format.label}</option>)}</select></label></div>
              <div className="mt-4 flex flex-wrap items-center gap-3 border-y border-white/10 py-3"><button onClick={() => inputRef.current?.click()} className="inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.13em] text-cyan-200 transition hover:text-white"><FolderOpen className="h-4 w-4" /> open local file</button><span className="h-4 w-px bg-white/15" /><span className="text-xs text-stone-400">{plan.message}</span><input ref={inputRef} onChange={(event) => openFile(event.target.files?.[0])} type="file" className="hidden" /></div>
              <div className="mt-5 grid gap-4 xl:grid-cols-2"><label className="code-panel"><span>INPUT / {from.toUpperCase()}</span><textarea value={source} onChange={(event) => setSource(event.target.value)} spellCheck={false} /></label><label className="code-panel output"><span>OUTPUT / {to.toUpperCase()}</span><textarea value={result} readOnly placeholder="Output appears here after conversion." spellCheck={false} /></label></div>
              <div className="mt-4 flex flex-wrap items-center justify-between gap-3"><p className="flex items-center gap-2 text-xs text-stone-500"><CircleAlert className="h-3.5 w-3.5" /> Browser desk supports verified text routes. Heavy formats hand off to CLI/Desktop.</p><div className="flex gap-2"><Button variant="outline" size="sm" onClick={copyResult} disabled={!result} className="rounded-none border-white/15 bg-transparent text-stone-200 hover:bg-white/10 hover:text-white"><Clipboard className="mr-2 h-3.5 w-3.5" />Copy</Button><Button size="sm" onClick={download} disabled={!result} className="rounded-none bg-[#d83a32] text-white hover:bg-[#f0483f]"><ArrowDownToLine className="mr-2 h-3.5 w-3.5" />Download</Button><Button size="sm" onClick={execute} disabled={busy} className="rounded-none bg-cyan-300 text-[#112020] hover:bg-cyan-200">{busy ? <LoaderCircle className="mr-2 h-3.5 w-3.5 animate-spin" /> : <WandSparkles className="mr-2 h-3.5 w-3.5" />}{busy ? "Converting" : "Transform"}</Button></div></div>
            </div>
          </div>
        </section>
      </section>

      <section className="mt-5 grid gap-5 lg:grid-cols-[1.25fr_.75fr]"><div className="border border-white/10 bg-[#181817] p-5 md:p-7"><div className="flex items-end justify-between"><div><p className="font-mono text-[10px] uppercase tracking-[0.18em] text-stone-500">Verified surface</p><h2 className="mt-2 font-display text-3xl font-bold tracking-tight">Formats with a route, not a promise.</h2></div><Layers3 className="h-7 w-7 text-[#d83a32]" /></div><div className="mt-6 grid gap-3 sm:grid-cols-3">{[["Structured", "JSON · YAML · CSV", Braces], ["Text", "Markdown · HTML", TerminalSquare], ["Native", "PDF · Media · Archive", MonitorCog]].map(([title, copy, Icon]: any, index) => <div key={title} className="border border-white/10 bg-[#20201e] p-4"><Icon className={index === 2 ? "h-5 w-5 text-[#d83a32]" : "h-5 w-5 text-cyan-300"} /><p className="mt-5 font-display text-lg font-bold">{title}</p><p className="mt-1 text-xs leading-5 text-stone-400">{copy}</p></div>)}</div><div className="mt-6 border-t border-white/10 pt-5"><p className="font-mono text-[10px] uppercase tracking-[0.14em] text-stone-500">CLI routing</p><code className="mt-2 block overflow-x-auto bg-black/30 p-3 text-sm text-cyan-100">henkanki plan pdf text <span className="text-stone-500">→ checks local dependency before the file moves</span></code></div></div><div className="relative min-h-[330px] overflow-hidden border border-white/10"><img src={atlasImage} alt="Abstract Henkanki format atlas" className="absolute inset-0 h-full w-full object-cover opacity-65" /><div className="absolute inset-0 bg-gradient-to-t from-[#10100f] via-[#10100f]/20 to-transparent" /><div className="relative flex h-full flex-col justify-end p-6"><p className="font-mono text-[10px] uppercase tracking-[0.18em] text-cyan-200">Local operation catalog</p><p className="mt-2 max-w-sm font-display text-3xl font-bold leading-tight">Every route carries its own requirements.</p></div></div></section>

      <section className="mt-5 grid gap-5 lg:grid-cols-[.75fr_1.25fr]"><div className="relative min-h-[270px] overflow-hidden border border-white/10"><img src={platformImage} alt="Abstract platform support illustration" className="absolute inset-0 h-full w-full object-cover opacity-80" /><div className="absolute inset-0 bg-[#10100f]/35" /><div className="relative p-6"><p className="font-mono text-[10px] uppercase tracking-[0.17em] text-cyan-200">Platform-first</p><h2 className="mt-3 max-w-xs font-display text-3xl font-bold leading-tight">FreeBSD and Haiku are routes, not footnotes.</h2></div></div><div className="border border-white/10 bg-[#e7dfd1] p-6 text-[#151515] md:p-8"><div className="flex flex-wrap items-start justify-between gap-4"><div><p className="font-mono text-[10px] uppercase tracking-[0.18em] text-[#786f65]">What runs where</p><h2 className="mt-2 font-display text-3xl font-bold tracking-tight">Honest support levels.</h2></div><Sparkles className="h-6 w-6 text-[#d83a32]" /></div><div className="mt-7 grid gap-4 sm:grid-cols-3">{[["Official", "CLI + verified adapters", "FreeBSD · Linux · Windows · macOS"], ["Supported", "Recipe and smoke path", "Haiku · ARM · mobile"], ["Experimental", "Source & documented path", "RISC-V · BSD family · retro"]].map(([level, claim, targets], index) => <div key={level} className="border-t-2 border-[#171717] pt-3"><p className={index === 0 ? "font-mono text-[10px] uppercase tracking-[.15em] text-[#d83a32]" : "font-mono text-[10px] uppercase tracking-[.15em] text-[#70685f]"}>{level}</p><p className="mt-2 font-semibold text-sm">{claim}</p><p className="mt-2 text-xs leading-5 text-black/60">{targets}</p></div>)}</div></div></section>
    </main>
  </div>;
}

/** Utility Frame: direct local file-to-result workbench; no marketing or remote processing. */
import { useMemo, useRef, useState } from "react";
import { ArrowDownToLine, ArrowRightLeft, CheckCircle2, Clipboard, FileCode2, FileUp, HardDrive, History, LoaderCircle, RotateCcw, ShieldCheck, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { browserFormats, convertInBrowser, detectBrowserFile, formatOptions, planBrowserRoute, type BrowserDetection, type PwaFormat } from "@/lib/local-converter";
import { toast } from "sonner";

type RecentConversion = { id: string; name: string; from: string; to: string; size: number; createdAt: string };
const historyKey = "henkanki.recent-routes.v1";
const toBytes = (bytes: number) => bytes < 1024 ? `${bytes} B` : bytes < 1024 ** 2 ? `${(bytes / 1024).toFixed(1)} KB` : `${(bytes / 1024 ** 2).toFixed(1)} MB`;
const lineCount = (value: string) => Math.max(1, value.split("\n").length);
function conversionError(error: unknown) { const text = error instanceof Error ? error.message : "The conversion stopped before a result was produced."; return text.replace(/^Unexpected token/, "Invalid JSON:"); }

export default function Home() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [source, setSource] = useState(""); const [from, setFrom] = useState<PwaFormat>("json"); const [to, setTo] = useState<PwaFormat>("yaml");
  const [result, setResult] = useState(""); const [file, setFile] = useState<File | null>(null); const [busy, setBusy] = useState(false); const [dragging, setDragging] = useState(false); const [error, setError] = useState("");
  const [detection, setDetection] = useState<BrowserDetection>({ format: "json", confidence: 0.3, method: "fallback", evidence: "manual input" });
  const [recent, setRecent] = useState<RecentConversion[]>(() => { try { return JSON.parse(localStorage.getItem(historyKey) || "[]"); } catch { return []; } });
  const plan = useMemo(() => planBrowserRoute(from, to), [from, to]);
  const targetLabel = formatOptions.find((format) => format.id === to)?.label ?? to;

  async function openFile(file?: File) {
    if (!file) return; setError(""); setFile(file); const detected = await detectBrowserFile(file); setDetection(detected); setFrom(detected.format);
    try { const content = browserFormats.some((format) => format.id === detected.format) ? await file.text() : ""; setSource(content); setResult(""); toast.success("File identified locally", { description: `${detected.format.toUpperCase()} · ${detected.method} · ${Math.round(detected.confidence * 100)}% confidence.` }); }
    catch { setError("The browser could not read this file. Check its permissions and try again."); }
  }
  function swap() { setFrom(to); setTo(from); setResult(""); setError(""); }
  function reset() { setFile(null); setSource(""); setResult(""); setError(""); setDetection({ format: "json", confidence: 0.3, method: "fallback", evidence: "manual input" }); inputRef.current && (inputRef.current.value = ""); }
  function record() { const item = { id: crypto.randomUUID(), name: file?.name || "Untitled input", from, to, size: new Blob([source]).size, createdAt: new Date().toISOString() }; const next = [item, ...recent].slice(0, 5); setRecent(next); localStorage.setItem(historyKey, JSON.stringify(next)); }
  function clearHistory() { setRecent([]); localStorage.removeItem(historyKey); }
  async function execute() {
    setError(""); if (plan.status !== "available") { setError(plan.message); return; }
    setBusy(true); await new Promise((resolve) => setTimeout(resolve, 180));
    try { const output = convertInBrowser(source, from, to); setResult(output); record(); toast.success("Conversion complete", { description: "The result stayed in this browser." }); }
    catch (failure) { const message = conversionError(failure); setError(message); toast.error("Conversion stopped", { description: message }); }
    finally { setBusy(false); }
  }
  function download() {
    if (!result) return; const name = (file?.name || "henkanki-output").replace(/\.[^.]+$/, "") + `.${to === "text" ? "txt" : to}`;
    const link = document.createElement("a"); link.href = URL.createObjectURL(new Blob([result], { type: "text/plain;charset=utf-8" })); link.download = name; link.click(); URL.revokeObjectURL(link.href);
  }
  async function copyResult() { await navigator.clipboard.writeText(result); toast.success("Output copied locally"); }

  return <div className="min-h-screen bg-[#111211] text-[#e8e8e4] selection:bg-[#d83a32] selection:text-white">
    <header className="workspace-header"><a href="/" className="wordmark" aria-label="Henkanki workspace"><span>H/</span> Henkanki</a><div className="header-status"><ShieldCheck className="h-3.5 w-3.5" /> Local workspace <span>v1</span></div></header>
    <main className="workspace-shell">
      <section className="workspace-title"><div><p>CONVERSION DESK / 01</p><h1>File in. Result out.</h1></div><p>No uploads, accounts, or hidden processing. Browser routes run here; native routes are identified before they run.</p></section>
      <section className="workbench">
        <aside className="file-rail">
          <div className="rail-heading"><span>INPUT FILE</span>{file && <button onClick={reset} className="quiet-button"><X className="h-3.5 w-3.5" /> Clear</button>}</div>
          <button onDragOver={(event) => { event.preventDefault(); setDragging(true); }} onDragLeave={() => setDragging(false)} onDrop={(event) => { event.preventDefault(); setDragging(false); openFile(event.dataTransfer.files[0]); }} onClick={() => inputRef.current?.click()} className={`drop-target ${dragging ? "is-dragging" : ""}`}>
            <FileUp className="h-6 w-6" /><b>{file ? "Replace file" : "Drop a file here"}</b><span>or choose from this device</span>
          </button>
          <input ref={inputRef} onChange={(event) => openFile(event.target.files?.[0])} type="file" className="hidden" />
          <div className="file-record">{file ? <><FileCode2 className="h-5 w-5" /><div><b>{file.name}</b><span>{toBytes(file.size)} · {from.toUpperCase()} · {Math.round(detection.confidence * 100)}%</span><span>{detection.method}: {detection.evidence}</span></div></> : <><HardDrive className="h-5 w-5" /><div><b>No file selected</b><span>Paste text into the input editor to work manually.</span></div></>}</div>
          <div className="rail-note"><ShieldCheck className="h-4 w-4" /><span>Input stays in this browser. Recent routes store metadata only.</span></div>
          <div className="recent-block"><div className="rail-heading"><span><History className="mr-1.5 inline h-3.5 w-3.5" /> RECENT ROUTES</span>{recent.length > 0 && <button onClick={clearHistory} className="quiet-button"><Trash2 className="h-3.5 w-3.5" /> Clear</button>}</div>{recent.length ? <ul>{recent.map((item) => <li key={item.id}><span>{item.name}</span><small>{item.from} → {item.to} · {new Date(item.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</small></li>)}</ul> : <p className="empty-copy">No completed routes on this device.</p>}</div>
        </aside>
        <section className="task-area">
          <div className="route-bar"><div className="route-select"><label>FROM</label><select value={from} onChange={(event) => { setFrom(event.target.value as PwaFormat); setResult(""); setError(""); }}>{formatOptions.map((format) => <option key={format.id} value={format.id}>{format.mode === "native" ? `CLI · ${format.label}` : format.label}</option>)}</select></div><button onClick={swap} aria-label="Swap source and target" className="swap-button"><ArrowRightLeft className="h-4 w-4" /></button><div className="route-select"><label>TO</label><select value={to} onChange={(event) => { setTo(event.target.value as PwaFormat); setResult(""); setError(""); }}>{formatOptions.map((format) => <option key={format.id} value={format.id}>{format.mode === "native" ? `CLI · ${format.label}` : format.label}</option>)}</select></div><div className={`route-status ${plan.status === "available" ? "ready" : "native"}`}><span>{plan.status === "available" ? "BROWSER READY" : "CLI / DESKTOP"}</span><small>{plan.message}</small></div></div>
          {error && <div className="error-row"><X className="h-4 w-4" /><span>{error}</span></div>}
          <div className="editor-grid"><div className="editor"><div className="editor-head"><span>INPUT / {from.toUpperCase()}</span><small>{file && !browserFormats.some((format) => format.id === from) ? `${toBytes(file.size)} · binary preview disabled` : `${lineCount(source)} lines · ${toBytes(new Blob([source]).size)}`}</small></div><div className="editor-body"><pre aria-hidden="true">{Array.from({ length: lineCount(source) }, (_, index) => index + 1).join("\n")}</pre><textarea value={source} onChange={(event) => { setSource(event.target.value); setResult(""); setError(""); }} placeholder={file && !browserFormats.some((format) => format.id === from) ? "Binary input detected. Choose a native route in CLI/Desktop." : "Drop a file or paste content here."} disabled={Boolean(file && !browserFormats.some((format) => format.id === from))} spellCheck={false} /></div></div><div className="editor output"><div className="editor-head"><span>OUTPUT / {targetLabel.toUpperCase()}</span><small>{result ? `${lineCount(result)} lines · ${toBytes(new Blob([result]).size)}` : "Waiting"}</small></div><div className="editor-body"><pre aria-hidden="true">{result ? Array.from({ length: lineCount(result) }, (_, index) => index + 1).join("\n") : ""}</pre><textarea value={result} readOnly placeholder="Converted output will appear here." spellCheck={false} /></div></div></div>
          <footer className="task-footer"><div>{result ? <span className="result-ready"><CheckCircle2 className="h-4 w-4" /> Result ready for {targetLabel}</span> : <span>Choose a route, then transform locally.</span>}</div><div className="action-row"><Button variant="outline" size="sm" onClick={reset} className="utility-button"><RotateCcw className="mr-2 h-3.5 w-3.5" />Reset</Button><Button variant="outline" size="sm" onClick={copyResult} disabled={!result} className="utility-button"><Clipboard className="mr-2 h-3.5 w-3.5" />Copy</Button><Button variant="outline" size="sm" onClick={download} disabled={!result} className="utility-button"><ArrowDownToLine className="mr-2 h-3.5 w-3.5" />Download</Button><Button size="sm" onClick={execute} disabled={busy || !source} className="transform-button">{busy ? <LoaderCircle className="mr-2 h-3.5 w-3.5 animate-spin" /> : null}{busy ? "Working" : "Transform"}</Button></div></footer>
        </section>
      </section>
      <section className="capability-strip"><p><b>Auto detection:</b> magic bytes, container signature, content parsing, then extension hint.</p><p><b>Browser:</b> text and structured data. <b>CLI/Desktop:</b> images, PDF, Office, audio, video and archives after dependency checks.</p><code>henkanki inspect file.bin</code></section>
    </main>
  </div>;
}

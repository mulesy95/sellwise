"use client";

import { useState, useRef, useCallback } from "react";
import {
  Upload,
  Download,
  Sparkles,
  CheckCircle2,
  XCircle,
  ArrowRight,
  Lock,
  FileText,
  X,
} from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";

type Platform = "etsy" | "amazon" | "shopify" | "ebay";
type RowStatus = "pending" | "running" | "done" | "error";

interface CsvRow {
  title: string;
  description: string;
  platform?: string;
}

interface ResultRow extends CsvRow {
  status: RowStatus;
  result?: Record<string, unknown>;
  error?: string;
}

const PLATFORMS: { value: Platform; label: string }[] = [
  { value: "etsy", label: "Etsy" },
  { value: "amazon", label: "Amazon" },
  { value: "shopify", label: "Shopify" },
  { value: "ebay", label: "eBay" },
];

const EXAMPLE_CSV = `title,description\n"Handmade Leather Wallet","Genuine brown leather bifold wallet with card slots"\n"Silver Ring Size 7","Handcrafted 925 sterling silver ring with engraved pattern"`;

function parseCSV(text: string): CsvRow[] {
  const lines = text.trim().split(/\r?\n/);
  if (lines.length < 2) return [];

  const headers = parseLine(lines[0]).map((h) => h.trim().toLowerCase());
  const titleIdx = headers.indexOf("title");
  const descIdx = headers.findIndex((h) => h === "description" || h === "desc" || h === "body");
  const platformIdx = headers.indexOf("platform");

  if (titleIdx === -1) return [];

  return lines.slice(1).reduce<CsvRow[]>((acc, line) => {
    const cols = parseLine(line);
    const title = cols[titleIdx]?.trim();
    if (!title) return acc;
    acc.push({
      title,
      description: descIdx !== -1 ? (cols[descIdx]?.trim() ?? "") : "",
      platform: platformIdx !== -1 ? cols[platformIdx]?.trim() : undefined,
    });
    return acc;
  }, []);
}

function parseLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === "," && !inQuotes) {
      result.push(current);
      current = "";
    } else {
      current += ch;
    }
  }
  result.push(current);
  return result;
}

function str(v: unknown): string {
  if (v == null) return "";
  if (Array.isArray(v)) return v.join(", ");
  return String(v);
}

function resultToCSVRow(row: ResultRow, platform: Platform): string {
  const isEbay = platform === "ebay";
  const isAmazon = platform === "amazon";
  const isEtsy = platform === "etsy";
  const r = row.result ?? {};

  const fields: string[] = [
    csvEscape(row.title),
    csvEscape(row.description),
    csvEscape(str(r.title ?? r.productTitle)),
    csvEscape(str(r.description ?? r.body_html)),
  ];

  if (isEtsy) {
    const tags = r.tags;
    fields.push(csvEscape(Array.isArray(tags) ? tags.join(", ") : str(tags)));
  }
  if (isAmazon) {
    fields.push(csvEscape(str(r.backend_keywords)));
    const bullets = r.bullets;
    if (Array.isArray(bullets)) {
      for (const b of bullets) fields.push(csvEscape(str(b)));
    } else {
      for (let i = 0; i < 5; i++) fields.push("");
    }
  }
  if (!isEbay && !isAmazon) {
    fields.push(csvEscape(str(r.metaTitle)));
    fields.push(csvEscape(str(r.metaDescription)));
  }

  return fields.join(",");
}

function csvEscape(val: string | undefined): string {
  if (val == null) return "";
  const s = String(val).replace(/"/g, '""');
  return `"${s}"`;
}

function buildCSVHeader(platform: Platform): string {
  const base = ["original_title", "original_description", "optimised_title", "optimised_description"];
  if (platform === "etsy") return [...base, "tags"].join(",");
  if (platform === "amazon") return [...base, "backend_keywords", "bullet_1", "bullet_2", "bullet_3", "bullet_4", "bullet_5"].join(",");
  return [...base, "meta_title", "meta_description"].join(",");
}

function downloadCSV(rows: ResultRow[], platform: Platform) {
  const header = buildCSVHeader(platform);
  const body = rows.map((r) => resultToCSVRow(r, platform)).join("\n");
  const blob = new Blob([header + "\n" + body], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `sellwise-bulk-optimised-${platform}-${Date.now()}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

// ─── Main component ───────────────────────────────────────────────────────────

export function BulkClient({ plan }: { plan: string }) {
  const canAccess = plan === "growth" || plan === "studio";
  const [platform, setPlatform] = useState<Platform>("etsy");
  const [rows, setRows] = useState<CsvRow[]>([]);
  const [results, setResults] = useState<ResultRow[]>([]);
  const [running, setRunning] = useState(false);
  const [done, setDone] = useState(false);
  const [fileName, setFileName] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const abortRef = useRef(false);

  const processFile = useCallback((file: File) => {
    if (!file.name.endsWith(".csv")) {
      alert("Please upload a CSV file.");
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const parsed = parseCSV(text);
      setRows(parsed.slice(0, 200));
      setResults([]);
      setDone(false);
      setFileName(file.name);
    };
    reader.readAsText(file);
  }, []);

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) processFile(file);
  }

  function handleFileInput(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) processFile(file);
    e.target.value = "";
  }

  async function runOptimisations() {
    if (rows.length === 0) return;
    setRunning(true);
    setDone(false);
    abortRef.current = false;

    const initial: ResultRow[] = rows.map((r) => ({ ...r, status: "pending" }));
    setResults(initial);

    const updated = [...initial];

    for (let i = 0; i < rows.length; i++) {
      if (abortRef.current) break;

      const row = rows[i];
      const rowPlatform = (row.platform as Platform) || platform;

      updated[i] = { ...updated[i], status: "running" };
      setResults([...updated]);

      try {
        const res = await fetch("/api/optimise", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            platform: rowPlatform,
            productName: row.title,
            existingContent: row.description?.slice(0, 800) || undefined,
          }),
        });

        if (res.status === 429) {
          await new Promise((r) => setTimeout(r, 3000));
          i--;
          updated[i] = { ...updated[i], status: "pending" };
          setResults([...updated]);
          continue;
        }

        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "Failed");

        updated[i] = { ...updated[i], status: "done", result: data };
      } catch (err) {
        updated[i] = {
          ...updated[i],
          status: "error",
          error: err instanceof Error ? err.message : "Failed",
        };
      }

      setResults([...updated]);
      await new Promise((r) => setTimeout(r, 400));
    }

    setRunning(false);
    setDone(true);
  }

  function handleStop() {
    abortRef.current = true;
  }

  function clearFile() {
    setRows([]);
    setResults([]);
    setDone(false);
    setFileName("");
  }

  const doneCount = results.filter((r) => r.status === "done").length;
  const errorCount = results.filter((r) => r.status === "error").length;
  const total = rows.length;
  const progress = total > 0 ? Math.round(((doneCount + errorCount) / total) * 100) : 0;
  const hasResults = results.some((r) => r.status === "done");

  if (!canAccess) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight">
            <Sparkles className="size-5 text-primary" />
            Bulk Optimiser
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Upload a CSV of listings and optimise them all at once.
          </p>
        </div>
        <div className="max-w-lg rounded-xl border border-border/50 bg-card p-8 text-center space-y-5">
          <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-primary/10">
            <Lock className="size-5 text-primary" />
          </div>
          <div>
            <h2 className="font-semibold text-lg">Growth plan required</h2>
            <p className="mt-1.5 text-sm text-muted-foreground">
              Bulk optimisation is available on Growth and Studio plans. Upload up to 200 listings
              and download the results as a CSV.
            </p>
          </div>
          <a href="/pricing" className={buttonVariants({ className: "w-full" })}>
            Upgrade to Growth <ArrowRight className="size-3.5" />
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight">
          <Sparkles className="size-5 text-primary" />
          Bulk Optimiser
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Upload a CSV, choose a platform, and optimise up to 200 listings at once.
        </p>
      </div>

      {/* Platform selector */}
      <div className="flex items-center gap-3">
        <span className="text-sm text-muted-foreground shrink-0">Platform</span>
        <div className="flex rounded-lg border border-border/60 p-1 gap-1">
          {PLATFORMS.map((p) => (
            <button
              key={p.value}
              onClick={() => setPlatform(p.value)}
              disabled={running}
              className={cn(
                "rounded-md px-3 py-1 text-sm font-medium transition-colors",
                platform === p.value
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground disabled:opacity-50"
              )}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Upload zone */}
      {rows.length === 0 ? (
        <div
          onDrop={handleDrop}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onClick={() => fileRef.current?.click()}
          className={cn(
            "flex flex-col items-center justify-center gap-4 rounded-xl border-2 border-dashed px-8 py-14 text-center transition-colors cursor-pointer",
            dragOver
              ? "border-primary bg-primary/5"
              : "border-border/40 hover:border-border/70 hover:bg-muted/20"
          )}
        >
          <input ref={fileRef} type="file" accept=".csv" className="hidden" onChange={handleFileInput} />
          <div className="flex size-12 items-center justify-center rounded-full bg-primary/10">
            <Upload className="size-5 text-primary" />
          </div>
          <div>
            <p className="font-medium">Drop your CSV here, or click to browse</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Required columns: <code className="rounded bg-muted px-1 py-0.5 text-xs">title</code>,{" "}
              <code className="rounded bg-muted px-1 py-0.5 text-xs">description</code>. Max 200 rows.
            </p>
          </div>
          <details className="text-left w-full max-w-md" onClick={(e) => e.stopPropagation()}>
            <summary className="cursor-pointer text-xs text-muted-foreground hover:text-foreground select-none">
              Show example format
            </summary>
            <pre className="mt-2 rounded-md border border-border/40 bg-muted/30 p-3 text-xs overflow-x-auto">
              {EXAMPLE_CSV}
            </pre>
          </details>
        </div>
      ) : (
        <div className="rounded-xl border border-border/50 bg-card">
          {/* File header */}
          <div className="flex items-center justify-between border-b border-border/40 px-4 py-3">
            <div className="flex items-center gap-2 text-sm">
              <FileText className="size-4 text-muted-foreground" />
              <span className="font-medium">{fileName}</span>
              <span className="text-muted-foreground">— {total} rows</span>
            </div>
            {!running && (
              <button
                onClick={clearFile}
                className="rounded-md p-1 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                aria-label="Remove file"
              >
                <X className="size-4" />
              </button>
            )}
          </div>

          {/* Preview / results table */}
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-border/40 bg-muted/20">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground w-8">#</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground">Title</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground">Status</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground">Result</th>
                </tr>
              </thead>
              <tbody>
                {(results.length > 0 ? results : rows.map((r) => ({ ...r, status: "pending" as RowStatus }))).map(
                  (row, i) => {
                    const r = row as ResultRow;
                    const optimisedTitle = str(r.result?.title ?? r.result?.productTitle ?? "");
                    return (
                      <tr key={i} className="border-b border-border/30 last:border-0 hover:bg-muted/10">
                        <td className="px-4 py-2 text-xs text-muted-foreground">{i + 1}</td>
                        <td className="px-4 py-2 max-w-[200px]">
                          <p className="truncate text-xs font-medium">{r.title}</p>
                          {r.description && (
                            <p className="truncate text-[10px] text-muted-foreground mt-0.5">{r.description}</p>
                          )}
                        </td>
                        <td className="px-4 py-2">
                          {r.status === "pending" && (
                            <span className="text-xs text-muted-foreground">Waiting</span>
                          )}
                          {r.status === "running" && (
                            <span className="flex items-center gap-1.5 text-xs text-primary">
                              <Spinner size="sm" />
                              Optimising
                            </span>
                          )}
                          {r.status === "done" && (
                            <span className="flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400">
                              <CheckCircle2 className="size-3.5" />
                              Done
                            </span>
                          )}
                          {r.status === "error" && (
                            <span className="flex items-center gap-1 text-xs text-destructive" title={r.error}>
                              <XCircle className="size-3.5" />
                              Failed
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-2 max-w-[240px]">
                          {optimisedTitle ? (
                            <p className="truncate text-xs">{optimisedTitle}</p>
                          ) : (
                            <span className="text-xs text-muted-foreground/40">—</span>
                          )}
                        </td>
                      </tr>
                    );
                  }
                )}
              </tbody>
            </table>
          </div>

          {/* Progress bar */}
          {running && (
            <div className="border-t border-border/40 px-4 py-3 space-y-2">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>{doneCount + errorCount} of {total} complete</span>
                <span>{progress}%</span>
              </div>
              <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full rounded-full bg-primary transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}

          {done && (
            <div className="border-t border-border/40 px-4 py-3 flex items-center gap-2 text-sm">
              <CheckCircle2 className="size-4 text-emerald-500" />
              <span className="text-emerald-700 dark:text-emerald-400 font-medium">
                {doneCount} optimised{errorCount > 0 ? `, ${errorCount} failed` : ""}
              </span>
            </div>
          )}

          {/* Footer actions */}
          <div className="border-t border-border/40 px-4 py-3 flex items-center gap-2">
            {!running && !done && (
              <Button onClick={() => void runOptimisations()} disabled={rows.length === 0}>
                <Sparkles className="size-3.5" />
                Optimise {total} listings
              </Button>
            )}
            {running && (
              <Button variant="outline" onClick={handleStop}>
                Stop
              </Button>
            )}
            {done && (
              <>
                <Button variant="outline" onClick={clearFile}>
                  Upload new file
                </Button>
                {hasResults && (
                  <Button onClick={() => downloadCSV(results, platform)}>
                    <Download className="size-3.5" />
                    Download results
                  </Button>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

"use client";

import Fuse from "fuse.js";
import { useEffect, useMemo, useState } from "react";
import type { MemoryCategory, MemoryDocument, MemoryManifest } from "@/types/memory";

const labels: Record<MemoryCategory, string> = {
  "daily-notes": "Daily Notes",
  "brain-dumps": "Brain Dumps",
  "conversation-logs": "Conversation Logs",
  "extracted-documents": "Extracted Docs",
};

const categoryColors: Record<MemoryCategory, string> = {
  "daily-notes": "bg-sky-100 text-sky-700",
  "brain-dumps": "bg-violet-100 text-violet-700",
  "conversation-logs": "bg-amber-100 text-amber-700",
  "extracted-documents": "bg-emerald-100 text-emerald-700",
};

export default function SecondBrainDashboard() {
  const [docs, setDocs] = useState<MemoryDocument[]>([]);
  const [manifest, setManifest] = useState<MemoryManifest | null>(null);
  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<MemoryCategory | "all">("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);

      const [manifestRes, docsRes] = await Promise.all([
        fetch("./data/manifest.json"),
        fetch("./data/search-index.json"),
      ]);

      const [manifestJson, docsJson] = await Promise.all([
        manifestRes.json() as Promise<MemoryManifest>,
        docsRes.json() as Promise<MemoryDocument[]>,
      ]);

      setManifest(manifestJson);
      setDocs(docsJson);
      setLoading(false);
    };

    load().catch(() => setLoading(false));
  }, []);

  const filteredDocs = useMemo(() => {
    if (!docs.length) return [];

    const categoryFiltered =
      activeCategory === "all"
        ? docs
        : docs.filter((doc) => doc.category === activeCategory);

    if (!query.trim()) return categoryFiltered;

    const fuse = new Fuse(categoryFiltered, {
      includeScore: true,
      threshold: 0.35,
      ignoreLocation: true,
      keys: ["title", "summary", "content", "source", "tags"],
    });

    return fuse.search(query).map((result) => result.item);
  }, [activeCategory, docs, query]);

  return (
    <main className="min-h-screen bg-[#F7F8FA] px-4 py-5 text-slate-900">
      <div className="mx-auto w-full max-w-[980px] space-y-4">
        <header className="rounded-3xl bg-white p-5 shadow-[0_8px_30px_rgba(15,23,42,0.04)] ring-1 ring-slate-100">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
            OpenClaw Memory OS
          </p>
          <h1 className="mt-1 font-heading text-[26px] font-semibold tracking-tight text-slate-900">
            Second Brain
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Search across daily notes, brain dumps, conversations, and extracted docs.
          </p>
        </header>

        <section className="rounded-3xl bg-white p-4 shadow-[0_8px_30px_rgba(15,23,42,0.04)] ring-1 ring-slate-100">
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search all memories..."
            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-slate-300 focus:ring-4 focus:ring-slate-200/60"
          />

          <div className="mt-3 flex flex-wrap gap-2">
            <Chip
              active={activeCategory === "all"}
              onClick={() => setActiveCategory("all")}
              label="All"
              count={docs.length}
            />
            {(Object.keys(labels) as MemoryCategory[]).map((category) => (
              <Chip
                key={category}
                active={activeCategory === category}
                onClick={() => setActiveCategory(category)}
                label={labels[category]}
                count={manifest?.categories?.[category] ?? 0}
              />
            ))}
          </div>
        </section>

        <section className="grid grid-cols-2 gap-3">
          <Stat label="Total Docs" value={manifest?.totalDocuments ?? docs.length} />
          <Stat label="Viewport Target" value={manifest?.viewportTarget ?? "900-1000px"} />
        </section>

        <section className="pb-8">
          {loading ? <p className="text-sm text-slate-500">Loading memory index...</p> : null}

          {!loading && filteredDocs.length === 0 ? (
            <div className="rounded-2xl bg-white p-4 text-sm text-slate-500 ring-1 ring-slate-200">
              No results found. Try broader keywords.
            </div>
          ) : null}

          <div className="grid grid-cols-1 gap-3 [@media(min-width:900px)]:grid-cols-2">
            {filteredDocs.map((doc) => (
              <article
                key={doc.id}
                className="rounded-2xl bg-white p-4 shadow-[0_6px_20px_rgba(15,23,42,0.03)] ring-1 ring-slate-100"
              >
                <div className="flex items-start justify-between gap-2">
                  <h2 className="font-heading text-base font-semibold text-slate-900">{doc.title}</h2>
                  <span
                    className={`whitespace-nowrap rounded-full px-2 py-1 text-[11px] font-semibold ${
                      categoryColors[doc.category]
                    }`}
                  >
                    {labels[doc.category]}
                  </span>
                </div>

                <p className="mt-1 text-xs text-slate-500">
                  {doc.source}
                  {doc.date ? ` • ${doc.date}` : ""}
                </p>
                <p className="mt-2 text-sm text-slate-700">{snippet(doc, query)}</p>
              </article>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}

function snippet(doc: MemoryDocument, query: string) {
  if (!query.trim()) return doc.summary;

  const index = doc.content.toLowerCase().indexOf(query.toLowerCase());
  if (index === -1) return doc.summary;

  const start = Math.max(0, index - 90);
  const end = Math.min(doc.content.length, index + 210);

  return `${start > 0 ? "…" : ""}${doc.content.slice(start, end).trim()}${
    end < doc.content.length ? "…" : ""
  }`;
}

function Chip({
  active,
  onClick,
  label,
  count,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  count: number;
}) {
  return (
    <button
      onClick={onClick}
      className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${
        active
          ? "bg-slate-900 text-white"
          : "bg-slate-100 text-slate-700 hover:bg-slate-200"
      }`}
    >
      {label} <span className="opacity-80">({count})</span>
    </button>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-2xl bg-white p-3 ring-1 ring-slate-100">
      <p className="text-xs text-slate-500">{label}</p>
      <p className="font-heading text-lg font-semibold text-slate-900">{value}</p>
    </div>
  );
}

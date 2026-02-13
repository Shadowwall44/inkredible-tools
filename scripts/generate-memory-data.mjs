import fs from "node:fs/promises";
import path from "node:path";

const workspaceRoot = path.resolve(process.cwd(), "..");
const outDir = path.join(process.cwd(), "public", "data");

const CATEGORY = {
  DAILY: "daily-notes",
  BRAIN: "brain-dumps",
  CONVO: "conversation-logs",
  EXTRACTED: "extracted-documents",
};

const conversationKeywords = [
  "meeting",
  "action",
  "analysis",
  "batch",
  "remaining",
  "plan",
  "team",
];

const clean = (text) =>
  text
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/`/g, "")
    .replace(/\[(.*?)\]\((.*?)\)/g, "$1")
    .replace(/^#{1,6}\s?/gm, "")
    .replace(/^\s*>\s?/gm, "")
    .replace(/^\s*[-*+]\s+/gm, "")
    .replace(/\r/g, "")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

const redactSensitive = (text) => {
  let value = text;

  value = value.replace(
    /(api[_\s-]?key|token|secret|password|bearer|auth)\s*[:=]\s*([^\s\n]+)/gi,
    "$1: [REDACTED]"
  );

  value = value.replace(
    /\b(BSAI[A-Za-z0-9_-]{8,}|sk-[A-Za-z0-9_-]{8,}|ghp_[A-Za-z0-9_]{20,}|AIza[0-9A-Za-z\-_]{16,})\b/g,
    "[REDACTED]"
  );

  value = value.replace(/\b[a-zA-Z0-9][a-zA-Z0-9_-]{30,}\b/g, "[REDACTED]");

  return value;
};

const readText = async (filePath) => {
  const ext = path.extname(filePath).toLowerCase();
  const raw = await fs.readFile(filePath, "utf8");

  if (ext === ".json") {
    try {
      const parsed = JSON.parse(raw);
      return JSON.stringify(parsed, null, 2);
    } catch {
      return raw;
    }
  }

  return raw;
};

const titleFromContent = (content, fallback) => {
  const heading = content.match(/^#\s+(.+)$/m)?.[1]?.trim();
  if (heading) return heading;
  return fallback;
};

const inferDate = (name, content) => {
  const fromName = name.match(/\d{4}-\d{2}-\d{2}/)?.[0];
  if (fromName) return fromName;
  const fromContent = content.match(/\d{4}-\d{2}-\d{2}/)?.[0];
  return fromContent ?? null;
};

const summarize = (content, max = 220) => {
  const compact = content.replace(/\n/g, " ").replace(/\s+/g, " ").trim();
  return compact.length > max ? `${compact.slice(0, max).trim()}…` : compact;
};

const createDoc = async ({ filePath, category, tags = [] }) => {
  const raw = await readText(filePath);
  const cleaned = clean(redactSensitive(raw));
  const safeText = redactSensitive(cleaned);
  const fileName = path.basename(filePath);
  const title = titleFromContent(safeText, fileName);
  const content = safeText.slice(0, 9000);

  return {
    id: `${category}-${fileName.replace(/[^a-zA-Z0-9]+/g, "-").toLowerCase()}`,
    category,
    title,
    source: path.relative(workspaceRoot, filePath),
    date: inferDate(fileName, cleaned),
    tags,
    summary: summarize(content),
    content,
  };
};

const listFiles = async (dir) => {
  try {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    return entries
      .filter((entry) => entry.isFile())
      .map((entry) => path.join(dir, entry.name));
  } catch {
    return [];
  }
};

const memoryDir = path.join(workspaceRoot, "memory");
const transcriptsDir = path.join(workspaceRoot, "transcripts");
const logsDir = path.join(workspaceRoot, "logs");
const extractionDir = path.join(workspaceRoot, "extraction-results");

const memoryFiles = await listFiles(memoryDir);
const transcriptFiles = await listFiles(transcriptsDir);
const logFiles = await listFiles(logsDir);
const extractedFiles = await listFiles(extractionDir);

const dailyFiles = memoryFiles.filter((file) => /\d{4}-\d{2}-\d{2}\.md$/i.test(file));
const memoryBrainDumpFiles = memoryFiles.filter((file) => /brain-dump/i.test(path.basename(file)));

const transcriptBrainFiles = transcriptFiles.filter((file) => {
  const name = path.basename(file).toLowerCase();
  if (conversationKeywords.some((keyword) => name.includes(keyword))) return false;
  return /\.md$/.test(name);
});

const conversationFiles = [
  ...transcriptFiles.filter((file) => {
    const name = path.basename(file).toLowerCase();
    return conversationKeywords.some((keyword) => name.includes(keyword));
  }),
  ...logFiles,
];

const extractedDocFiles = extractedFiles.filter((file) =>
  [".json", ".csv", ".md", ".txt"].includes(path.extname(file).toLowerCase())
);

const [dailyNotes, brainDumps, conversationLogs, extractedDocuments] = await Promise.all([
  Promise.all(dailyFiles.map((filePath) => createDoc({ filePath, category: CATEGORY.DAILY, tags: ["daily"] }))),
  Promise.all(
    [...memoryBrainDumpFiles, ...transcriptBrainFiles].map((filePath) =>
      createDoc({ filePath, category: CATEGORY.BRAIN, tags: ["brain-dump", "transcript"] })
    )
  ),
  Promise.all(
    conversationFiles.map((filePath) =>
      createDoc({ filePath, category: CATEGORY.CONVO, tags: ["conversation", "log"] })
    )
  ),
  Promise.all(
    extractedDocFiles.map((filePath) =>
      createDoc({ filePath, category: CATEGORY.EXTRACTED, tags: ["extracted", "documents"] })
    )
  ),
]);

const byDateDesc = (a, b) => {
  if (!a.date && !b.date) return a.title.localeCompare(b.title);
  if (!a.date) return 1;
  if (!b.date) return -1;
  return b.date.localeCompare(a.date);
};

const orderedData = {
  dailyNotes: dailyNotes.sort(byDateDesc),
  brainDumps: brainDumps.sort(byDateDesc),
  conversationLogs: conversationLogs.sort(byDateDesc),
  extractedDocuments: extractedDocuments.sort(byDateDesc),
};

const searchIndex = [
  ...orderedData.dailyNotes,
  ...orderedData.brainDumps,
  ...orderedData.conversationLogs,
  ...orderedData.extractedDocuments,
];

await fs.mkdir(outDir, { recursive: true });

await Promise.all([
  fs.writeFile(path.join(outDir, "daily-notes.json"), JSON.stringify(orderedData.dailyNotes, null, 2)),
  fs.writeFile(path.join(outDir, "brain-dumps.json"), JSON.stringify(orderedData.brainDumps, null, 2)),
  fs.writeFile(path.join(outDir, "conversation-logs.json"), JSON.stringify(orderedData.conversationLogs, null, 2)),
  fs.writeFile(path.join(outDir, "extracted-documents.json"), JSON.stringify(orderedData.extractedDocuments, null, 2)),
  fs.writeFile(path.join(outDir, "search-index.json"), JSON.stringify(searchIndex, null, 2)),
  fs.writeFile(
    path.join(outDir, "manifest.json"),
    JSON.stringify(
      {
        generatedAt: new Date().toISOString(),
        totalDocuments: searchIndex.length,
        categories: {
          [CATEGORY.DAILY]: orderedData.dailyNotes.length,
          [CATEGORY.BRAIN]: orderedData.brainDumps.length,
          [CATEGORY.CONVO]: orderedData.conversationLogs.length,
          [CATEGORY.EXTRACTED]: orderedData.extractedDocuments.length,
        },
        viewportTarget: "900-1000px",
      },
      null,
      2
    )
  ),
]);

console.log(`Generated ${searchIndex.length} searchable memory documents in ${outDir}`);

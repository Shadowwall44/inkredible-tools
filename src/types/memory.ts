export type MemoryCategory =
  | "daily-notes"
  | "brain-dumps"
  | "conversation-logs"
  | "extracted-documents";

export type MemoryDocument = {
  id: string;
  category: MemoryCategory;
  title: string;
  source: string;
  date: string | null;
  tags: string[];
  summary: string;
  content: string;
};

export type MemoryManifest = {
  generatedAt: string;
  totalDocuments: number;
  categories: Record<MemoryCategory, number>;
  viewportTarget: string;
};

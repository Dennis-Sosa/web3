export type SourceDoc = {
  id: string;
  title: string;
  url: string;
  tags?: string[];
  content: string;
};

export type RagChunk = {
  chunkId: string;
  sourceId: string;
  chunkIndex: number;
  title: string;
  url: string;
  tags: string[];
  content: string;
};

export type RetrievedChunk = RagChunk & {
  score: number;
};


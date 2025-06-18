// src/types/index.ts - Type definitions for Stage 5

export interface UserProfileType {
  id: string;
  email: string;
  totalDocuments?: number | null;
  totalEmbeddings?: number | null;
  storageUsed?: number | null;
  lastActiveAt?: string | null;
  owner?: string | null;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface DocumentType {
  id: string;
  name: string;
  key: string;
  size?: number | null;
  type?: string | null;
  uploadedAt?: string | null;
  status?: string | null;
  processingStatus?: string | null;
  totalChunks?: number | null;
  embeddingsGenerated?: boolean | null;
  owner?: string | null;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface DocumentChunkType {
  id: string;
  documentId: string;
  chunkIndex: number;
  content: string;
  wordCount: number;
  startPosition: number;
  endPosition: number;
  metadata: string | number | boolean | Record<string, unknown> | unknown[] | null;
  owner: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface EmbeddingType {
  id: string;
  chunkId: string;
  documentId: string;
  chunkIndex: number;
  embedding: Record<string, unknown>;
  metadata: Record<string, unknown>;
  model?: string | null;
  dimension?: number | null;
  createdAt?: string | null;
  owner: string | null;
}

export interface SearchResult {
  chunkId: string;
  documentId: string;
  content: string;
  similarity: number;
  chunkIndex: number;
}

export interface UploadEvent {
  key?: string;
  result?: {
    key?: string;
    size?: number;
  };
  size?: number;
}

export interface ProcessingStats {
  pending: number;
  processing: number;
  completed: number;
  failed: number;
}

export type TabType = 'chat' | 'upload' | 'documents' | 'chunks' | 'embeddings';
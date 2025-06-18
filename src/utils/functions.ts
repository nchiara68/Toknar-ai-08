// src/utils/functions.ts - Utility functions for Stage 5

import { DocumentType, UserProfileType, DocumentChunkType, EmbeddingType, ProcessingStats, SearchResult } from '../types';

// Message type for AI conversation
interface Message {
  role: 'user' | 'assistant';
  content: Array<{ text?: string; toolUse?: { name?: string } }>;
}

export const getStatusColor = (status: string): string => {
  switch (status) {
    case 'completed': return '#28A745';
    case 'processing': return '#FFC107';
    case 'failed': return '#DC3545';
    default: return '#6C757D';
  }
};

export const getStatusIcon = (status: string): string => {
  switch (status) {
    case 'completed': return '✅';
    case 'processing': return '⚙️';
    case 'failed': return '❌';
    default: return '⏳';
  }
};

export const getEmbeddingStatusColor = (hasEmbeddings: boolean): string => {
  return hasEmbeddings ? '#28A745' : '#FFC107';
};

export const getEmbeddingStatusIcon = (hasEmbeddings: boolean): string => {
  return hasEmbeddings ? '🔢' : '⏳';
};

export const calculateProcessingStats = (documents: DocumentType[]): ProcessingStats => {
  return {
    pending: documents.filter(d => d.processingStatus === 'pending').length,
    processing: documents.filter(d => d.processingStatus === 'processing').length,
    completed: documents.filter(d => d.processingStatus === 'completed').length,
    failed: documents.filter(d => d.processingStatus === 'failed').length
  };
};

export const exportAppData = (data: {
  profile: UserProfileType | null;
  documents: DocumentType[];
  chunks: DocumentChunkType[];
  embeddings: EmbeddingType[];
  messages: Message[];
  processingStats: ProcessingStats;
  totalChunksCount: number;
  searchResults?: SearchResult[];
}) => {
  const exportData = {
    ...data,
    exportedAt: new Date().toISOString(),
    stage: 'Stage 5: Complete + Embeddings',
    systemStatus: {
      documentsCount: data.documents.length,
      chunksCount: data.totalChunksCount,
      embeddingsCount: data.embeddings.length,
      processingPipeline: data.processingStats,
      embeddingCoverage: data.totalChunksCount > 0 ? 
        (data.embeddings.length / data.totalChunksCount * 100).toFixed(1) + '%' : '0%'
    }
  };
  
  const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `rag-chat-stage5-complete-${new Date().toISOString().split('T')[0]}.json`;
  a.click();
  URL.revokeObjectURL(url);
  
  return 'Data exported successfully!';
};

export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
};

export const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString();
};

export const formatDateTime = (dateString: string): string => {
  return new Date(dateString).toLocaleString();
};
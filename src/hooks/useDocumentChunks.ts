// src/hooks/useDocumentChunks.ts - Chunk operations

import { useState, useCallback } from 'react';
import { generateClient } from 'aws-amplify/api';
import type { Schema } from '../../amplify/data/resource';
import { DocumentType, DocumentChunkType } from '../types';

const client = generateClient<Schema>();

export const useDocumentChunks = () => {
  const [selectedDocument, setSelectedDocument] = useState<DocumentType | null>(null);
  const [documentChunks, setDocumentChunks] = useState<DocumentChunkType[]>([]);
  const [isLoadingChunks, setIsLoadingChunks] = useState(false);

  // Load document chunks for a specific document
  const loadDocumentChunks = useCallback(async (documentId: string) => {
    setIsLoadingChunks(true);
    try {
      const { data: chunks } = await client.models.DocumentChunk.list({
        filter: { documentId: { eq: documentId } }
      });
      const sortedChunks = (chunks as DocumentChunkType[]).sort((a, b) => a.chunkIndex - b.chunkIndex);
      setDocumentChunks(sortedChunks);
    } catch (error) {
      console.error('Error loading document chunks:', error);
      setDocumentChunks([]);
      console.warn('DocumentChunk model may not be deployed yet');
    } finally {
      setIsLoadingChunks(false);
    }
  }, []);

  // Clear selected document and chunks
  const clearSelection = useCallback(() => {
    setSelectedDocument(null);
    setDocumentChunks([]);
  }, []);

  // Update selected document
  const selectDocument = useCallback((document: DocumentType | null) => {
    setSelectedDocument(document);
    if (!document) {
      setDocumentChunks([]);
    }
  }, []);

  return {
    selectedDocument,
    documentChunks,
    isLoadingChunks,
    setSelectedDocument: selectDocument,
    loadDocumentChunks,
    clearSelection
  };
};
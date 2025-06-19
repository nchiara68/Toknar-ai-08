// src/hooks/useDocuments.ts - Document loading & management
import { useState, useCallback, useEffect } from 'react';
import { generateClient } from 'aws-amplify/api';
import type { Schema } from '../../amplify/data/resource';
import { DocumentType, ProcessingStats } from '../types';
import { calculateProcessingStats } from '../utils/functions';

const client = generateClient<Schema>();

export const useDocuments = (username: string, refreshKey: number) => {
  const [uploadedFiles, setUploadedFiles] = useState<DocumentType[]>([]);
  const [totalChunksCount, setTotalChunksCount] = useState(0);
  const [processingStats, setProcessingStats] = useState<ProcessingStats>({
    pending: 0,
    processing: 0,
    completed: 0,
    failed: 0
  });

  // Load documents and related data
  const loadDocuments = useCallback(async () => {
    try {
      const { data: documents } = await client.models.Document.list({
        filter: { owner: { eq: username } }
      });
      const docs = documents as DocumentType[];
      setUploadedFiles(docs);
      setProcessingStats(calculateProcessingStats(docs));

      // Load chunks count
      try {
        const { data: chunks } = await client.models.DocumentChunk.list({
          filter: { owner: { eq: username } }
        });
        setTotalChunksCount(chunks.length);
      } catch (error) {
        console.log('DocumentChunk model not yet available');
        setTotalChunksCount(0);
      }
    } catch (error) {
      console.error('Error loading documents:', error);
    }
  }, [username]);

  // Refresh effect when refreshKey changes
  useEffect(() => {
    if (refreshKey >= 0) {
      loadDocuments();
    }
  }, [refreshKey, loadDocuments]);

  // Auto-refresh effect for processing status
  useEffect(() => {
    const interval = setInterval(loadDocuments, 5000);
    return () => clearInterval(interval);
  }, [loadDocuments]);

  return {
    uploadedFiles,
    totalChunksCount,
    processingStats,
    loadDocuments
  };
};

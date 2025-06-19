// src/hooks/useEmbeddings.ts - Embedding generation & management

import { useState, useCallback, useEffect } from 'react';
import { generateClient } from 'aws-amplify/api';
import type { Schema } from '../../amplify/data/resource';
import { EmbeddingType, DocumentType } from '../types';

const client = generateClient<Schema>();

export const useEmbeddings = (
  username: string, 
  refreshKey: number,
  uploadedFiles: DocumentType[],
  onProgress: (progress: string) => void,
  onRefresh: () => void
) => {
  const [embeddings, setEmbeddings] = useState<EmbeddingType[]>([]);
  const [isGeneratingEmbeddings, setIsGeneratingEmbeddings] = useState(false);

  // Load embeddings
  const loadEmbeddings = useCallback(async () => {
    try {
      const { data: embeddingData } = await client.models.Embedding.list({
        filter: { owner: { eq: username } }
      });
      setEmbeddings(embeddingData as EmbeddingType[]);
    } catch (error) {
      console.log('Embedding model not yet available');
      setEmbeddings([]);
    }
  }, [username]);

  // Generate embeddings (simulated for Stage 5)
  const generateEmbeddings = useCallback(async () => {
    setIsGeneratingEmbeddings(true);
    onProgress('🔢 Starting embeddings generation...');
    
    try {
      onProgress('🔢 Processing document chunks...');
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      onProgress('🔢 Generating vector embeddings with Amazon Titan...');
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      onProgress('🔢 Storing embeddings in vector database...');
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      onProgress('🔢 Building FAISS vector index...');
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Update documents to mark embeddings as generated
      for (const doc of uploadedFiles.filter(d => d.processingStatus === 'completed')) {
        try {
          await client.models.Document.update({
            id: doc.id,
            embeddingsGenerated: true
          });
        } catch (error) {
          console.error('Error updating document embedding status:', error);
        }
      }
      
      onProgress('✅ Embeddings generation completed!');
      onRefresh();
      
      setTimeout(() => onProgress(''), 3000);
      
    } catch (error) {
      console.error('Error generating embeddings:', error);
      onProgress('❌ Error generating embeddings');
      setTimeout(() => onProgress(''), 5000);
    } finally {
      setIsGeneratingEmbeddings(false);
    }
  }, [uploadedFiles, onProgress, onRefresh]);

  // Load embeddings when refreshKey changes
  useEffect(() => {
    if (refreshKey >= 0) {
      loadEmbeddings();
    }
  }, [refreshKey, loadEmbeddings]);

  return {
    embeddings,
    embeddingsCount: embeddings.length,
    isGeneratingEmbeddings,
    generateEmbeddings,
    loadEmbeddings
  };
};
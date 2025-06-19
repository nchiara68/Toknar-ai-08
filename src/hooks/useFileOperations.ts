// src/hooks/useFileOperations.ts - S3 file operations

import { useState, useCallback } from 'react';
import { remove } from 'aws-amplify/storage';
import { generateClient } from 'aws-amplify/api';
import type { Schema } from '../../amplify/data/resource';
import { DocumentType } from '../types';

const client = generateClient<Schema>();

export const useFileOperations = () => {
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // S3 file deletion
  const deleteS3File = useCallback(async (key: string): Promise<boolean> => {
    setIsDeleting(true);
    setDeleteError(null);
    
    try {
      await remove({ key });
      console.log(`✅ Deleted file from S3: ${key}`);
      return true;
    } catch (err) {
      console.error('❌ Error deleting file from S3:', err);
      setDeleteError((err as Error).message);
      return false;
    } finally {
      setIsDeleting(false);
    }
  }, []);

  // Complete file deletion (S3 + DynamoDB)
  const deleteFileCompletely = useCallback(async (
    document: DocumentType,
    onProgress?: (step: string) => void
  ): Promise<boolean> => {
    if (!confirm(`Delete "${document.name}" and all its chunks?\n\nThis action cannot be undone.`)) {
      return false;
    }
    
    try {
      // Step 1: Try to delete the actual file from S3
      onProgress?.(`🗑️ Deleting file from S3: ${document.key}`);
      console.log(`🗑️ Attempting to delete file from S3: ${document.key}`);
      
      try {
        await remove({ key: document.key });
        console.log(`✅ Successfully deleted file from S3: ${document.name}`);
      } catch (s3Error) {
        console.error('Error deleting file from S3:', s3Error);
        console.warn(`⚠️ Could not delete file from S3: ${document.name}. File may not exist or access denied. Continuing with database cleanup...`);
      }

      // Step 2: Delete all chunks from DynamoDB
      onProgress?.('🗑️ Deleting document chunks...');
      try {
        const { data: chunks } = await client.models.DocumentChunk.list({
          filter: { documentId: { eq: document.id } }
        });
        
        for (const chunk of chunks) {
          await client.models.DocumentChunk.delete({ id: chunk.id });
        }
        console.log(`🗑️ Deleted ${chunks.length} chunks for document ${document.name}`);
      } catch (chunkError) {
        console.log('No chunks to delete or DocumentChunk model not available:', chunkError);
      }

      // Step 3: Delete all embeddings from DynamoDB
      onProgress?.('🗑️ Deleting embeddings...');
      try {
        const { data: embeddingData } = await client.models.Embedding.list({
          filter: { documentId: { eq: document.id } }
        });
        
        for (const embedding of embeddingData) {
          await client.models.Embedding.delete({ id: embedding.id });
        }
        console.log(`🗑️ Deleted ${embeddingData.length} embeddings for document ${document.name}`);
      } catch (embeddingError) {
        console.log('No embeddings to delete or Embedding model not available:', embeddingError);
      }
      
      // Step 4: Delete the document record from DynamoDB
      onProgress?.('🗑️ Deleting document record...');
      await client.models.Document.delete({ id: document.id });
      console.log(`🗑️ Deleted document record from database: ${document.name}`);
      
      console.log(`✅ Document deletion completed: "${document.name}" removed from frontend and database`);
      return true;
      
    } catch (error) {
      console.error('Error during deletion process:', error);
      console.error('❌ Error deleting document. Please check console for details.');
      return false;
    }
  }, []);

  return {
    // State
    isDeleting,
    deleteError,
    
    // Actions
    deleteS3File,
    deleteFileCompletely
  };
};
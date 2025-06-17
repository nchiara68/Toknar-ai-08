import { defineFunction } from '@aws-amplify/backend';

// 🔢 STAGE 5: Embeddings Generator Lambda
export const embeddingsProcessor = defineFunction({
  entry: './handler.ts',
  timeoutSeconds: 300, // 5 minutes
  memoryMB: 2048, // More memory for FAISS operations
  resourceGroupName: 'ai',
  environment: {
    // These will be automatically populated by Amplify
    DOCUMENT_CHUNK_TABLE: '', // Will be set by backend configuration
    EMBEDDINGS_TABLE: '', // Will be set by backend configuration
  }
});

console.log('🔢 Stage 5: Embeddings processor function created');
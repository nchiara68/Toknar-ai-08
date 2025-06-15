import { defineFunction, NodeVersion } from '@aws-amplify/backend-function';

// 📄 STAGE 4: Document Processor Lambda with S3 Trigger Configuration
export const documentProcessor = defineFunction({
  entry: './handler.ts',
  runtime: NodeVersion.NODEJS_20, // ✅ Use enum, not string
  timeoutSeconds: 300, // 5 minutes
  memoryMB: 1024,
  resourceGroupName: 'storage',
  environment: {
    // These will be automatically populated by Amplify when tables are created
    DOCUMENT_TABLE: '', // Will be set by backend configuration
    DOCUMENT_CHUNK_TABLE: '', // Will be set by backend configuration
  }
});

console.log('📄 Stage 4: Document processor function with environment configuration created');
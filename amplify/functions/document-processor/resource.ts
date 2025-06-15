import { defineFunction } from '@aws-amplify/backend';

// 📄 STAGE 4: Document Processor Lambda Function - FIXED CIRCULAR DEPENDENCY
export const documentProcessor = defineFunction({
  entry: './handler.ts',
  timeoutSeconds: 300, // 5 minutes for processing large documents
  memoryMB: 1024,
  // 🔑 CRITICAL: Assign to storage stack since function is triggered by S3
  resourceGroupName: 'storage'
});

console.log('📄 Stage 4: Document processor function assigned to storage stack');

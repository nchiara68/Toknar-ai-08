import { defineFunction } from '@aws-amplify/backend';

// 📄 STAGE 4: Document Processor Lambda Function - FIXED FOR AMPLIFY GEN 2
export const documentProcessor = defineFunction({
  entry: './handler.ts',
  timeoutSeconds: 300, // 5 minutes for processing large documents
  memoryMB: 1024,
  resourceGroupName: 'storage', // Keep it in storage stack
  // 🔧 CRITICAL: Mark AWS SDK as external - they're provided by Lambda runtime
  environment: {
    NODE_OPTIONS: '--enable-source-maps'
  }
});

console.log('📄 Stage 4: Document processor function configured for Amplify Gen 2');
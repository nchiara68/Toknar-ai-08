import { defineFunction } from '@aws-amplify/backend';

export const documentProcessor = defineFunction({
  entry: './handler.ts',
  timeoutSeconds: 300,
  memoryMB: 1024,
  resourceGroupName: 'storage'
});

console.log('📄 Stage 4: Document processor function assigned to storage stack');
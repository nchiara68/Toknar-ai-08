import { defineBackend } from '@aws-amplify/backend';
import { auth } from './auth/resource';
import { data } from './data/resource';
import { storage } from './storage/resource';
import { documentProcessor } from './functions/document-processor/resource';

// 🏗️ STAGE 4: Complete Backend with Lambda S3 Integration
export const backend = defineBackend({
  auth,
  data,
  storage,
  documentProcessor  // ← NEW: Adding the document processor function
});

// 🗄️ STAGE 4: Grant Lambda access to DynamoDB tables - FIXED: Individual environment variables
backend.documentProcessor.addEnvironment(
  'DOCUMENT_TABLE', 
  backend.data.resources.tables['Document'].tableName
);

backend.documentProcessor.addEnvironment(
  'DOCUMENT_CHUNK_TABLE', 
  backend.data.resources.tables['DocumentChunk'].tableName
);

// Grant Lambda read/write permissions to the tables
backend.data.resources.tables['Document'].grantReadWriteData(
  backend.documentProcessor.resources.lambda
);

backend.data.resources.tables['DocumentChunk'].grantReadWriteData(
  backend.documentProcessor.resources.lambda
);

// 📁 STAGE 4: Grant Lambda access to S3 bucket
backend.storage.resources.bucket.grantRead(
  backend.documentProcessor.resources.lambda
);

console.log('🏗️ Stage 4: Complete backend with S3→Lambda→DynamoDB pipeline configured');
console.log('📝 Note: S3 trigger will be added manually after deployment');

// 🎯 STAGE 4: Export backend for use in other parts of the application
export const { documentProcessor: lambdaFunction } = backend;
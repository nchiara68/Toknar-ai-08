import { defineBackend } from '@aws-amplify/backend';
import { auth } from './auth/resource';
import { data } from './data/resource';
import { storage } from './storage/resource';
import { documentProcessor } from './functions/document-processor/resource';
import { LambdaDestination } from 'aws-cdk-lib/aws-s3-notifications';

// 🏗️ STAGE 4: Complete Backend with Lambda S3 Integration
export const backend = defineBackend({
  auth,
  data,
  storage,
  documentProcessor
});

// 🗄️ STAGE 4: Grant Lambda access to DynamoDB tables
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

// 🔗 STAGE 4: Add S3 Event Trigger
// This creates the S3 trigger that will invoke Lambda when files are uploaded
backend.storage.resources.bucket.addObjectCreatedNotification(
  new LambdaDestination(backend.documentProcessor.resources.lambda),
  { prefix: 'documents/' }
);

console.log('🏗️ Stage 4: Complete backend with S3→Lambda→DynamoDB pipeline configured');
console.log('🔗 Stage 4: S3 trigger configured for documents/ prefix');
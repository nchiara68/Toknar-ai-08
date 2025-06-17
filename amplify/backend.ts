import { defineBackend } from '@aws-amplify/backend';
import { auth } from './auth/resource';
import { data } from './data/resource';
import { storage } from './storage/resource';
import { documentProcessor } from './functions/document-processor/resource';
import { embeddingsProcessor } from './functions/embeddings-processor/resource';
import { LambdaDestination } from 'aws-cdk-lib/aws-s3-notifications';
import { PolicyStatement, Effect } from 'aws-cdk-lib/aws-iam';

// 🏗️ STAGE 5: Complete Backend with Embeddings and Vector Search
export const backend = defineBackend({
  auth,
  data,
  storage,
  documentProcessor,
  embeddingsProcessor
});

// 🗄️ STAGE 4: Grant Document Processor Lambda access to DynamoDB tables
backend.documentProcessor.addEnvironment(
  'DOCUMENT_TABLE', 
  backend.data.resources.tables['Document'].tableName
);

backend.documentProcessor.addEnvironment(
  'DOCUMENT_CHUNK_TABLE', 
  backend.data.resources.tables['DocumentChunk'].tableName
);

// Grant Document Processor read/write permissions to the tables
backend.data.resources.tables['Document'].grantReadWriteData(
  backend.documentProcessor.resources.lambda
);

backend.data.resources.tables['DocumentChunk'].grantReadWriteData(
  backend.documentProcessor.resources.lambda
);

// 🔢 STAGE 5: Grant Embeddings Processor Lambda access to DynamoDB tables
backend.embeddingsProcessor.addEnvironment(
  'DOCUMENT_CHUNK_TABLE', 
  backend.data.resources.tables['DocumentChunk'].tableName
);

backend.embeddingsProcessor.addEnvironment(
  'EMBEDDINGS_TABLE', 
  backend.data.resources.tables['Embedding'].tableName
);

// Grant Embeddings Processor read/write permissions to the tables
backend.data.resources.tables['DocumentChunk'].grantReadData(
  backend.embeddingsProcessor.resources.lambda
);

backend.data.resources.tables['Embedding'].grantReadWriteData(
  backend.embeddingsProcessor.resources.lambda
);

// 🤖 STAGE 5: Grant Embeddings Processor access to Amazon Bedrock
// Add IAM policy for Bedrock access
backend.embeddingsProcessor.resources.lambda.addToRolePolicy(
  new PolicyStatement({
    effect: Effect.ALLOW,
    actions: [
      'bedrock:InvokeModel'
    ],
    resources: [
      'arn:aws:bedrock:*::foundation-model/amazon.titan-embed-text-v1'
    ]
  })
);

// 📁 STAGE 4: Grant Document Processor Lambda access to S3 bucket
backend.storage.resources.bucket.grantRead(
  backend.documentProcessor.resources.lambda
);

// 🔗 STAGE 4: Add S3 Event Trigger for Document Processor
// This creates the S3 trigger that will invoke Lambda when files are uploaded
backend.storage.resources.bucket.addObjectCreatedNotification(
  new LambdaDestination(backend.documentProcessor.resources.lambda),
  { prefix: 'documents/' }
);

console.log('🏗️ Stage 5: Complete backend with S3→Document Processing→Embeddings→Vector Search pipeline configured');
console.log('🔗 Stage 5: S3 trigger configured for documents/ prefix');
console.log('🔢 Stage 5: Embeddings processor with Bedrock access configured');
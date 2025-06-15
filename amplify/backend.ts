import { defineBackend } from '@aws-amplify/backend';
import { auth } from './auth/resource';
import { data } from './data/resource';
import { storage } from './storage/resource';
import { documentProcessor } from './functions/document-processor/resource';
import { EventType } from 'aws-cdk-lib/aws-s3';
import { LambdaDestination } from 'aws-cdk-lib/aws-s3-notifications';
import { PolicyStatement, Effect } from 'aws-cdk-lib/aws-iam';

// 🏗️ STAGE 4: Gen 2 Backend Configuration
export const backend = defineBackend({
  auth,
  data,
  storage,
  documentProcessor
});

// 🔑 Add DynamoDB permissions to Lambda function
backend.documentProcessor.resources.lambda.addToRolePolicy(
  new PolicyStatement({
    effect: Effect.ALLOW,
    actions: [
      'dynamodb:PutItem',
      'dynamodb:GetItem',
      'dynamodb:UpdateItem',
      'dynamodb:DeleteItem',
      'dynamodb:Query',
      'dynamodb:Scan'
    ],
    resources: [
      `${backend.data.resources.tables['Document'].tableArn}`,
      `${backend.data.resources.tables['DocumentChunk'].tableArn}`,
      `${backend.data.resources.tables['UserProfile'].tableArn}`
    ]
  })
);

// 🔑 CRITICAL: Add S3 read permissions explicitly
// Even though function is in storage stack, it still needs explicit read permissions
backend.documentProcessor.resources.lambda.addToRolePolicy(
  new PolicyStatement({
    effect: Effect.ALLOW,
    actions: [
      's3:GetObject',           // Read files from S3
      's3:GetObjectVersion'     // Read file versions
    ],
    resources: [
      `${backend.storage.resources.bucket.bucketArn}/*`  // All objects in bucket
    ]
  })
);

// 📝 Add environment variables for table names
backend.documentProcessor.addEnvironment('DOCUMENT_TABLE', backend.data.resources.tables['Document'].tableName);
backend.documentProcessor.addEnvironment('DOCUMENT_CHUNK_TABLE', backend.data.resources.tables['DocumentChunk'].tableName);
backend.documentProcessor.addEnvironment('USER_PROFILE_TABLE', backend.data.resources.tables['UserProfile'].tableName);

// 🔗 Add S3 trigger
backend.storage.resources.bucket.addEventNotification(
  EventType.OBJECT_CREATED,
  new LambdaDestination(backend.documentProcessor.resources.lambda),
  { 
    prefix: 'documents/'
  }
);

console.log('🏗️ Stage 4: Backend configured with S3 read permissions');
console.log('📊 Document table:', backend.data.resources.tables['Document'].tableName);
console.log('🧩 Chunk table:', backend.data.resources.tables['DocumentChunk'].tableName);
console.log('🔧 Function stack: Storage');
console.log('📁 Storage bucket:', backend.storage.resources.bucket.bucketName);
console.log('🔑 S3 permissions: s3:GetObject, s3:GetObjectVersion');
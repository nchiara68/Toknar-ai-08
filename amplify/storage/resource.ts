import { defineStorage } from '@aws-amplify/backend';

// 📁 STAGE 3: S3 Storage Configuration - Simple approach
export const storage = defineStorage({
  name: 'ragChatDocuments',
  access: (allow) => ({
    // 👤 Allow authenticated users to upload anywhere in documents folder
    'documents/*': [
      allow.authenticated.to(['read', 'write', 'delete'])
    ]
  })
});

console.log('📁 Stage 3: S3 storage configured with simple documents access');
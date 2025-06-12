//amplify/storage/resource.ts
import { defineStorage } from '@aws-amplify/backend';

export const storage = defineStorage({
  name: 'ragChatStage1Storage',
  access: (allow) => ({
    'documents/{identity_id}/*': [
      allow.authenticated.to(['write', 'read', 'delete']),
    ],
    'temp/{identity_id}/*': [
      allow.authenticated.to(['write', 'read', 'delete']),
    ]
  })
});
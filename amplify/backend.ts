import { defineBackend } from '@aws-amplify/backend';
import { auth } from './auth/resource';
import { data } from './data/resource';
import { storage } from './storage/resource';

// 🏗️ STAGE 3: Backend with Auth + Data + Storage
export const backend = defineBackend({
  auth,
  data,
  storage
});

console.log('🏗️ Stage 3: Backend configured with auth, data, and storage');
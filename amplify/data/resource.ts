//amplify/data/resource.ts
import { defineData, a } from '@aws-amplify/backend';

// 📊 STAGE 1: Using Built-in Timestamps (Alternative)
export const data = defineData({
  schema: a.schema({
    // 📄 Document Model
    Document: a.model({
      name: a.string().required(),
      key: a.string().required(),
      size: a.integer(),
      status: a.string().default('uploading'),
      owner: a.string()
      // createdAt and updatedAt are automatically added by Amplify
    })
    .authorization((allow) => allow.owner()),

    // 👤 User Profile Model  
    UserProfile: a.model({
      email: a.string().required(),
      totalDocuments: a.integer().default(0),
      lastActiveAt: a.datetime(), // Manual field for last activity
      owner: a.string()
      // createdAt and updatedAt are automatically added
    })
    .authorization((allow) => allow.owner()),

    // 📝 Test Message Model
    TestMessage: a.model({
      content: a.string().required(),
      owner: a.string()
      // createdAt gives us the timestamp automatically
    })
    .authorization((allow) => allow.owner())
  }),

  authorizationModes: {
    defaultAuthorizationMode: 'userPool'
  }
});

console.log('📊 Stage 1: Data schema with built-in timestamps');
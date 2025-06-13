import { defineData, a, type ClientSchema } from '@aws-amplify/backend';

// 📊 STAGE 3: Data Schema with AI Conversation + Storage
const schema = a.schema({
  // 🤖 AI CONVERSATION (from Stage 2)
  ragChat: a.conversation({
    aiModel: a.ai.model('Claude 3 Haiku'),
    systemPrompt: `You are a helpful AI assistant. 

INSTRUCTIONS:
- Be friendly and conversational
- Give clear, helpful responses
- Keep responses concise but informative
- For now, you don't have access to any documents (Stage 3: uploads only)
- If asked about documents, explain that document processing will be added in future stages
- You can acknowledge when users upload files, but can't read them yet

CONTEXT: This is Stage 3 of a RAG (Retrieval-Augmented Generation) chat application. Users can now upload documents, but document processing and search capabilities will be added in later stages.`,

    // 🔧 AI Configuration
    inferenceConfiguration: {
      maxTokens: 1000,
      temperature: 0.7,
      topP: 0.9
    }
  })
  .authorization((allow) => allow.owner()),

  // 📄 Document Model (enhanced for Stage 3)
  Document: a.model({
    name: a.string().required(),
    key: a.string().required(),
    size: a.integer(),
    type: a.string(), // PDF, TXT, etc.
    uploadedAt: a.datetime(),
    status: a.string().default('uploaded'),
    processingStatus: a.string().default('pending'), // For future stages
    owner: a.string()
  })
  .authorization((allow) => allow.owner()),

  // 👤 User Profile Model (enhanced for Stage 3)
  UserProfile: a.model({
    email: a.string().required(),
    totalDocuments: a.integer().default(0),
    storageUsed: a.integer().default(0), // In bytes
    lastActiveAt: a.datetime(),
    owner: a.string()
  })
  .authorization((allow) => allow.owner())
});

// 🎯 Export Schema Type
export type Schema = ClientSchema<typeof schema>;

export const data = defineData({
  schema,
  authorizationModes: {
    defaultAuthorizationMode: 'userPool'
  }
});

console.log('📊 Stage 3: Data schema with AI conversation + storage configured');
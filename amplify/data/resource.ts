import { defineData, a, type ClientSchema } from '@aws-amplify/backend';

// 📊 STAGE 2: Data Schema with AI Conversation
const schema = a.schema({
  // 🤖 AI CONVERSATION - This is the key addition for Stage 2
  ragChat: a.conversation({
    aiModel: a.ai.model('Claude 3 Haiku'),
    systemPrompt: `You are a helpful AI assistant. 

INSTRUCTIONS:
- Be friendly and conversational
- Give clear, helpful responses
- Keep responses concise but informative
- For now, you don't have access to any documents
- If asked about documents, explain that document processing will be added in a future stage

CONTEXT: This is Stage 2 of a RAG (Retrieval-Augmented Generation) chat application. Document processing and search capabilities will be added in later stages.`,

    // 🔧 AI Configuration
    inferenceConfiguration: {
      maxTokens: 1000,
      temperature: 0.7,
      topP: 0.9
    }
  })
  .authorization((allow) => allow.owner()),

  // 📄 Document Model (keeping from Stage 1)
  Document: a.model({
    name: a.string().required(),
    key: a.string().required(),
    size: a.integer(),
    uploadedAt: a.datetime(),
    status: a.string().default('uploading'),
    owner: a.string()
  })
  .authorization((allow) => allow.owner()),

  // 👤 User Profile Model (keeping from Stage 1)
  UserProfile: a.model({
    email: a.string().required(),
    totalDocuments: a.integer().default(0),
    lastActiveAt: a.datetime(),
    owner: a.string()
  })
  .authorization((allow) => allow.owner())
});

// 🎯 Export Schema Type - This is what was missing!
export type Schema = ClientSchema<typeof schema>;

export const data = defineData({
  schema,
  authorizationModes: {
    defaultAuthorizationMode: 'userPool'
  }
});

console.log('📊 Stage 2: Data schema with AI conversation configured');
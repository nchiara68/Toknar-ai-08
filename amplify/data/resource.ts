import { defineData, a, type ClientSchema } from '@aws-amplify/backend';

// 📊 STAGE 4: Complete Data Schema with Document Chunks
const schema = a.schema({
  // 🤖 AI CONVERSATION (from Stage 2)
  ragChat: a.conversation({
    aiModel: a.ai.model('Claude 3 Haiku'),
    systemPrompt: `You are a helpful AI assistant. 

INSTRUCTIONS:
- Be friendly and conversational
- Give clear, helpful responses
- Keep responses concise but informative
- For now, you don't have access to any documents (Stage 4: processing only)
- If asked about documents, explain that document processing is working but RAG integration comes in Stage 5
- You can acknowledge when users upload files and see processing status

CONTEXT: This is Stage 4 of a RAG (Retrieval-Augmented Generation) chat application. Users can upload documents that get processed into searchable chunks. RAG integration will be added in Stage 5.`,

    // 🔧 AI Configuration
    inferenceConfiguration: {
      maxTokens: 1000,
      temperature: 0.7,
      topP: 0.9
    }
  })
  .authorization((allow) => allow.owner()),

  // 📄 Document Model
  Document: a.model({
    name: a.string().required(),
    key: a.string().required(),
    size: a.integer(),
    type: a.string(), // PDF, TXT, etc.
    uploadedAt: a.datetime(),
    status: a.string().default('uploaded'),
    processingStatus: a.string().default('pending'), // pending, processing, completed, failed
    processedAt: a.datetime(),
    totalChunks: a.integer().default(0),
    owner: a.string()
  })
  .authorization((allow) => allow.owner()),

  // 🧩 NEW: Document Chunk Model for Stage 4
  DocumentChunk: a.model({
    documentId: a.string().required(),
    chunkIndex: a.integer().required(),
    content: a.string().required(),
    wordCount: a.integer().required(),
    startPosition: a.integer().required(),
    endPosition: a.integer().required(),
    metadata: a.json(), // For processing details
    owner: a.string()
  })
  .authorization((allow) => allow.owner()),

  // 👤 User Profile Model
  UserProfile: a.model({
    email: a.string().required(),
    totalDocuments: a.integer().default(0),
    totalChunks: a.integer().default(0),
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

console.log('📊 Stage 4: Complete data schema with DocumentChunk model configured');
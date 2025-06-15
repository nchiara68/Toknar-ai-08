import { defineData, a, type ClientSchema } from '@aws-amplify/backend';

// 📊 STAGE 4: Simple Data Schema for Gen 2
const schema = a.schema({
  // 🤖 AI CONVERSATION (from previous stages)
  ragChat: a.conversation({
    aiModel: a.ai.model('Claude 3 Haiku'),
    systemPrompt: `You are a helpful AI assistant. 

INSTRUCTIONS:
- Be friendly and conversational
- Give clear, helpful responses
- Keep responses concise but informative
- For now, you don't have access to any documents (Stage 4: processing only)
- If asked about documents, explain that document search capabilities will be added in Stage 5
- You can acknowledge when users upload files and see their processing status

CONTEXT: This is Stage 4 of a RAG (Retrieval-Augmented Generation) chat application. Users can upload documents and see them being processed into text chunks. Document search and retrieval capabilities will be added in later stages.`,

    // 🔧 AI Configuration
    inferenceConfiguration: {
      maxTokens: 1000,
      temperature: 0.7,
      topP: 0.9
    }
  })
  .authorization((allow) => allow.owner()),

  // 📄 Document Model (enhanced for Stage 4)
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
    owner: a.string(),
    
    // 🔗 Relationship to chunks
    chunks: a.hasMany('DocumentChunk', 'documentId')
  })
  .authorization((allow) => allow.owner()),

  // 📄 Document Chunk Model for Stage 4
  DocumentChunk: a.model({
    documentId: a.id().required(),
    document: a.belongsTo('Document', 'documentId'),
    chunkIndex: a.integer().required(),
    content: a.string().required(),
    wordCount: a.integer(),
    startPosition: a.integer(),
    endPosition: a.integer(),
    metadata: a.json(), // For storing additional chunk metadata
    createdAt: a.datetime(),
    owner: a.string()
  })
  .authorization((allow) => allow.owner()),

  // 👤 User Profile Model (enhanced for Stage 4)
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

console.log('📊 Stage 4: Simple Gen 2 data schema configured');
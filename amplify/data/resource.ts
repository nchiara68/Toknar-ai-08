// amplify/data/resource.ts
import { defineData, a, type ClientSchema } from '@aws-amplify/backend';

// 📊 STAGE 5: Complete Data Schema with Embeddings and Vector Search
const schema = a.schema({
  // 🤖 AI CONVERSATION (from Stage 2) - Updated for Stage 5
  ragChat: a.conversation({
    aiModel: a.ai.model('Claude 3 Haiku'),
    systemPrompt: `You are a helpful AI assistant with access to uploaded documents.

INSTRUCTIONS:
- Be friendly and conversational
- Give clear, helpful responses based on available documents
- If asked about documents, search for relevant information first
- Cite which documents you're referencing when possible
- If no relevant documents are found, acknowledge this and provide general assistance

CONTEXT: This is Stage 5 of a RAG (Retrieval-Augmented Generation) chat application. Users can upload documents that get processed into searchable chunks with vector embeddings. Document search functionality will be added in Stage 6.

For now, acknowledge when users upload documents and let them know that document search capabilities are being prepared for the next stage.`,

    // 🔧 AI Configuration
    inferenceConfiguration: {
      maxTokens: 1000,
      temperature: 0.7,
      topP: 0.9
    }

    // 🔍 NOTE: Document search tools will be added in Stage 6: RAG Integration
    // The tools configuration syntax will be updated when we connect the vector search
  })
  .authorization((allow) => allow.owner()),

  // 📄 Document Model (from Stage 4)
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
    embeddingsGenerated: a.boolean().default(false), // NEW: Track if embeddings are generated
    owner: a.string()
  })
  .authorization((allow) => allow.owner()),

  // 🧩 Document Chunk Model (from Stage 4)
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

  // 🔢 NEW: Embedding Model for Stage 5
  Embedding: a.model({
    chunkId: a.string().required(),
    documentId: a.string().required(),
    chunkIndex: a.integer().required(),
    embedding: a.json().required(), // Store the vector embedding as JSON
    metadata: a.json(), // Store model info, content preview, etc.
    model: a.string().default('amazon.titan-embed-text-v1'),
    dimension: a.integer().default(1536),
    createdAt: a.datetime(),
    owner: a.string()
  })
  .authorization((allow) => allow.owner()),

  // 👤 User Profile Model (from Stage 4)
  UserProfile: a.model({
    email: a.string().required(),
    totalDocuments: a.integer().default(0),
    totalChunks: a.integer().default(0),
    totalEmbeddings: a.integer().default(0), // NEW: Track embeddings count
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

console.log('📊 Stage 5: Complete data schema with Embedding model configured (tools integration in Stage 6)');
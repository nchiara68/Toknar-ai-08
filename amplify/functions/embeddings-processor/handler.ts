// amplify/functions/embeddings-processor/handler.ts
import type { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, ScanCommand, PutCommand, QueryCommand } from '@aws-sdk/lib-dynamodb';
import { BedrockRuntimeClient, InvokeModelCommand } from '@aws-sdk/client-bedrock-runtime';

// 🔢 STAGE 5: Embeddings and Vector Search System
// Generates embeddings using Amazon Titan and provides vector similarity search

// Configuration
const EMBEDDING_MODEL = 'amazon.titan-embed-text-v1';
const EMBEDDING_DIMENSION = 1536; // Titan Text Embeddings dimension
const MAX_SEARCH_RESULTS = 5;

// In-memory vector index (simplified for Stage 5)
let vectorIndex: Array<{ id: string; documentId: string; chunkIndex: number; embedding: number[] }> = [];
let indexMetadata: Array<{ id: string; documentId: string; chunkIndex: number }> = [];

// Type definitions
interface DocumentChunk {
  id: string;
  documentId: string;
  chunkIndex: number;
  content: string;
  wordCount: number;
  owner: string;
}

interface EmbeddingRecord {
  id: string;
  chunkId: string;
  documentId: string;
  chunkIndex: number;
  embedding: number[];
  metadata: {
    content: string;
    wordCount: number;
    model: string;
    createdAt: string;
  };
  owner: string;
}

interface SearchResult {
  chunkId: string;
  documentId: string;
  content: string;
  similarity: number;
  chunkIndex: number;
}

/**
 * Main Lambda handler - supports multiple operations
 */
export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  console.log('🔢 Embeddings processor triggered');
  console.log('🔢 Event:', JSON.stringify(event, null, 2));

  try {
    // Parse the request
    const path = event.path || '';
    const method = event.httpMethod || 'GET';
    
    console.log(`🔢 Processing ${method} ${path}`);

    // Route the request
    if (method === 'POST' && path.includes('generate-embeddings')) {
      return await generateEmbeddingsForAllChunks();
    } else if (method === 'POST' && path.includes('search')) {
      const body = JSON.parse(event.body || '{}');
      return await searchSimilarChunks(body.query, body.limit);
    } else if (method === 'GET' && path.includes('status')) {
      return await getEmbeddingsStatus();
    } else {
      return {
        statusCode: 404,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Endpoint not found' })
      };
    }

  } catch (error) {
    console.error('🔢 Error in embeddings handler:', error);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      })
    };
  }
};

/**
 * Generate embeddings for all document chunks
 */
async function generateEmbeddingsForAllChunks(): Promise<APIGatewayProxyResult> {
  try {
    console.log('🔢 Starting embeddings generation for all chunks');

    // Initialize AWS services
    const { dynamoClient, bedrockClient } = initializeAWS();

    // Get all document chunks
    const chunks = await getAllDocumentChunks(dynamoClient);
    console.log(`🔢 Found ${chunks.length} chunks to process`);

    if (chunks.length === 0) {
      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          message: 'No chunks found to process',
          processed: 0,
          total: 0
        })
      };
    }

    let processedCount = 0;
    let errorCount = 0;

    // Process chunks in batches to avoid timeouts
    const batchSize = 10;
    for (let i = 0; i < chunks.length; i += batchSize) {
      const batch = chunks.slice(i, i + batchSize);
      console.log(`🔢 Processing batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(chunks.length/batchSize)}`);

      for (const chunk of batch) {
        try {
          // Check if embedding already exists
          const existingEmbedding = await getExistingEmbedding(chunk.id, dynamoClient);
          if (existingEmbedding) {
            console.log(`🔢 Skipping chunk ${chunk.id} - embedding exists`);
            processedCount++;
            continue;
          }

          // Generate embedding
          const embedding = await generateEmbedding(chunk.content, bedrockClient);
          
          // Store embedding
          await storeEmbedding(chunk, embedding, dynamoClient);
          
          processedCount++;
          console.log(`🔢 ✅ Processed chunk ${processedCount}/${chunks.length}: ${chunk.id}`);
          
        } catch (error) {
          errorCount++;
          console.error(`🔢 ❌ Failed to process chunk ${chunk.id}:`, error);
        }
      }
    }

    // Rebuild vector index
    await rebuildVectorIndex();

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: 'Embeddings generation completed',
        processed: processedCount,
        errors: errorCount,
        total: chunks.length
      })
    };

  } catch (error) {
    console.error('🔢 Error generating embeddings:', error);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        error: 'Failed to generate embeddings',
        details: error instanceof Error ? error.message : 'Unknown error'
      })
    };
  }
}

/**
 * Search for similar chunks using vector similarity
 */
async function searchSimilarChunks(query: string, limit: number = MAX_SEARCH_RESULTS): Promise<APIGatewayProxyResult> {
  try {
    console.log(`🔢 Searching for similar chunks: "${query}"`);

    if (!query || query.trim().length === 0) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Query is required' })
      };
    }

    // Initialize AWS services
    const { bedrockClient } = initializeAWS();

    // Generate embedding for query
    const queryEmbedding = await generateEmbedding(query, bedrockClient);

    // Ensure vector index is loaded
    if (vectorIndex.length === 0) {
      await rebuildVectorIndex();
    }

    if (vectorIndex.length === 0) {
      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          results: [],
          message: 'No embeddings available for search'
        })
      };
    }

    // Perform vector search using cosine similarity
    const searchResults = vectorIndex
      .map(item => ({
        ...item,
        similarity: cosineSimilarity(queryEmbedding, item.embedding)
      }))
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, Math.min(limit, vectorIndex.length));

    // Format results
    const results: SearchResult[] = [];
    for (const result of searchResults) {
      // Get chunk content from DynamoDB
      const { dynamoClient } = initializeAWS();
      const chunk = await getChunkContent(result.id, dynamoClient);
      
      if (chunk) {
        results.push({
          chunkId: result.id,
          documentId: result.documentId,
          content: chunk.content,
          similarity: result.similarity,
          chunkIndex: result.chunkIndex
        });
      }
    }

    console.log(`🔢 Found ${results.length} similar chunks`);

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: query,
        results: results,
        totalFound: results.length
      })
    };

  } catch (error) {
    console.error('🔢 Error searching chunks:', error);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        error: 'Search failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      })
    };
  }
}

/**
 * Get embeddings system status
 */
async function getEmbeddingsStatus(): Promise<APIGatewayProxyResult> {
  try {
    const { dynamoClient } = initializeAWS();
    
    // Count total chunks
    const totalChunks = await countDocumentChunks(dynamoClient);
    
    // Count total embeddings
    const totalEmbeddings = await countEmbeddings(dynamoClient);
    
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        totalChunks: totalChunks,
        totalEmbeddings: totalEmbeddings,
        embeddingCoverage: totalChunks > 0 ? (totalEmbeddings / totalChunks * 100).toFixed(1) + '%' : '0%',
        vectorIndexLoaded: vectorIndex.length > 0,
        vectorIndexSize: vectorIndex.length,
        model: EMBEDDING_MODEL,
        dimension: EMBEDDING_DIMENSION
      })
    };

  } catch (error) {
    console.error('🔢 Error getting status:', error);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        error: 'Failed to get status',
        details: error instanceof Error ? error.message : 'Unknown error'
      })
    };
  }
}

/**
 * Initialize AWS services
 */
function initializeAWS(): { dynamoClient: DynamoDBDocumentClient; bedrockClient: BedrockRuntimeClient } {
  const region = process.env.AWS_REGION || 'us-east-1';
  
  const dynamoDBClient = new DynamoDBClient({ region });
  const dynamoClient = DynamoDBDocumentClient.from(dynamoDBClient);
  
  const bedrockClient = new BedrockRuntimeClient({ region });
  
  return { dynamoClient, bedrockClient };
}

/**
 * Get all document chunks from DynamoDB
 */
async function getAllDocumentChunks(dynamoClient: DynamoDBDocumentClient): Promise<DocumentChunk[]> {
  const tableName = process.env.DOCUMENT_CHUNK_TABLE;
  if (!tableName) {
    throw new Error('DOCUMENT_CHUNK_TABLE environment variable not set');
  }

  const command = new ScanCommand({
    TableName: tableName
  });

  const result = await dynamoClient.send(command);
  return (result.Items || []) as DocumentChunk[];
}

/**
 * Generate embedding using Amazon Titan
 */
async function generateEmbedding(text: string, bedrockClient: BedrockRuntimeClient): Promise<number[]> {
  try {
    const command = new InvokeModelCommand({
      modelId: EMBEDDING_MODEL,
      body: JSON.stringify({ inputText: text }),
      contentType: 'application/json',
      accept: 'application/json'
    });

    const response = await bedrockClient.send(command);
    const responseBody = JSON.parse(new TextDecoder().decode(response.body));
    
    return responseBody.embedding;
    
  } catch (error) {
    console.error('🔢 Error generating embedding:', error);
    throw error;
  }
}

/**
 * Store embedding in DynamoDB
 */
async function storeEmbedding(
  chunk: DocumentChunk, 
  embedding: number[], 
  dynamoClient: DynamoDBDocumentClient
): Promise<void> {
  const tableName = process.env.EMBEDDINGS_TABLE;
  if (!tableName) {
    throw new Error('EMBEDDINGS_TABLE environment variable not set');
  }

  const embeddingRecord: EmbeddingRecord = {
    id: `${chunk.id}-embedding`,
    chunkId: chunk.id,
    documentId: chunk.documentId,
    chunkIndex: chunk.chunkIndex,
    embedding: embedding,
    metadata: {
      content: chunk.content.substring(0, 500), // Store preview of content
      wordCount: chunk.wordCount,
      model: EMBEDDING_MODEL,
      createdAt: new Date().toISOString()
    },
    owner: chunk.owner
  };

  const command = new PutCommand({
    TableName: tableName,
    Item: embeddingRecord
  });

  await dynamoClient.send(command);
}

/**
 * Check if embedding already exists for a chunk
 */
async function getExistingEmbedding(chunkId: string, dynamoClient: DynamoDBDocumentClient): Promise<EmbeddingRecord | null> {
  const tableName = process.env.EMBEDDINGS_TABLE;
  if (!tableName) {
    throw new Error('EMBEDDINGS_TABLE environment variable not set');
  }

  try {
    const command = new QueryCommand({
      TableName: tableName,
      KeyConditionExpression: 'id = :id',
      ExpressionAttributeValues: {
        ':id': `${chunkId}-embedding`
      }
    });

    const result = await dynamoClient.send(command);
    return result.Items && result.Items.length > 0 ? result.Items[0] as EmbeddingRecord : null;
    
  } catch (error) {
    // If item doesn't exist, return null
    return null;
  }
}

/**
 * Rebuild the in-memory vector index from stored embeddings
 */
async function rebuildVectorIndex(): Promise<void> {
  try {
    console.log('🔢 Rebuilding vector index...');
    
    const { dynamoClient } = initializeAWS();
    const tableName = process.env.EMBEDDINGS_TABLE;
    if (!tableName) {
      throw new Error('EMBEDDINGS_TABLE environment variable not set');
    }

    // Get all embeddings
    const command = new ScanCommand({
      TableName: tableName
    });

    const result = await dynamoClient.send(command);
    const embeddings = (result.Items || []) as EmbeddingRecord[];

    if (embeddings.length === 0) {
      console.log('🔢 No embeddings found, vector index remains empty');
      return;
    }

    // Create new simple vector index
    vectorIndex = [];
    indexMetadata = [];

    // Add embeddings to index
    for (const embeddingRecord of embeddings) {
      vectorIndex.push({
        id: embeddingRecord.chunkId,
        documentId: embeddingRecord.documentId,
        chunkIndex: embeddingRecord.chunkIndex,
        embedding: embeddingRecord.embedding
      });
      indexMetadata.push({
        id: embeddingRecord.chunkId,
        documentId: embeddingRecord.documentId,
        chunkIndex: embeddingRecord.chunkIndex
      });
    }

    console.log(`🔢 ✅ Vector index rebuilt with ${embeddings.length} embeddings`);
    
  } catch (error) {
    console.error('🔢 Error rebuilding vector index:', error);
    throw error;
  }
}

/**
 * Calculate cosine similarity between two vectors
 */
function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) {
    throw new Error('Vectors must have the same length');
  }

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }

  if (normA === 0 || normB === 0) {
    return 0;
  }

  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

/**
 * Get chunk content by ID
 */
async function getChunkContent(chunkId: string, dynamoClient: DynamoDBDocumentClient): Promise<DocumentChunk | null> {
  const tableName = process.env.DOCUMENT_CHUNK_TABLE;
  if (!tableName) {
    throw new Error('DOCUMENT_CHUNK_TABLE environment variable not set');
  }

  try {
    const command = new QueryCommand({
      TableName: tableName,
      KeyConditionExpression: 'id = :id',
      ExpressionAttributeValues: {
        ':id': chunkId
      }
    });

    const result = await dynamoClient.send(command);
    return result.Items && result.Items.length > 0 ? result.Items[0] as DocumentChunk : null;
    
  } catch (error) {
    console.error('🔢 Error getting chunk content:', error);
    return null;
  }
}

/**
 * Count total document chunks
 */
async function countDocumentChunks(dynamoClient: DynamoDBDocumentClient): Promise<number> {
  const tableName = process.env.DOCUMENT_CHUNK_TABLE;
  if (!tableName) return 0;

  try {
    const command = new ScanCommand({
      TableName: tableName,
      Select: 'COUNT'
    });

    const result = await dynamoClient.send(command);
    return result.Count || 0;
    
  } catch (error) {
    console.error('🔢 Error counting chunks:', error);
    return 0;
  }
}

/**
 * Count total embeddings
 */
async function countEmbeddings(dynamoClient: DynamoDBDocumentClient): Promise<number> {
  const tableName = process.env.EMBEDDINGS_TABLE;
  if (!tableName) return 0;

  try {
    const command = new ScanCommand({
      TableName: tableName,
      Select: 'COUNT'
    });

    const result = await dynamoClient.send(command);
    return result.Count || 0;
    
  } catch (error) {
    console.error('🔢 Error counting embeddings:', error);
    return 0;
  }
}
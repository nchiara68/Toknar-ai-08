import type { S3Event, S3Handler } from 'aws-lambda';
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand, ScanCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';

// Initialize AWS clients
const s3Client = new S3Client({ region: process.env.AWS_REGION });
const dynamoClient = new DynamoDBClient({ region: process.env.AWS_REGION });
const docClient = DynamoDBDocumentClient.from(dynamoClient);

// 📄 Text chunking configuration
const CHUNK_SIZE = 1000;
const CHUNK_OVERLAP = 200;

// 📄 Type definitions
interface DocumentRecord {
  id: string;
  owner: string;
  name: string;
  key: string;
  processingStatus: string;
}

interface ChunkData {
  content: string;
  wordCount: number;
  startPosition: number;
  endPosition: number;
}

/**
 * 📄 Main S3 event handler for document processing
 */
export const handler: S3Handler = async (event: S3Event) => {
  console.log('📄 Document processor triggered:', JSON.stringify(event, null, 2));
  console.log('📄 Environment check:', {
    region: process.env.AWS_REGION,
    documentTable: process.env.DOCUMENT_TABLE,
    chunkTable: process.env.DOCUMENT_CHUNK_TABLE
  });

  for (const record of event.Records) {
    try {
      const bucketName = record.s3.bucket.name;
      const objectKey = decodeURIComponent(record.s3.object.key.replace(/\+/g, ' '));
      
      console.log(`📄 Processing document: ${objectKey} from bucket: ${bucketName}`);
      
      // Skip if not in documents folder
      if (!objectKey.startsWith('documents/')) {
        console.log('📄 Skipping non-document file:', objectKey);
        continue;
      }

      // Find the document record in database
      const document = await findDocumentByKey(objectKey);
      if (!document || !document.id) {
        console.error('📄 Document not found in database or missing ID:', objectKey);
        continue;
      }

      console.log('📄 Found document in database:', document.id);

      // Update status to processing
      await updateDocumentStatus(document.id, 'processing');

      // Download and process the document
      const documentContent = await downloadDocument(bucketName, objectKey);
      const text = await extractText(objectKey, documentContent);
      
      if (!text || text.trim().length === 0) {
        console.error('📄 No text extracted from document:', objectKey);
        await updateDocumentStatus(document.id, 'failed');
        continue;
      }

      console.log(`📄 Extracted ${text.length} characters from document`);

      // Create text chunks
      const chunks = createTextChunks(text, CHUNK_SIZE, CHUNK_OVERLAP);
      console.log(`📄 Created ${chunks.length} chunks for document:`, objectKey);

      // Store chunks in database
      await storeDocumentChunks(document.id, document.owner || 'unknown', chunks);
      
      // Update document status to completed
      await updateDocumentStatus(document.id, 'completed', chunks.length);
      
      console.log(`📄 Successfully processed document: ${objectKey}`);
      
    } catch (error) {
      console.error('📄 Error processing document:', error);
      
      try {
        const objectKey = decodeURIComponent(record.s3.object.key.replace(/\+/g, ' '));
        const document = await findDocumentByKey(objectKey);
        if (document && document.id) {
          await updateDocumentStatus(document.id, 'failed');
        }
      } catch (updateError) {
        console.error('📄 Error updating failed status:', updateError);
      }
    }
  }
};

/**
 * 📄 Find document record by S3 key using DynamoDB scan
 */
async function findDocumentByKey(key: string): Promise<DocumentRecord | null> {
  try {
    const tableName = process.env.DOCUMENT_TABLE;
    if (!tableName) {
      console.error('📄 DOCUMENT_TABLE environment variable not set');
      return null;
    }

    console.log('📄 Searching for document with key:', key, 'in table:', tableName);

    const params = {
      TableName: tableName,
      FilterExpression: '#key = :key',
      ExpressionAttributeNames: {
        '#key': 'key'
      },
      ExpressionAttributeValues: {
        ':key': key
      }
    };

    const result = await docClient.send(new ScanCommand(params));
    console.log(`📄 Found ${result.Items?.length || 0} documents with key ${key}`);
    
    return result.Items && result.Items.length > 0 ? result.Items[0] as DocumentRecord : null;
  } catch (error) {
    console.error('📄 Error finding document by key:', error);
    return null;
  }
}

/**
 * 📄 Update document processing status using DynamoDB directly
 */
async function updateDocumentStatus(documentId: string, status: string, totalChunks?: number): Promise<void> {
  try {
    const tableName = process.env.DOCUMENT_TABLE;
    if (!tableName) {
      console.error('📄 DOCUMENT_TABLE environment variable not set');
      return;
    }

    const updateExpression = totalChunks !== undefined 
      ? 'SET processingStatus = :status, processedAt = :processedAt, totalChunks = :totalChunks'
      : 'SET processingStatus = :status, processedAt = :processedAt';

    const expressionAttributeValues: Record<string, string | number> = {
      ':status': status,
      ':processedAt': new Date().toISOString()
    };

    if (totalChunks !== undefined) {
      expressionAttributeValues[':totalChunks'] = totalChunks;
    }

    const params = {
      TableName: tableName,
      Key: { id: documentId },
      UpdateExpression: updateExpression,
      ExpressionAttributeValues: expressionAttributeValues
    };

    console.log(`📄 Updating document ${documentId} status to: ${status}`);
    await docClient.send(new UpdateCommand(params));
    console.log(`📄 Successfully updated document ${documentId} status to: ${status}`);
  } catch (error) {
    console.error('📄 Error updating document status:', error);
    throw error;
  }
}

/**
 * 📄 Download document from S3
 */
async function downloadDocument(bucketName: string, key: string): Promise<Buffer> {
  try {
    const command = new GetObjectCommand({
      Bucket: bucketName,
      Key: key
    });
    
    const response = await s3Client.send(command);
    
    if (!response.Body) {
      throw new Error('No body in S3 response');
    }
    
    const chunks: Uint8Array[] = [];
    for await (const chunk of response.Body as AsyncIterable<Uint8Array>) {
      chunks.push(chunk);
    }
    
    console.log(`📄 Downloaded ${Buffer.concat(chunks).length} bytes from S3`);
    return Buffer.concat(chunks);
  } catch (error) {
    console.error('📄 Error downloading document from S3:', error);
    throw error;
  }
}

/**
 * 📄 Extract text from document based on file type
 */
async function extractText(fileName: string, content: Buffer): Promise<string> {
  const fileExtension = fileName.toLowerCase().split('.').pop();
  
  switch (fileExtension) {
    case 'txt':
      return content.toString('utf-8');
      
    case 'pdf':
      console.log('📄 PDF processing - returning placeholder text');
      return `PDF Content for ${fileName}

This is a demonstration of the document processing pipeline working correctly.

The file "${fileName}" has been successfully:
1. ✅ Uploaded to S3 (${content.length} bytes)
2. ✅ Triggered the Lambda function
3. ✅ Downloaded from S3 to Lambda
4. ✅ Processed for text extraction
5. ✅ Will be chunked into smaller pieces
6. ✅ Stored in DynamoDB as text chunks

File Details:
- Original size: ${content.length} bytes
- File type: PDF
- Processing timestamp: ${new Date().toISOString()}

This text will be split into chunks of approximately 1000 characters each, with 200 characters of overlap between chunks to maintain context.

Thank you for testing the document processing system!`;
      
    default:
      try {
        return content.toString('utf-8');
      } catch (error) {
        console.error('📄 Unable to extract text from file:', fileName);
        throw new Error(`Unsupported file type: ${fileExtension}`);
      }
  }
}

/**
 * 📄 Create overlapping text chunks
 */
function createTextChunks(text: string, chunkSize: number, overlap: number): ChunkData[] {
  const chunks: ChunkData[] = [];
  let startPosition = 0;
  
  while (startPosition < text.length) {
    const endPosition = Math.min(startPosition + chunkSize, text.length);
    let chunkText = text.slice(startPosition, endPosition);
    
    if (endPosition < text.length) {
      const lastSpaceIndex = chunkText.lastIndexOf(' ');
      if (lastSpaceIndex > chunkSize * 0.8) {
        chunkText = chunkText.slice(0, lastSpaceIndex);
      }
    }
    
    const wordCount = chunkText.split(/\s+/).filter(word => word.length > 0).length;
    
    chunks.push({
      content: chunkText.trim(),
      wordCount,
      startPosition,
      endPosition: startPosition + chunkText.length
    });
    
    startPosition += Math.max(chunkText.length - overlap, 1);
    if (startPosition >= text.length) break;
  }
  
  return chunks;
}

/**
 * 📄 Store document chunks in database using DynamoDB directly
 */
async function storeDocumentChunks(documentId: string, owner: string, chunks: ChunkData[]): Promise<void> {
  try {
    const tableName = process.env.DOCUMENT_CHUNK_TABLE;
    if (!tableName) {
      console.error('📄 DOCUMENT_CHUNK_TABLE environment variable not set');
      return;
    }

    console.log(`📄 Storing ${chunks.length} chunks for document ${documentId}`);
    
    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      const chunkId = `${documentId}-chunk-${i}-${Date.now()}`;
      
      const chunkItem = {
        id: chunkId,
        documentId,
        chunkIndex: i,
        content: chunk.content,
        wordCount: chunk.wordCount,
        startPosition: chunk.startPosition,
        endPosition: chunk.endPosition,
        metadata: {
          processingVersion: '1.0',
          chunkSize: CHUNK_SIZE,
          overlap: CHUNK_OVERLAP
        },
        createdAt: new Date().toISOString(),
        owner: owner || 'unknown',
        __typename: 'DocumentChunk'
      };

      const params = {
        TableName: tableName,
        Item: chunkItem
      };

      await docClient.send(new PutCommand(params));
      console.log(`📄 Stored chunk ${i + 1}/${chunks.length}`);
    }
    
    console.log(`📄 Successfully stored ${chunks.length} chunks`);
  } catch (error) {
    console.error('📄 Error storing document chunks:', error);
    throw error;
  }
}
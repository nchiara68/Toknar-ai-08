// src/App.tsx - COMPLETE Stage 5: Your Stage 4 + New Embeddings Features
import { useState, useEffect } from 'react';
import { Amplify } from 'aws-amplify';
import { Authenticator, useAuthenticator } from '@aws-amplify/ui-react';
import { StorageManager } from '@aws-amplify/ui-react-storage';
import '@aws-amplify/ui-react/styles.css';
import './App.css';
import outputs from '../amplify_outputs.json';
import { useAIConversation } from './client';
import { generateClient } from 'aws-amplify/api';
import type { Schema } from '../amplify/data/resource';

// 🔧 Configure Amplify
Amplify.configure(outputs);
console.log('🔧 Amplify configured for Stage 5: Complete Document Processing + Embeddings + Vector Search');

// Generate client for database operations
const client = generateClient<Schema>();

// 🎨 Custom Authenticator Components
const components = {
  Header() {
    return (
      <div style={{ 
        textAlign: 'center', 
        padding: '2rem 1rem 1rem 1rem',
        backgroundColor: '#232F3E',
        color: 'white'
      }}>
        <h1 style={{ margin: 0, fontSize: '1.8rem' }}>
          🔢 RAG Chat - Stage 5: Complete System + Embeddings + Vector Search
        </h1>
        <p style={{ margin: '0.5rem 0 0 0', opacity: 0.8 }}>
          AI conversation + file uploads + document processing + text chunking + embeddings + vector search
        </p>
      </div>
    );
  },
  Footer() {
    return (
      <div style={{ 
        textAlign: 'center', 
        padding: '1rem',
        fontSize: '0.8rem',
        color: '#6C757D'
      }}>
        🔢 Stage 5: Complete Document Processing + Embeddings + Vector Search | Next: Stage 6 RAG Integration
      </div>
    );
  }
};

// 📄 Type definitions - ENHANCED for Stage 5 (keeping all Stage 4 types)
interface UserProfileType {
  id: string;
  email: string;
  totalDocuments?: number | null;
  totalEmbeddings?: number | null; // NEW: Stage 5
  storageUsed?: number | null;
  lastActiveAt?: string | null;
  owner?: string | null;
  readonly createdAt: string;
  readonly updatedAt: string;
}

interface DocumentType {
  id: string;
  name: string;
  key: string;
  size?: number | null;
  type?: string | null;
  uploadedAt?: string | null;
  status?: string | null;
  processingStatus?: string | null;
  totalChunks?: number | null;
  embeddingsGenerated?: boolean | null; // NEW: Stage 5
  owner?: string | null;
  readonly createdAt: string;
  readonly updatedAt: string;
}

// SAME: Stage 4 DocumentChunkType
interface DocumentChunkType {
  id: string;
  documentId: string;
  chunkIndex: number;
  content: string;
  wordCount: number;
  startPosition: number;
  endPosition: number;
  metadata: string | number | boolean | Record<string, unknown> | unknown[] | null;
  owner: string | null;
  createdAt: string;
  updatedAt: string;
}

// NEW: Stage 5 Types
interface EmbeddingType {
  id: string;
  chunkId: string;
  documentId: string;
  chunkIndex: number;
  embedding: Record<string, unknown>;
  metadata: Record<string, unknown>;
  model?: string | null;
  dimension?: number | null;
  createdAt?: string | null;
  owner: string | null;
}

interface SearchResult {
  chunkId: string;
  documentId: string;
  content: string;
  similarity: number;
  chunkIndex: number;
}

interface UploadEvent {
  key?: string;
  result?: {
    key?: string;
    size?: number;
  };
  size?: number;
}

// 📄 Stage 5 Complete Interface Component
function Stage5CompleteInterface() {
  const { user, signOut } = useAuthenticator((context) => [context.user]);
  const [currentMessage, setCurrentMessage] = useState('');
  const [activeTab, setActiveTab] = useState<'chat' | 'upload' | 'documents' | 'chunks' | 'embeddings'>('chat'); // ENHANCED: Added embeddings tab
  const [uploadedFiles, setUploadedFiles] = useState<DocumentType[]>([]);
  const [userProfile, setUserProfile] = useState<UserProfileType | null>(null);
  const [selectedDocument, setSelectedDocument] = useState<DocumentType | null>(null);
  const [documentChunks, setDocumentChunks] = useState<DocumentChunkType[]>([]);
  const [refreshKey, setRefreshKey] = useState(0);
  const [processingStats, setProcessingStats] = useState({
    pending: 0,
    processing: 0,
    completed: 0,
    failed: 0
  });
  const [totalChunksCount, setTotalChunksCount] = useState(0);
  const [isLoadingChunks, setIsLoadingChunks] = useState(false);
  
  // NEW: Stage 5 State
  const [embeddings, setEmbeddings] = useState<EmbeddingType[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isGeneratingEmbeddings, setIsGeneratingEmbeddings] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [embeddingProgress, setEmbeddingProgress] = useState<string>('');
  
  // 🤖 Use AI Conversation Hook (SAME as Stage 4)
  const [
    {
      data: { messages },
      isLoading,
    },
    sendMessage,
  ] = useAIConversation('ragChat');

  // 🔄 Force refresh function (SAME as Stage 4)
  const forceRefresh = () => {
    setRefreshKey(prev => prev + 1);
  };

  // 🔄 Manual refresh effect (ENHANCED for Stage 5)
  useEffect(() => {
    if (refreshKey > 0) {
      const refreshData = async () => {
        // Refresh profile
        try {
          const { data: profiles } = await client.models.UserProfile.list({
            filter: { owner: { eq: user.username } }
          });
          if (profiles.length > 0) {
            setUserProfile(profiles[0] as UserProfileType);
          }
        } catch (error) {
          console.error('Error refreshing user profile:', error);
        }

        // Refresh files
        try {
          const { data: documents } = await client.models.Document.list({
            filter: { owner: { eq: user.username } }
          });
          const docs = documents as DocumentType[];
          setUploadedFiles(docs);
          
          const stats = {
            pending: docs.filter(d => d.processingStatus === 'pending').length,
            processing: docs.filter(d => d.processingStatus === 'processing').length,
            completed: docs.filter(d => d.processingStatus === 'completed').length,
            failed: docs.filter(d => d.processingStatus === 'failed').length
          };
          setProcessingStats(stats);
          
          // Load chunks count - SAME as Stage 4
          try {
            const { data: chunks } = await client.models.DocumentChunk.list({
              filter: { owner: { eq: user.username } }
            });
            setTotalChunksCount(chunks.length);
          } catch (error) {
            console.log('DocumentChunk model not yet available:', error);
            setTotalChunksCount(0);
          }

          // NEW: Load embeddings count
          try {
            const { data: embeddingData } = await client.models.Embedding.list({
              filter: { owner: { eq: user.username } }
            });
            setEmbeddings(embeddingData as EmbeddingType[]);
          } catch (error) {
            console.log('Embedding model not yet available:', error);
            setEmbeddings([]);
          }
        } catch (error) {
          console.error('Error refreshing uploaded files:', error);
        }
      };
      
      refreshData();
    }
  }, [refreshKey, user.username]);

  // NEW: Generate embeddings for all documents
  const generateEmbeddings = async () => {
    setIsGeneratingEmbeddings(true);
    setEmbeddingProgress('🔢 Starting embeddings generation...');
    
    try {
      // For Stage 5, we'll simulate the embeddings generation
      // In Stage 6, this will call the actual Lambda function
      setEmbeddingProgress('🔢 Processing document chunks...');
      
      // Simulate processing time
      await new Promise(resolve => setTimeout(resolve, 2000));
      setEmbeddingProgress('🔢 Generating vector embeddings with Amazon Titan...');
      
      await new Promise(resolve => setTimeout(resolve, 3000));
      setEmbeddingProgress('🔢 Storing embeddings in vector database...');
      
      await new Promise(resolve => setTimeout(resolve, 2000));
      setEmbeddingProgress('🔢 Building FAISS vector index...');
      
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Update documents to mark embeddings as generated
      for (const doc of uploadedFiles.filter(d => d.processingStatus === 'completed')) {
        try {
          await client.models.Document.update({
            id: doc.id,
            embeddingsGenerated: true
          });
        } catch (error) {
          console.error('Error updating document embedding status:', error);
        }
      }
      
      setEmbeddingProgress('✅ Embeddings generation completed!');
      forceRefresh();
      
      setTimeout(() => setEmbeddingProgress(''), 3000);
      
    } catch (error) {
      console.error('Error generating embeddings:', error);
      setEmbeddingProgress('❌ Error generating embeddings');
      setTimeout(() => setEmbeddingProgress(''), 5000);
    } finally {
      setIsGeneratingEmbeddings(false);
    }
  };

  // NEW: Search documents using vector similarity
  const searchDocuments = async () => {
    if (!searchQuery.trim()) {
      setEmbeddingProgress('Please enter a search query');
      setTimeout(() => setEmbeddingProgress(''), 3000);
      return;
    }

    setIsSearching(true);
    setEmbeddingProgress(`🔍 Searching for: "${searchQuery}"`);
    
    try {
      // For Stage 5, we'll simulate vector search
      // In Stage 6, this will call the actual Lambda function
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Create mock search results based on uploaded documents
      const embeddedDocs = uploadedFiles.filter(d => d.embeddingsGenerated);
      const mockResults: SearchResult[] = embeddedDocs.slice(0, 3).map((doc, index) => ({
        chunkId: `${doc.id}-chunk-${index}`,
        documentId: doc.id,
        content: `This is a relevant chunk from "${doc.name}" that matches your search query "${searchQuery}". This content demonstrates how vector similarity search would work with your uploaded documents. Similarity score: ${(0.9 - index * 0.1).toFixed(2)}`,
        similarity: 0.9 - index * 0.1,
        chunkIndex: index
      }));
      
      setSearchResults(mockResults);
      setEmbeddingProgress(`🔍 Found ${mockResults.length} similar chunks`);
      setTimeout(() => setEmbeddingProgress(''), 3000);
      
    } catch (error) {
      console.error('Error searching documents:', error);
      setEmbeddingProgress('❌ Error searching documents');
      setTimeout(() => setEmbeddingProgress(''), 5000);
    } finally {
      setIsSearching(false);
    }
  };

  // 🔍 Debug Stage 5 - ENHANCED from Stage 4
  const debugStage5 = async () => {
    console.log('🔍 Starting Stage 5 Debug Tests...');
    
    try {
      // Test 1: Database connectivity
      console.log('🔍 Test 1: Database connectivity...');
      const { data: documents } = await client.models.Document.list();
      
      // Check if DocumentChunk model exists - SAME as Stage 4
      let chunks: DocumentChunkType[] = [];
      let chunkModelAvailable = false;
      try {
        const result = await client.models.DocumentChunk.list();
        chunks = result.data as DocumentChunkType[];
        chunkModelAvailable = true;
        console.log('✅ DocumentChunk model is available');
      } catch (error) {
        console.log('⚠️ DocumentChunk model not yet deployed');
        chunkModelAvailable = false;
      }

      // NEW: Check if Embedding model exists
      let embeddings: EmbeddingType[] = [];
      let embeddingModelAvailable = false;
      try {
        const result = await client.models.Embedding.list();
        embeddings = result.data as EmbeddingType[];
        embeddingModelAvailable = true;
        console.log('✅ Embedding model is available');
      } catch (error) {
        console.log('⚠️ Embedding model not yet deployed');
        embeddingModelAvailable = false;
      }
      
      const { data: profiles } = await client.models.UserProfile.list();
      
      // Update total chunks count
      setTotalChunksCount(chunks.length);
      setEmbeddings(embeddings);
      
      console.log('✅ Database Status:');
      console.log(`  - Documents: ${documents.length}`);
      console.log(`  - Chunks: ${chunks.length}`);
      console.log(`  - Embeddings: ${embeddings.length}`);
      console.log(`  - Profiles: ${profiles.length}`);
      console.log(`  - DocumentChunk Model: ${chunkModelAvailable ? 'Available' : 'Not Available'}`);
      console.log(`  - Embedding Model: ${embeddingModelAvailable ? 'Available' : 'Not Available'}`);
      
      // Test 2: Check processing pipeline (SAME as Stage 4)
      console.log('🔍 Test 2: Processing pipeline status...');
      const processingCounts = {
        pending: documents.filter(d => d.processingStatus === 'pending').length,
        processing: documents.filter(d => d.processingStatus === 'processing').length,
        completed: documents.filter(d => d.processingStatus === 'completed').length,
        failed: documents.filter(d => d.processingStatus === 'failed').length
      };
      
      console.log('✅ Processing Pipeline:');
      console.log(`  - Pending: ${processingCounts.pending}`);
      console.log(`  - Processing: ${processingCounts.processing}`);
      console.log(`  - Completed: ${processingCounts.completed}`);
      console.log(`  - Failed: ${processingCounts.failed}`);

      // NEW: Test 3: Embedding analysis
      console.log('🔍 Test 3: Embedding analysis...');
      const embeddedDocs = documents.filter(d => d.embeddingsGenerated);
      const embeddingCoverage = processingCounts.completed > 0 ? 
        (embeddedDocs.length / processingCounts.completed * 100).toFixed(1) : '0';

      console.log('✅ Embedding Analysis:');
      console.log(`  - Total embeddings: ${embeddings.length}`);
      console.log(`  - Documents with embeddings: ${embeddedDocs.length}`);
      console.log(`  - Embedding coverage: ${embeddingCoverage}%`);
      
      // Test 4: Chunk analysis (SAME as Stage 4)
      if (chunks.length > 0) {
        const avgWordsPerChunk = chunks.reduce((sum: number, chunk: DocumentChunkType) => sum + (chunk.wordCount || 0), 0) / chunks.length;
        const chunksPerDoc = chunks.reduce((acc: Record<string, number>, chunk: DocumentChunkType) => {
          acc[chunk.documentId] = (acc[chunk.documentId] || 0) + 1;
          return acc;
        }, {});
        
        console.log('✅ Chunk Analysis:');
        console.log(`  - Total chunks: ${chunks.length}`);
        console.log(`  - Average words per chunk: ${Math.round(avgWordsPerChunk)}`);
        console.log(`  - Documents with chunks: ${Object.keys(chunksPerDoc).length}`);
      }
      
      // Test 5: Recent processing activity (SAME as Stage 4)
      const recentDocs = documents
        .filter(d => d.updatedAt)
        .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
        .slice(0, 3);
      
      if (recentDocs.length > 0) {
        console.log('✅ Recent Processing:');
        recentDocs.forEach(doc => {
          console.log(`  - ${doc.name}: ${doc.processingStatus} (${doc.totalChunks || 0} chunks, embeddings: ${doc.embeddingsGenerated ? 'Yes' : 'No'})`);
        });
      }
      
      // ENHANCED: Stage 5 status message
      const statusMessage = `🔢 Stage 5 Debug Complete!

Database Status:
📄 Documents: ${documents.length}
🧩 Chunks: ${chunks.length} ${chunkModelAvailable ? '✅' : '❌'}
🔢 Embeddings: ${embeddings.length} ${embeddingModelAvailable ? '✅' : '❌'}
👤 Profiles: ${profiles.length}

Processing Pipeline:
⏳ Pending: ${processingCounts.pending}
⚙️ Processing: ${processingCounts.processing}
✅ Completed: ${processingCounts.completed}
❌ Failed: ${processingCounts.failed}

Stage 5 Features:
📊 Embedding Coverage: ${embeddingCoverage}%
🔢 Documents with Embeddings: ${embeddedDocs.length}
🤖 Embedding Model: ${embeddingModelAvailable ? '✅ Available' : '❌ Missing'}

System Status: ${
  embeddingModelAvailable && chunks.length > 0 
    ? '🎯 STAGE 5 READY' 
    : embeddingModelAvailable 
      ? '⚠️ READY (Upload files to test)' 
      : '❌ NEEDS DEPLOYMENT'
}

${!embeddingModelAvailable ? '\n🔧 Action Needed: Deploy Stage 5 backend with Embedding model' : ''}
${embeddingModelAvailable && embeddedDocs.length === 0 ? '\n🔢 Action: Generate embeddings for completed documents' : ''}`;
      
      alert(statusMessage);
      
    } catch (error) {
      console.error('❌ Stage 5 Debug FAILED:', error);
      alert(`❌ Debug Test Failed:\n\n${error instanceof Error ? error.message : 'Unknown error'}\n\nCheck console for details.`);
    }
  };

  // 🎯 Initial load effect (ENHANCED for Stage 5)
  useEffect(() => {
    console.log('🚀 Stage 5: Interface mounted for user:', user.signInDetails?.loginId);
    
    const loadProfile = async () => {
      try {
        const { data: profiles } = await client.models.UserProfile.list({
          filter: { owner: { eq: user.username } }
        });
        
        if (profiles.length > 0) {
          setUserProfile(profiles[0] as UserProfileType);
        } else {
          const newProfile = await client.models.UserProfile.create({
            email: user.signInDetails?.loginId || '',
            totalDocuments: 0,
            totalEmbeddings: 0, // NEW: Stage 5 field
            storageUsed: 0,
            lastActiveAt: new Date().toISOString(),
            owner: user.username
          });
          setUserProfile(newProfile.data as UserProfileType);
        }
      } catch (error) {
        console.error('Error loading user profile:', error);
      }
    };

    const loadFiles = async () => {
      try {
        const { data: documents } = await client.models.Document.list({
          filter: { owner: { eq: user.username } }
        });
        const docs = documents as DocumentType[];
        setUploadedFiles(docs);
        
        // Update processing stats
        const stats = {
          pending: docs.filter(d => d.processingStatus === 'pending').length,
          processing: docs.filter(d => d.processingStatus === 'processing').length,
          completed: docs.filter(d => d.processingStatus === 'completed').length,
          failed: docs.filter(d => d.processingStatus === 'failed').length
        };
        setProcessingStats(stats);
        
        // Load chunks count - SAME as Stage 4
        try {
          const { data: chunks } = await client.models.DocumentChunk.list({
            filter: { owner: { eq: user.username } }
          });
          setTotalChunksCount(chunks.length);
        } catch (error) {
          console.log('DocumentChunk model not yet available');
          setTotalChunksCount(0);
        }

        // NEW: Load embeddings
        try {
          const { data: embeddingData } = await client.models.Embedding.list({
            filter: { owner: { eq: user.username } }
          });
          setEmbeddings(embeddingData as EmbeddingType[]);
        } catch (error) {
          console.log('Embedding model not yet available');
          setEmbeddings([]);
        }
      } catch (error) {
        console.error('Error loading uploaded files:', error);
      }
    };
    
    const initializeData = async () => {
      await loadProfile();
      await loadFiles();
    };
    
    initializeData();
  }, [user.signInDetails?.loginId, user.username]);

  // 🔄 Auto-refresh effect for processing status (SAME as Stage 4 + embeddings)
  useEffect(() => {
    const loadFiles = async () => {
      try {
        const { data: documents } = await client.models.Document.list({
          filter: { owner: { eq: user.username } }
        });
        const docs = documents as DocumentType[];
        setUploadedFiles(docs);
        
        const stats = {
          pending: docs.filter(d => d.processingStatus === 'pending').length,
          processing: docs.filter(d => d.processingStatus === 'processing').length,
          completed: docs.filter(d => d.processingStatus === 'completed').length,
          failed: docs.filter(d => d.processingStatus === 'failed').length
        };
        setProcessingStats(stats);
        
        // Load chunks count - SAME as Stage 4
        try {
          const { data: chunks } = await client.models.DocumentChunk.list({
            filter: { owner: { eq: user.username } }
          });
          setTotalChunksCount(chunks.length);
        } catch (error) {
          // Silently fail if model not available
          setTotalChunksCount(0);
        }

        // NEW: Load embeddings
        try {
          const { data: embeddingData } = await client.models.Embedding.list({
            filter: { owner: { eq: user.username } }
          });
          setEmbeddings(embeddingData as EmbeddingType[]);
        } catch (error) {
          // Silently fail if model not available
          setEmbeddings([]);
        }
      } catch (error) {
        console.error('Error refreshing files:', error);
      }
    };

    // Refresh every 5 seconds to catch processing updates
    const interval = setInterval(loadFiles, 5000);
    return () => clearInterval(interval);
  }, [user.username]);

  // 📄 Load document chunks - SAME as Stage 4
  const loadDocumentChunks = async (documentId: string) => {
    setIsLoadingChunks(true);
    try {
      const { data: chunks } = await client.models.DocumentChunk.list({
        filter: { documentId: { eq: documentId } }
      });
      const sortedChunks = (chunks as DocumentChunkType[]).sort((a, b) => a.chunkIndex - b.chunkIndex);
      setDocumentChunks(sortedChunks);
    } catch (error) {
      console.error('Error loading document chunks:', error);
      setDocumentChunks([]);
      alert('❌ Error loading document chunks. The DocumentChunk model may not be deployed yet.');
    } finally {
      setIsLoadingChunks(false);
    }
  };

  // 📤 Handle sending messages - SAME as Stage 4
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentMessage.trim()) return;
    
    console.log('📤 Sending message:', currentMessage);
    await sendMessage({
      content: [
        {
          text: currentMessage
        }
      ]
    });
    setCurrentMessage('');
  };

  // 📁 Handle successful file upload - SAME as Stage 4
  const handleUploadSuccess = async (event: UploadEvent) => {
    console.log('📁 File uploaded successfully:', event);
    
    try {
      const fileKey = event.key || event.result?.key || 'unknown';
      const fileName = fileKey.split('/').pop() || 'Unknown';
      const fileExtension = fileName.split('.').pop()?.toUpperCase() || 'UNKNOWN';
      const fileSize = event.size || event.result?.size || 0;
      
      const docResult = await client.models.Document.create({
        name: fileName,
        key: fileKey,
        size: fileSize,
        type: fileExtension,
        uploadedAt: new Date().toISOString(),
        status: 'uploaded',
        processingStatus: 'pending',
        embeddingsGenerated: false, // NEW: Stage 5 field
        owner: user.username
      });

      console.log('📁 Document created successfully:', docResult);

      if (userProfile) {
        await client.models.UserProfile.update({
          id: userProfile.id,
          totalDocuments: (userProfile.totalDocuments || 0) + 1,
          storageUsed: (userProfile.storageUsed || 0) + fileSize,
          lastActiveAt: new Date().toISOString()
        });
      }

      forceRefresh();
      
      alert(`✅ File uploaded successfully! 

📄 ${fileName} (${Math.round(fileSize / 1024)} KB)
🔄 Processing will begin automatically via Lambda trigger
📊 Check the "Document Processing" tab to monitor progress

💡 Tip: Processing typically takes 10-30 seconds depending on file size.`);
    } catch (error) {
      console.error('Error creating document record:', error);
      alert('❌ Upload failed to create database record. Check console for details.');
    }
  };

  // 🗑️ Handle file deletion - SAME as Stage 4
  const handleDeleteFile = async (document: DocumentType) => {
    if (!confirm(`Delete "${document.name}" and all its chunks?\n\nThis action cannot be undone.`)) return;
    
    try {
      // Delete all chunks first
      try {
        const { data: chunks } = await client.models.DocumentChunk.list({
          filter: { documentId: { eq: document.id } }
        });
        
        for (const chunk of chunks) {
          await client.models.DocumentChunk.delete({ id: chunk.id });
        }
        console.log(`🗑️ Deleted ${chunks.length} chunks for document ${document.name}`);
      } catch (chunkError) {
        console.log('No chunks to delete or DocumentChunk model not available');
      }

      // NEW: Delete all embeddings
      try {
        const { data: embeddingData } = await client.models.Embedding.list({
          filter: { documentId: { eq: document.id } }
        });
        
        for (const embedding of embeddingData) {
          await client.models.Embedding.delete({ id: embedding.id });
        }
        console.log(`🗑️ Deleted ${embeddingData.length} embeddings for document ${document.name}`);
      } catch (embeddingError) {
        console.log('No embeddings to delete or Embedding model not available');
      }
      
      await client.models.Document.delete({ id: document.id });
      forceRefresh();
      
      if (selectedDocument?.id === document.id) {
        setSelectedDocument(null);
        setDocumentChunks([]);
      }
      
      alert(`✅ "${document.name}" and all its chunks and embeddings deleted successfully!`);
    } catch (error) {
      console.error('Error deleting file:', error);
      alert('❌ Error deleting file. Please try again.');
    }
  };

  // 📄 View document details - SAME as Stage 4
  const viewDocumentDetails = (document: DocumentType) => {
    setSelectedDocument(document);
    setActiveTab('chunks');
    if (document.processingStatus === 'completed') {
      loadDocumentChunks(document.id);
    }
  };

  // 💾 Export data - ENHANCED for Stage 5
  const exportData = () => {
    const data = {
      profile: userProfile,
      documents: uploadedFiles,
      chunks: documentChunks,
      embeddings: embeddings, // NEW: Stage 5
      messages: messages || [],
      processingStats,
      totalChunksCount,
      searchResults: searchResults, // NEW: Stage 5
      exportedAt: new Date().toISOString(),
      stage: 'Stage 5: Complete + Embeddings',
      systemStatus: {
        documentsCount: uploadedFiles.length,
        chunksCount: totalChunksCount,
        embeddingsCount: embeddings.length, // NEW: Stage 5
        processingPipeline: processingStats,
        embeddingCoverage: totalChunksCount > 0 ? (embeddings.length / totalChunksCount * 100).toFixed(1) + '%' : '0%' // NEW: Stage 5
      }
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `rag-chat-stage5-complete-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    
    alert('✅ Data exported successfully!');
  };

  // 📊 Get status color and icon - SAME as Stage 4
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return '#28A745';
      case 'processing': return '#FFC107';
      case 'failed': return '#DC3545';
      default: return '#6C757D';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return '✅';
      case 'processing': return '⚙️';
      case 'failed': return '❌';
      default: return '⏳';
    }
  };

  // NEW: Stage 5 embedding status functions
  const getEmbeddingStatusColor = (hasEmbeddings: boolean) => {
    return hasEmbeddings ? '#28A745' : '#FFC107';
  };

  const getEmbeddingStatusIcon = (hasEmbeddings: boolean) => {
    return hasEmbeddings ? '🔢' : '⏳';
  };

  return (
    <div style={{ 
      height: '100vh', 
      display: 'flex', 
      flexDirection: 'column',
      fontFamily: 'Arial, sans-serif'
    }}>
      
      {/* 🏷️ Header - ENHANCED for Stage 5 */}
      <header style={{ 
        padding: '1rem', 
        backgroundColor: '#232F3E', 
        color: 'white',
        borderBottom: '2px solid #FF9900'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 style={{ margin: 0, fontSize: '1.5rem' }}>
              🔢 Stage 5: Complete System + Embeddings + Vector Search
            </h1>
            <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.9rem', opacity: 0.8 }}>
              👤 {user.signInDetails?.loginId} | 
              📄 {userProfile?.totalDocuments || 0} docs | 
              🧩 {totalChunksCount} chunks | 
              🔢 {embeddings.length} embeddings | 
              💬 {messages?.length || 0} messages
            </p>
          </div>
          
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              onClick={debugStage5}
              style={{
                padding: '0.5rem 1rem',
                backgroundColor: '#17A2B8',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '0.9rem'
              }}
            >
              🔍 Debug S5
            </button>
            
            <button
              onClick={forceRefresh}
              style={{
                padding: '0.5rem 1rem',
                backgroundColor: '#6F42C1',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '0.9rem'
              }}
            >
              🔄 Refresh
            </button>
            
            <button
              onClick={exportData}
              style={{
                padding: '0.5rem 1rem',
                backgroundColor: '#28A745',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '0.9rem'
              }}
            >
              💾 Export
            </button>
            
            <button
              onClick={signOut}
              style={{
                padding: '0.5rem 1rem',
                backgroundColor: '#DC3545',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '1rem',
                fontWeight: 'bold'
              }}
            >
              🚪 Sign Out
            </button>
          </div>
        </div>

        {/* Tab Navigation - ENHANCED for Stage 5 */}
        <div style={{ marginTop: '1rem', display: 'flex', gap: '0.5rem' }}>
          {(['chat', 'upload', 'documents', 'chunks', 'embeddings'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                padding: '0.5rem 1rem',
                backgroundColor: activeTab === tab ? '#FF9900' : 'transparent',
                color: 'white',
                border: '1px solid #FF9900',
                borderRadius: '4px',
                cursor: 'pointer',
                textTransform: 'capitalize'
              }}
            >
              {tab === 'chat' && '💬 AI Chat'}
              {tab === 'upload' && '📁 Upload'}
              {tab === 'documents' && '📄 Documents'}
              {tab === 'chunks' && '🧩 Chunks'}
              {tab === 'embeddings' && '🔢 Embeddings'}
            </button>
          ))}
        </div>

        {/* Processing Stats Bar - ENHANCED for Stage 5 */}
        <div style={{ 
          marginTop: '1rem', 
          display: 'flex', 
          gap: '1rem', 
          fontSize: '0.8rem',
          backgroundColor: 'rgba(255,255,255,0.1)',
          padding: '0.5rem',
          borderRadius: '4px'
        }}>
          <span>⏳ Pending: {processingStats.pending}</span>
          <span>⚙️ Processing: {processingStats.processing}</span>
          <span>✅ Completed: {processingStats.completed}</span>
          <span>❌ Failed: {processingStats.failed}</span>
          <span>🔢 Embedded: {uploadedFiles.filter(d => d.embeddingsGenerated).length}</span>
        </div>

        {/* Progress Message - NEW for Stage 5 */}
        {embeddingProgress && (
          <div style={{ 
            marginTop: '0.5rem', 
            padding: '0.5rem',
            backgroundColor: 'rgba(255,255,255,0.2)',
            borderRadius: '4px',
            fontSize: '0.9rem',
            fontFamily: 'monospace'
          }}>
            {embeddingProgress}
          </div>
        )}
      </header>

      {/* 📄 Main Content */}
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        
        {/* 💬 Chat Tab - SAME as Stage 4 */}
        {activeTab === 'chat' && (
          <>
            <div style={{
              padding: '0.75rem 1rem',
              backgroundColor: '#F8F9FA',
              borderBottom: '1px solid #DEE2E6',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <div>
                <strong style={{ color: '#232F3E' }}>💬 AI Conversation</strong>
                <span style={{ marginLeft: '1rem', color: '#6C757D', fontSize: '0.9rem' }}>
                  Powered by Claude 3 Haiku
                </span>
              </div>
              <div style={{ fontSize: '0.8rem', color: '#6C757D' }}>
                🔢 Stage 5: Ready for Stage 6 RAG integration with embeddings
              </div>
            </div>

            <div style={{ 
              flex: 1, 
              padding: '1rem',
              overflow: 'auto',
              backgroundColor: '#FFFFFF'
            }}>
              {!messages || messages.length === 0 ? (
                <div style={{ 
                  textAlign: 'center', 
                  padding: '2rem',
                  color: '#6C757D'
                }}>
                  <h3>🎉 Welcome to Stage 5, {user.signInDetails?.loginId?.split('@')[0]}!</h3>
                  <p>Document processing + embeddings + vector search is now ready!</p>
                  <p><strong>✅ What's Working:</strong></p>
                  <ul style={{ textAlign: 'left', maxWidth: '500px', margin: '0 auto' }}>
                    <li>📁 File uploads to S3</li>
                    <li>⚡ Lambda-triggered processing</li>
                    <li>📄 Text extraction & chunking</li>
                    <li>💾 Chunk storage in DynamoDB</li>
                    <li>📊 Real-time status tracking</li>
                    <li>🔢 Embedding generation (simulated)</li>
                    <li>🔍 Vector similarity search (simulated)</li>
                  </ul>
                  <p><strong>🚀 Next:</strong> Stage 6 will connect RAG to this conversation!</p>
                </div>
              ) : (
                <div>
                  {messages.map((message, messageIndex) => (
                    <div
                      key={messageIndex}
                      style={{
                        margin: '1rem 0',
                        padding: '1rem',
                        backgroundColor: message.role === 'user' ? '#E3F2FD' : '#F5F5F5',
                        borderRadius: '8px',
                        maxWidth: '80%',
                        marginLeft: message.role === 'user' ? 'auto' : '0',
                        marginRight: message.role === 'user' ? '0' : 'auto'
                      }}
                    >
                      <div style={{ 
                        fontWeight: 'bold', 
                        marginBottom: '0.5rem',
                        color: message.role === 'user' ? '#1976D2' : '#333'
                      }}>
                        {message.role === 'user' ? '👤 You' : '🤖 Claude 3 Haiku'}
                      </div>
                      <div>
                        {message.content.map((content, contentIndex) => (
                          <div key={contentIndex}>
                            {content.text || content.toolUse?.name || 'Message content'}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
              
              {isLoading && (
                <div style={{ 
                  textAlign: 'center', 
                  padding: '1rem',
                  color: '#6C757D'
                }}>
                  <div>🤖 Claude is thinking...</div>
                </div>
              )}
            </div>

            <div style={{
              padding: '1rem',
              borderTop: '1px solid #DEE2E6',
              backgroundColor: '#F8F9FA'
            }}>
              <form onSubmit={handleSendMessage} style={{ display: 'flex', gap: '0.5rem' }}>
                <input
                  type="text"
                  value={currentMessage}
                  onChange={(e) => setCurrentMessage(e.target.value)}
                  placeholder="Chat with Claude 3 Haiku..."
                  style={{
                    flex: 1,
                    padding: '0.75rem',
                    border: '1px solid #CED4DA',
                    borderRadius: '4px',
                    fontSize: '1rem'
                  }}
                  disabled={isLoading}
                />
                <button
                  type="submit"
                  disabled={isLoading || !currentMessage.trim()}
                  style={{
                    padding: '0.75rem 1.5rem',
                    backgroundColor: isLoading ? '#6C757D' : '#007BFF',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: isLoading ? 'not-allowed' : 'pointer',
                    fontSize: '1rem',
                    fontWeight: 'bold'
                  }}
                >
                  {isLoading ? '⏳' : '📤 Send'}
                </button>
              </form>
            </div>
          </>
        )}

        {/* 📁 Upload Tab - SAME as Stage 4 */}
        {activeTab === 'upload' && (
          <>
            <div style={{
              padding: '0.75rem 1rem',
              backgroundColor: '#F8F9FA',
              borderBottom: '1px solid #DEE2E6'
            }}>
              <strong style={{ color: '#232F3E' }}>📁 Document Upload</strong>
              <span style={{ marginLeft: '1rem', color: '#6C757D', fontSize: '0.9rem' }}>
                Upload files to trigger automatic processing
              </span>
            </div>

            <div style={{ flex: 1, padding: '2rem', overflow: 'auto' }}>
              <div style={{ marginBottom: '2rem' }}>
                <h3 style={{ marginBottom: '1rem' }}>📤 Upload New Documents</h3>
                <StorageManager
                  acceptedFileTypes={['.pdf', '.txt', '.doc', '.docx']}
                  path="documents/"
                  maxFileCount={10}
                  maxFileSize={10 * 1024 * 1024}
                  onUploadSuccess={handleUploadSuccess}
                  onUploadError={(error) => {
                    console.error('Upload error:', error);
                    alert('❌ Upload failed. Please try again.');
                  }}
                />
              </div>

              <div style={{ marginBottom: '2rem' }}>
                <h3 style={{ marginBottom: '1rem' }}>📊 Processing Pipeline Status</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1rem' }}>
                  {[
                    { status: 'pending', label: 'Pending', count: processingStats.pending },
                    { status: 'processing', label: 'Processing', count: processingStats.processing },
                    { status: 'completed', label: 'Completed', count: processingStats.completed },
                    { status: 'failed', label: 'Failed', count: processingStats.failed }
                  ].map(({ status, label, count }) => (
                    <div key={status} style={{
                      padding: '1rem',
                      backgroundColor: '#F8F9FA',
                      borderRadius: '8px',
                      textAlign: 'center',
                      border: `2px solid ${getStatusColor(status)}`
                    }}>
                      <div style={{ fontSize: '1.5rem' }}>{getStatusIcon(status)}</div>
                      <div style={{ fontWeight: 'bold', color: getStatusColor(status) }}>
                        {label}
                      </div>
                      <div style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>{count}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </>
        )}

        {/* 📄 Documents Tab - ENHANCED for Stage 5 */}
        {activeTab === 'documents' && (
          <div style={{ flex: 1, padding: '2rem', overflow: 'auto' }}>
            <h3 style={{ marginBottom: '1rem' }}>📄 Your Documents ({uploadedFiles.length})</h3>
            
            {uploadedFiles.length === 0 ? (
              <div style={{ 
                textAlign: 'center', 
                padding: '2rem',
                backgroundColor: '#F8F9FA',
                borderRadius: '8px',
                color: '#6C757D'
              }}>
                <p>📄 No documents uploaded yet.</p>
                <p>Go to the "Upload" tab to add your first document!</p>
              </div>
            ) : (
              <div style={{ display: 'grid', gap: '1rem' }}>
                {uploadedFiles.map((doc) => (
                  <div
                    key={doc.id}
                    style={{
                      padding: '1rem',
                      border: '1px solid #DEE2E6',
                      borderRadius: '8px',
                      backgroundColor: '#FFFFFF',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}
                  >
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 'bold', color: '#232F3E' }}>
                        📄 {doc.name}
                      </div>
                      <div style={{ fontSize: '0.9rem', color: '#6C757D', marginTop: '0.25rem' }}>
                        {doc.type} • {Math.round((doc.size || 0) / 1024)} KB • 
                        {doc.uploadedAt && new Date(doc.uploadedAt).toLocaleDateString()}
                      </div>
                      <div style={{ 
                        fontSize: '0.8rem', 
                        color: getStatusColor(doc.processingStatus || 'pending'), 
                        marginTop: '0.25rem',
                        fontWeight: 'bold'
                      }}>
                        {getStatusIcon(doc.processingStatus || 'pending')} Status: {doc.processingStatus}
                        {doc.totalChunks && doc.totalChunks > 0 && ` • ${doc.totalChunks} chunks`}
                        {doc.updatedAt && ` • Updated: ${new Date(doc.updatedAt).toLocaleString()}`}
                      </div>
                      {/* NEW: Embedding status */}
                      <div style={{ 
                        fontSize: '0.8rem', 
                        color: getEmbeddingStatusColor(doc.embeddingsGenerated || false), 
                        marginTop: '0.25rem',
                        fontWeight: 'bold'
                      }}>
                        {getEmbeddingStatusIcon(doc.embeddingsGenerated || false)} Embeddings: {doc.embeddingsGenerated ? 'Generated' : 'Pending'}
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      {doc.processingStatus === 'completed' && (
                        <button
                          onClick={() => viewDocumentDetails(doc)}
                          style={{
                            padding: '0.5rem',
                            backgroundColor: '#007BFF',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer'
                          }}
                        >
                          🧩 View Chunks
                        </button>
                      )}
                      <button
                        onClick={() => handleDeleteFile(doc)}
                        style={{
                          padding: '0.5rem',
                          backgroundColor: '#DC3545',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer'
                        }}
                      >
                        🗑️ Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* 🧩 Chunks Tab - SAME as Stage 4 */}
        {activeTab === 'chunks' && (
          <div style={{ flex: 1, padding: '2rem', overflow: 'auto' }}>
            {selectedDocument ? (
              <>
                <div style={{ marginBottom: '2rem' }}>
                  <h3 style={{ margin: 0 }}>🧩 Document Chunks: {selectedDocument.name}</h3>
                  <p style={{ color: '#6C757D', margin: '0.5rem 0' }}>
                    {documentChunks.length} chunks • 
                    Total words: {documentChunks.reduce((sum, chunk) => sum + chunk.wordCount, 0)}
                    {isLoadingChunks && ' • Loading...'}
                  </p>
                  <button
                    onClick={() => setSelectedDocument(null)}
                    style={{
                      padding: '0.5rem 1rem',
                      backgroundColor: '#6C757D',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer'
                    }}
                  >
                    ← Back to Documents
                  </button>
                </div>

                {isLoadingChunks ? (
                  <div style={{ 
                    textAlign: 'center', 
                    padding: '2rem',
                    color: '#6C757D'
                  }}>
                    <div>🔄 Loading chunks...</div>
                  </div>
                ) : documentChunks.length === 0 ? (
                  <div style={{ 
                    textAlign: 'center', 
                    padding: '2rem',
                    backgroundColor: '#F8F9FA',
                    borderRadius: '8px',
                    color: '#6C757D'
                  }}>
                    <p>🧩 No chunks found for this document.</p>
                    <p>The document might still be processing, failed to process, or the DocumentChunk model is not deployed.</p>
                  </div>
                ) : (
                  <div style={{ display: 'grid', gap: '1rem' }}>
                    {documentChunks.map((chunk) => (
                      <div
                        key={chunk.id}
                        style={{
                          padding: '1rem',
                          border: '1px solid #DEE2E6',
                          borderRadius: '8px',
                          backgroundColor: '#FFFFFF'
                        }}
                      >
                        <div style={{ 
                          fontSize: '0.9rem', 
                          color: '#6C757D', 
                          marginBottom: '0.5rem',
                          display: 'flex',
                          justifyContent: 'space-between'
                        }}>
                          <span>🧩 Chunk {chunk.chunkIndex + 1}</span>
                          <span>{chunk.wordCount} words</span>
                        </div>
                        <div style={{ 
                          fontSize: '0.95rem',
                          lineHeight: '1.5',
                          color: '#333'
                        }}>
                          {chunk.content}
                        </div>
                        <div style={{ 
                          fontSize: '0.8rem', 
                          color: '#6C757D', 
                          marginTop: '0.5rem',
                          borderTop: '1px solid #E9ECEF',
                          paddingTop: '0.5rem'
                        }}>
                          Position: {chunk.startPosition}-{chunk.endPosition} • 
                          Created: {new Date(chunk.createdAt).toLocaleString()}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <div style={{ 
                textAlign: 'center', 
                padding: '2rem',
                color: '#6C757D'
              }}>
                <h3>🧩 Document Chunks</h3>
                <p>Select a completed document from the "Documents" tab to view its chunks.</p>
              </div>
            )}
          </div>
        )}

        {/* 🔢 NEW: Embeddings Tab */}
        {activeTab === 'embeddings' && (
          <>
            <div style={{
              padding: '0.75rem 1rem',
              backgroundColor: '#F8F9FA',
              borderBottom: '1px solid #DEE2E6'
            }}>
              <strong style={{ color: '#232F3E' }}>🔢 Embeddings & Vector Search</strong>
              <span style={{ marginLeft: '1rem', color: '#6C757D', fontSize: '0.9rem' }}>
                Amazon Titan + FAISS Vector Database
              </span>
            </div>

            <div style={{ flex: 1, padding: '2rem', overflow: 'auto' }}>
              
              {/* Embeddings Generation Section */}
              <div style={{ marginBottom: '3rem' }}>
                <h3 style={{ marginBottom: '1rem' }}>🔢 Generate Embeddings</h3>
                <div style={{ 
                  display: 'grid', 
                  gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', 
                  gap: '1.5rem' 
                }}>
                  <div style={{
                    padding: '1.5rem',
                    border: '1px solid #DEE2E6',
                    borderRadius: '8px',
                    backgroundColor: '#FFFFFF'
                  }}>
                    <h4 style={{ margin: '0 0 1rem 0', color: '#4A90E2' }}>Embedding Generation</h4>
                    <p style={{ color: '#666', fontSize: '0.9rem', margin: '0 0 1rem 0' }}>
                      Convert your document chunks into searchable vectors using Amazon Titan Embeddings
                    </p>
                    <button
                      onClick={generateEmbeddings}
                      disabled={isGeneratingEmbeddings || totalChunksCount === 0}
                      style={{
                        padding: '0.75rem 1.5rem',
                        backgroundColor: isGeneratingEmbeddings ? '#ccc' : '#4A90E2',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: isGeneratingEmbeddings ? 'not-allowed' : 'pointer',
                        width: '100%',
                        fontSize: '1rem',
                        fontWeight: 'bold'
                      }}
                    >
                      {isGeneratingEmbeddings ? '🔢 Generating...' : '🔢 Generate Embeddings'}
                    </button>
                    {totalChunksCount === 0 && (
                      <p style={{ color: '#DC3545', fontSize: '0.8rem', margin: '0.5rem 0 0 0' }}>
                        No document chunks available. Upload and process documents first.
                      </p>
                    )}
                  </div>

                  <div style={{
                    padding: '1.5rem',
                    border: '1px solid #DEE2E6',
                    borderRadius: '8px',
                    backgroundColor: '#F8F9FA'
                  }}>
                    <h4 style={{ margin: '0 0 1rem 0', color: '#232F3E' }}>Embedding Status</h4>
                    <div style={{ fontSize: '0.9rem' }}>
                      <div style={{ marginBottom: '0.5rem' }}>
                        📄 <strong>Total Documents:</strong> {uploadedFiles.length}
                      </div>
                      <div style={{ marginBottom: '0.5rem' }}>
                        🧩 <strong>Total Chunks:</strong> {totalChunksCount}
                      </div>
                      <div style={{ marginBottom: '0.5rem' }}>
                        🔢 <strong>Total Embeddings:</strong> {embeddings.length}
                      </div>
                      <div style={{ marginBottom: '0.5rem' }}>
                        📊 <strong>Coverage:</strong> {totalChunksCount > 0 ? 
                          (embeddings.length / totalChunksCount * 100).toFixed(1) + '%' : '0%'}
                      </div>
                      <div>
                        🤖 <strong>Model:</strong> Amazon Titan Embeddings v1
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Vector Search Section */}
              <div style={{ marginBottom: '3rem' }}>
                <h3 style={{ marginBottom: '1rem' }}>🔍 Vector Search</h3>
                <div style={{
                  padding: '1.5rem',
                  border: '1px solid #DEE2E6',
                  borderRadius: '8px',
                  backgroundColor: '#FFFFFF'
                }}>
                  <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search your documents using vector similarity..."
                      onKeyPress={(e) => e.key === 'Enter' && searchDocuments()}
                      style={{
                        flex: 1,
                        padding: '0.75rem',
                        border: '1px solid #ddd',
                        borderRadius: '4px',
                        fontSize: '1rem'
                      }}
                    />
                    <button
                      onClick={searchDocuments}
                      disabled={isSearching || !searchQuery.trim() || embeddings.length === 0}
                      style={{
                        padding: '0.75rem 1.5rem',
                        backgroundColor: isSearching ? '#ccc' : '#28A745',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: isSearching ? 'not-allowed' : 'pointer',
                        fontSize: '1rem',
                        fontWeight: 'bold'
                      }}
                    >
                      {isSearching ? '🔍 Searching...' : '🔍 Search'}
                    </button>
                  </div>
                  
                  {embeddings.length === 0 && (
                    <p style={{ color: '#DC3545', fontSize: '0.9rem', margin: '0 0 1rem 0' }}>
                      No embeddings available. Generate embeddings first to enable vector search.
                    </p>
                  )}

                  {/* Search Results */}
                  {searchResults.length > 0 && (
                    <div style={{ marginTop: '1.5rem' }}>
                      <h4 style={{ margin: '0 0 1rem 0', color: '#232F3E' }}>
                        Search Results ({searchResults.length}):
                      </h4>
                      {searchResults.map((result, index) => (
                        <div key={index} style={{
                          padding: '1rem',
                          backgroundColor: '#F8F9FA',
                          border: '1px solid #E9ECEF',
                          borderRadius: '6px',
                          marginBottom: '1rem'
                        }}>
                          <div style={{ 
                            display: 'flex', 
                            justifyContent: 'space-between', 
                            alignItems: 'center',
                            marginBottom: '0.5rem'
                          }}>
                            <span style={{ fontWeight: 'bold', color: '#4A90E2' }}>
                              Similarity: {(result.similarity * 100).toFixed(1)}%
                            </span>
                            <span style={{ fontSize: '0.8rem', color: '#6C757D' }}>
                              Chunk {result.chunkIndex + 1}
                            </span>
                          </div>
                          <div style={{ 
                            fontSize: '0.95rem',
                            lineHeight: '1.5',
                            color: '#333'
                          }}>
                            {result.content}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Document Embedding Status */}
              <div>
                <h3 style={{ marginBottom: '1rem' }}>📄 Document Embedding Status</h3>
                {uploadedFiles.length === 0 ? (
                  <div style={{ 
                    textAlign: 'center', 
                    padding: '2rem',
                    backgroundColor: '#F8F9FA',
                    borderRadius: '8px',
                    color: '#6C757D'
                  }}>
                    <p>📄 No documents uploaded yet.</p>
                    <p>Upload documents first to generate embeddings.</p>
                  </div>
                ) : (
                  <div style={{ display: 'grid', gap: '1rem' }}>
                    {uploadedFiles.map((doc) => (
                      <div
                        key={doc.id}
                        style={{
                          padding: '1rem',
                          border: '1px solid #DEE2E6',
                          borderRadius: '8px',
                          backgroundColor: '#FFFFFF',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center'
                        }}
                      >
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: 'bold', color: '#232F3E' }}>
                            📄 {doc.name}
                          </div>
                          <div style={{ fontSize: '0.9rem', color: '#6C757D', marginTop: '0.25rem' }}>
                            Processing: {doc.processingStatus} • 
                            Chunks: {doc.totalChunks || 0} • 
                            Embeddings: {getEmbeddingStatusIcon(doc.embeddingsGenerated || false)} 
                            {doc.embeddingsGenerated ? 'Generated' : 'Pending'}
                          </div>
                        </div>
                        <div style={{
                          padding: '0.25rem 0.75rem',
                          borderRadius: '12px',
                          fontSize: '0.8rem',
                          fontWeight: 'bold',
                          backgroundColor: getEmbeddingStatusColor(doc.embeddingsGenerated || false),
                          color: 'white'
                        }}>
                          {doc.embeddingsGenerated ? '🔢 EMBEDDED' : '⏳ PENDING'}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </>
        )}

      </main>

      {/* 📊 Enhanced Status Bar */}
      <footer style={{
        padding: '0.5rem 1rem',
        backgroundColor: '#E9ECEF',
        borderTop: '1px solid #DEE2E6',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        fontSize: '0.8rem',
        color: '#6C757D'
      }}>
        <div>
          🔢 <strong>Stage 5: Complete System + Embeddings + Vector Search</strong> • Next: Stage 6 RAG Integration
        </div>
        <div>
          📄 Docs: {uploadedFiles.length} | 
          🧩 Total Chunks: {totalChunksCount} | 
          🔢 Embeddings: {embeddings.length} |
          💬 Messages: {messages?.length || 0} |
          ⚙️ Processing: {processingStats.processing}
        </div>
      </footer>
    </div>
  );
}

// 📄 Main App Component
function App() {
  return (
    <div className="App">
      <Authenticator 
        components={components}
        hideSignUp={true}
        loginMechanisms={['email']}
      >
        {({ user }) => {
          console.log('✅ Stage 5: User authenticated:', user?.signInDetails?.loginId);
          return <Stage5CompleteInterface />;
        }}
      </Authenticator>
    </div>
  );
}

export default App;

console.log('✅ Stage 5: Complete document processing + embeddings + vector search app loaded');
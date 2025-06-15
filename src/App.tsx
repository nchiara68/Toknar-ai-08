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
console.log('🔧 Amplify configured for Stage 4 Final: Complete Document Processing');

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
          📄 RAG Chat - Stage 4 Final: Complete Document Processing
        </h1>
        <p style={{ margin: '0.5rem 0 0 0', opacity: 0.8 }}>
          AI conversation + file uploads + document processing + text chunking
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
        📄 Complete Document Processing | Stage 4: Production Ready | Next: Stage 5 Embeddings
      </div>
    );
  }
};

// 📄 Type definitions - FIXED: Aligned with actual Amplify schema
interface UserProfileType {
  id: string;
  email: string;
  totalDocuments?: number | null;
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
  owner?: string | null;
  readonly createdAt: string;
  readonly updatedAt: string;
}

// FIXED: Updated DocumentChunkType to match Amplify's actual type
interface DocumentChunkType {
  id: string;
  documentId: string;
  chunkIndex: number;
  content: string;
  wordCount: number;
  startPosition: number;
  endPosition: number;
  metadata: string | number | boolean | Record<string, unknown> | unknown[] | null; // FIXED: Match Amplify's a.json() type
  owner: string | null; // FIXED: Match Amplify's nullable owner
  createdAt: string;
  updatedAt: string;
}

interface UploadEvent {
  key?: string;
  result?: {
    key?: string;
    size?: number;
  };
  size?: number;
}

// 📄 Stage 4 Final Interface Component
function Stage4FinalInterface() {
  const { user, signOut } = useAuthenticator((context) => [context.user]);
  const [currentMessage, setCurrentMessage] = useState('');
  const [activeTab, setActiveTab] = useState<'chat' | 'upload' | 'documents' | 'chunks'>('chat');
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
  
  // 🤖 Use AI Conversation Hook
  const [
    {
      data: { messages },
      isLoading,
    },
    sendMessage,
  ] = useAIConversation('ragChat');

  // 🔄 Force refresh function
  const forceRefresh = () => {
    setRefreshKey(prev => prev + 1);
  };

  // 🔄 Manual refresh effect
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
          
          // Load chunks count - FIXED: Better error handling
          try {
            const { data: chunks } = await client.models.DocumentChunk.list({
              filter: { owner: { eq: user.username } }
            });
            setTotalChunksCount(chunks.length);
          } catch (error) {
            console.log('DocumentChunk model not yet available:', error);
            setTotalChunksCount(0);
          }
        } catch (error) {
          console.error('Error refreshing uploaded files:', error);
        }
      };
      
      refreshData();
    }
  }, [refreshKey, user.username]);

  // 🔍 Debug Stage 4 Final - FIXED: Better chunk model detection
  const debugStage4Final = async () => {
    console.log('🔍 Starting Stage 4 Final Debug Tests...');
    
    try {
      // Test 1: Database connectivity
      console.log('🔍 Test 1: Database connectivity...');
      const { data: documents } = await client.models.Document.list();
      
      // Check if DocumentChunk model exists - FIXED
      let chunks: DocumentChunkType[] = [];
      let chunkModelAvailable = false;
      try {
        const result = await client.models.DocumentChunk.list();
        chunks = result.data as DocumentChunkType[]; // FIXED: Proper type casting
        chunkModelAvailable = true;
        console.log('✅ DocumentChunk model is available');
      } catch (error) {
        console.log('⚠️ DocumentChunk model not yet deployed');
        chunkModelAvailable = false;
      }
      
      const { data: profiles } = await client.models.UserProfile.list();
      
      // Update total chunks count
      setTotalChunksCount(chunks.length);
      
      console.log('✅ Database Status:');
      console.log(`  - Documents: ${documents.length}`);
      console.log(`  - Chunks: ${chunks.length}`);
      console.log(`  - Profiles: ${profiles.length}`);
      console.log(`  - DocumentChunk Model: ${chunkModelAvailable ? 'Available' : 'Not Available'}`);
      
      // Test 2: Check processing pipeline
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
      
      // Test 3: Chunk analysis - FIXED: Better type handling
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
      
      // Test 4: Recent processing activity
      const recentDocs = documents
        .filter(d => d.updatedAt)
        .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
        .slice(0, 3);
      
      if (recentDocs.length > 0) {
        console.log('✅ Recent Processing:');
        recentDocs.forEach(doc => {
          console.log(`  - ${doc.name}: ${doc.processingStatus} (${doc.totalChunks || 0} chunks)`);
        });
      }
      
      // FIXED: More comprehensive status message
      const statusMessage = `🎉 Stage 4 Final Debug Complete!

Database Status:
📄 Documents: ${documents.length}
🧩 Chunks: ${chunks.length}
👤 Profiles: ${profiles.length}
🔧 DocumentChunk Model: ${chunkModelAvailable ? '✅ Available' : '❌ Not Available'}

Processing Pipeline:
⏳ Pending: ${processingCounts.pending}
⚙️ Processing: ${processingCounts.processing}
✅ Completed: ${processingCounts.completed}
❌ Failed: ${processingCounts.failed}

System Status: ${
  chunkModelAvailable && chunks.length > 0 
    ? '🎯 FULLY READY' 
    : chunkModelAvailable 
      ? '⚠️ READY (Upload files to test)' 
      : '❌ NEEDS DEPLOYMENT'
}

${!chunkModelAvailable ? '\n🔧 Action Needed: Deploy updated backend with DocumentChunk model' : ''}`;
      
      alert(statusMessage);
      
    } catch (error) {
      console.error('❌ Stage 4 Final Debug FAILED:', error);
      alert(`❌ Debug Test Failed:\n\n${error instanceof Error ? error.message : 'Unknown error'}\n\nCheck console for details.`);
    }
  };

  // 🎯 Initial load effect
  useEffect(() => {
    console.log('🚀 Stage 4 Final: Interface mounted for user:', user.signInDetails?.loginId);
    
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
        
        // Load chunks count - FIXED: Better error handling
        try {
          const { data: chunks } = await client.models.DocumentChunk.list({
            filter: { owner: { eq: user.username } }
          });
          setTotalChunksCount(chunks.length);
        } catch (error) {
          console.log('DocumentChunk model not yet available');
          setTotalChunksCount(0);
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

  // 🔄 Auto-refresh effect for processing status
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
        
        // Load chunks count - FIXED
        try {
          const { data: chunks } = await client.models.DocumentChunk.list({
            filter: { owner: { eq: user.username } }
          });
          setTotalChunksCount(chunks.length);
        } catch (error) {
          // Silently fail if model not available
          setTotalChunksCount(0);
        }
      } catch (error) {
        console.error('Error refreshing files:', error);
      }
    };

    // Refresh every 5 seconds to catch processing updates
    const interval = setInterval(loadFiles, 5000);
    return () => clearInterval(interval);
  }, [user.username]);

  // 📄 Load document chunks - FIXED: Better loading states and error handling
  const loadDocumentChunks = async (documentId: string) => {
    setIsLoadingChunks(true);
    try {
      const { data: chunks } = await client.models.DocumentChunk.list({
        filter: { documentId: { eq: documentId } }
      });
      // FIXED: Proper type casting and sorting
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

  // 📤 Handle sending messages
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

  // 📁 Handle successful file upload - FIXED: Better feedback
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
      
      // FIXED: Better success message
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

  // 🗑️ Handle file deletion - FIXED: Better confirmation and feedback
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
      
      await client.models.Document.delete({ id: document.id });
      forceRefresh();
      
      if (selectedDocument?.id === document.id) {
        setSelectedDocument(null);
        setDocumentChunks([]);
      }
      
      alert(`✅ "${document.name}" and all its chunks deleted successfully!`);
    } catch (error) {
      console.error('Error deleting file:', error);
      alert('❌ Error deleting file. Please try again.');
    }
  };

  // 📄 View document details
  const viewDocumentDetails = (document: DocumentType) => {
    setSelectedDocument(document);
    setActiveTab('chunks');
    if (document.processingStatus === 'completed') {
      loadDocumentChunks(document.id);
    }
  };

  // 💾 Export data - FIXED: More comprehensive export
  const exportData = () => {
    const data = {
      profile: userProfile,
      documents: uploadedFiles,
      chunks: documentChunks,
      messages: messages || [],
      processingStats,
      totalChunksCount,
      exportedAt: new Date().toISOString(),
      stage: 'Stage 4 Final',
      systemStatus: {
        documentsCount: uploadedFiles.length,
        chunksCount: totalChunksCount,
        processingPipeline: processingStats
      }
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `rag-chat-stage4-final-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    
    alert('✅ Data exported successfully!');
  };

  // 📊 Get status color and icon
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

  return (
    <div style={{ 
      height: '100vh', 
      display: 'flex', 
      flexDirection: 'column',
      fontFamily: 'Arial, sans-serif'
    }}>
      
      {/* 🏷️ Header */}
      <header style={{ 
        padding: '1rem', 
        backgroundColor: '#232F3E', 
        color: 'white',
        borderBottom: '2px solid #FF9900'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 style={{ margin: 0, fontSize: '1.5rem' }}>
              📄 Stage 4 Final: Complete Document Processing
            </h1>
            <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.9rem', opacity: 0.8 }}>
              👤 {user.signInDetails?.loginId} | 
              📄 {userProfile?.totalDocuments || 0} docs | 
              🧩 {totalChunksCount} chunks | 
              💬 {messages?.length || 0} messages
            </p>
          </div>
          
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              onClick={debugStage4Final}
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
              🔍 Debug S4
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

        {/* Tab Navigation */}
        <div style={{ marginTop: '1rem', display: 'flex', gap: '0.5rem' }}>
          {['chat', 'upload', 'documents', 'chunks'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as 'chat' | 'upload' | 'documents' | 'chunks')}
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
            </button>
          ))}
        </div>

        {/* Processing Stats Bar */}
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
        </div>
      </header>

      {/* 📄 Main Content */}
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        
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
                📄 Stage 4 Final: Ready for Stage 5 RAG integration
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
                  <h3>🎉 Welcome to Stage 4 Final, {user.signInDetails?.loginId?.split('@')[0]}!</h3>
                  <p>Document processing is now fully operational!</p>
                  <p><strong>✅ What's Working:</strong></p>
                  <ul style={{ textAlign: 'left', maxWidth: '400px', margin: '0 auto' }}>
                    <li>📁 File uploads to S3</li>
                    <li>⚡ Lambda-triggered processing</li>
                    <li>📄 Text extraction & chunking</li>
                    <li>💾 Chunk storage in DynamoDB</li>
                    <li>📊 Real-time status tracking</li>
                  </ul>
                  <p><strong>🚀 Next:</strong> Stage 5 will add embeddings and vector search for RAG!</p>
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
      </main>

      {/* 📊 Status Bar */}
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
          🎯 <strong>Stage 4 Final Complete</strong> • Next: Stage 5 Embeddings & Vector Search
        </div>
        <div>
          📄 Docs: {uploadedFiles.length} | 
          🧩 Total Chunks: {totalChunksCount} | 
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
          console.log('✅ Stage 4 Final: User authenticated:', user?.signInDetails?.loginId);
          return <Stage4FinalInterface />;
        }}
      </Authenticator>
    </div>
  );
}

export default App;

console.log('✅ Stage 4 Final: Complete document processing app loaded');
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
console.log('🔧 Amplify configured for Stage 4: AI Conversation + File Upload + Document Processing');

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
          📄 RAG Chat - Stage 4: Document Processing
        </h1>
        <p style={{ margin: '0.5rem 0 0 0', opacity: 0.8 }}>
          AI conversation + document uploads + text processing
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
        📄 Document Processing + 📁 File uploads + 🤖 AI Conversation | Stage 4: Text Chunking
      </div>
    );
  }
};

// 📄 Type definitions
interface UserProfileType {
  id: string;
  email: string;
  totalDocuments: number;
  totalChunks: number;
  storageUsed: number;
  lastActiveAt: string;
  owner: string;
}

interface DocumentType {
  id: string;
  name: string;
  key: string;
  size: number;
  type: string;
  uploadedAt: string;
  status: string;
  processingStatus: string;
  processedAt?: string;
  totalChunks: number;
  owner: string;
}

interface DocumentChunkType {
  id: string;
  documentId: string;
  chunkIndex: number;
  content: string;
  wordCount: number;
  startPosition: number;
  endPosition: number;
  metadata: Record<string, unknown>;
  createdAt: string;
  owner: string;
}

interface UploadEvent {
  key?: string;
  result?: {
    key?: string;
    size?: number;
  };
  size?: number;
}

// 📄 Stage 4 Interface Component
function Stage4Interface() {
  const { user, signOut } = useAuthenticator((context) => [context.user]);
  const [currentMessage, setCurrentMessage] = useState('');
  const [activeTab, setActiveTab] = useState<'chat' | 'upload' | 'documents'>('chat');
  const [uploadedFiles, setUploadedFiles] = useState<DocumentType[]>([]);
  const [userProfile, setUserProfile] = useState<UserProfileType | null>(null);
  const [selectedDocument, setSelectedDocument] = useState<DocumentType | null>(null);
  const [documentChunks, setDocumentChunks] = useState<DocumentChunkType[]>([]);
  const [refreshKey, setRefreshKey] = useState(0); // Force refresh trigger
  
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

  // 🔍 Debug Stage 4 - Test database operations
  const debugStage4 = async () => {
    console.log('🔍 Starting Stage 4 Debug Tests...');
    
    try {
      // Test 1: Check database connection
      console.log('🔍 Test 1: Checking database connection...');
      const { data: documents } = await client.models.Document.list();
      console.log('✅ Database connection OK. Found', documents.length, 'documents');
      
      // Test 2: Check user profile
      console.log('🔍 Test 2: Checking user profile...');
      const { data: profiles } = await client.models.UserProfile.list();
      console.log('✅ User profile check OK. Found', profiles.length, 'profiles');
      
      // Test 3: Check document chunks
      console.log('🔍 Test 3: Checking document chunks...');
      const { data: chunks } = await client.models.DocumentChunk.list();
      console.log('✅ Document chunks check OK. Found', chunks.length, 'chunks');
      
      // Test 4: Create a test document record
      console.log('🔍 Test 4: Creating test document record...');
      const testDoc = await client.models.Document.create({
        name: 'debug-test.txt',
        key: 'documents/debug-test.txt',
        size: 1000,
        type: 'TXT',
        uploadedAt: new Date().toISOString(),
        status: 'uploaded',
        processingStatus: 'pending',
        owner: user.username
      });
      console.log('✅ Test document created:', testDoc.data?.id);
      
      // Test 5: Update the test document
      console.log('🔍 Test 5: Updating test document...');
      if (testDoc.data?.id) {
        await client.models.Document.update({
          id: testDoc.data.id,
          processingStatus: 'completed',
          totalChunks: 3
        });
        console.log('✅ Test document updated');
      }
      
      // Test 6: Create test chunks
      console.log('🔍 Test 6: Creating test chunks...');
      if (testDoc.data?.id) {
        for (let i = 0; i < 3; i++) {
          const chunk = await client.models.DocumentChunk.create({
            documentId: testDoc.data.id,
            chunkIndex: i,
            content: `This is test chunk ${i + 1} for debugging purposes. Lorem ipsum dolor sit amet, consectetur adipiscing elit.`,
            wordCount: 15,
            startPosition: i * 100,
            endPosition: (i + 1) * 100,
            metadata: { test: true },
            createdAt: new Date().toISOString(),
            owner: user.username
          });
          console.log(`✅ Test chunk ${i + 1} created:`, chunk.data?.id);
        }
      }
      
      // Test 7: Query the test data
      console.log('🔍 Test 7: Querying test data...');
      const { data: updatedDocs } = await client.models.Document.list();
      const { data: testChunks } = await client.models.DocumentChunk.list({
        filter: { documentId: { eq: testDoc.data?.id } }
      });
      console.log('✅ Found', updatedDocs.length, 'documents and', testChunks.length, 'test chunks');
      
      // Test 8: Clean up test data
      console.log('🔍 Test 8: Cleaning up test data...');
      for (const chunk of testChunks) {
        await client.models.DocumentChunk.delete({ id: chunk.id });
      }
      if (testDoc.data?.id) {
        await client.models.Document.delete({ id: testDoc.data.id });
      }
      console.log('✅ Test cleanup complete');
      
      console.log('🎉 All Stage 4 Debug Tests PASSED!');
      alert('🎉 All Stage 4 Debug Tests PASSED!\n\nYour database operations are working correctly.\nNow try uploading a real file to test the Lambda function.');
      
    } catch (error) {
      console.error('❌ Stage 4 Debug Test FAILED:', error);
      alert(`❌ Stage 4 Debug Test FAILED:\n\n${error instanceof Error ? error.message : 'Unknown error'}\n\nCheck console for details.`);
    }
  };

  // 🎯 Initial load effect - define functions inside to avoid dependency issues
  useEffect(() => {
    console.log('🚀 Stage 4: Interface mounted for user:', user.signInDetails?.loginId);
    
    // Define functions inside useEffect to avoid dependency warnings
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
            totalChunks: 0,
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
        setUploadedFiles(documents as DocumentType[]);
      } catch (error) {
        console.error('Error loading uploaded files:', error);
      }
    };
    
    // Initialize data
    const initializeData = async () => {
      await loadProfile();
      await loadFiles();
    };
    
    initializeData();
  }, [user.signInDetails?.loginId, user.username]); // Include all used dependencies

  // 🔄 Auto-refresh effect
  useEffect(() => {
    const loadFiles = async () => {
      try {
        const { data: documents } = await client.models.Document.list({
          filter: { owner: { eq: user.username } }
        });
        setUploadedFiles(documents as DocumentType[]);
      } catch (error) {
        console.error('Error loading uploaded files:', error);
      }
    };

    const interval = setInterval(loadFiles, 10000);
    return () => clearInterval(interval);
  }, [user.username]); // Include username dependency

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
          setUploadedFiles(documents as DocumentType[]);
        } catch (error) {
          console.error('Error refreshing uploaded files:', error);
        }
      };
      
      refreshData();
    }
  }, [refreshKey, user.username]); // Include all dependencies

  // 📄 Load document chunks
  const loadDocumentChunks = async (documentId: string) => {
    try {
      const { data: chunks } = await client.models.DocumentChunk.list({
        filter: { documentId: { eq: documentId } }
      });
      setDocumentChunks(chunks.sort((a, b) => a.chunkIndex - b.chunkIndex) as DocumentChunkType[]);
    } catch (error) {
      console.error('Error loading document chunks:', error);
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

  // 📁 Handle successful file upload
  const handleUploadSuccess = async (event: UploadEvent) => {
    console.log('📁 File uploaded successfully:', event);
    console.log('📁 Event keys:', Object.keys(event));
    
    try {
      // Handle different event structures
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

      // Update user profile if it exists
      if (userProfile) {
        await client.models.UserProfile.update({
          id: userProfile.id,
          totalDocuments: (userProfile.totalDocuments || 0) + 1,
          storageUsed: (userProfile.storageUsed || 0) + fileSize,
          lastActiveAt: new Date().toISOString()
        });
      }

      // Force refresh
      forceRefresh();
      
      alert('✅ File uploaded successfully! Processing will begin automatically.');
    } catch (error) {
      console.error('Error creating document record:', error);
      alert('File uploaded to S3 but failed to create database record. Check console for details.');
    }
  };

  // 🗑️ Handle file deletion
  const handleDeleteFile = async (document: DocumentType) => {
    if (!confirm(`Delete "${document.name}" and all its chunks?`)) return;
    
    try {
      // Delete all chunks first
      const { data: chunks } = await client.models.DocumentChunk.list({
        filter: { documentId: { eq: document.id } }
      });
      
      for (const chunk of chunks) {
        await client.models.DocumentChunk.delete({ id: chunk.id });
      }
      
      // Delete the document
      await client.models.Document.delete({ id: document.id });
      
      // Force refresh
      forceRefresh();
      
      if (selectedDocument?.id === document.id) {
        setSelectedDocument(null);
        setDocumentChunks([]);
      }
      
      alert('✅ Document and all chunks deleted successfully!');
    } catch (error) {
      console.error('Error deleting file:', error);
      alert('❌ Error deleting file.');
    }
  };

  // 📄 View document details
  const viewDocumentDetails = (document: DocumentType) => {
    setSelectedDocument(document);
    setActiveTab('documents');
    if (document.processingStatus === 'completed') {
      loadDocumentChunks(document.id);
    }
  };

  // 🧹 TEMPORARY: Reset everything for fresh start
  const resetEverything = async () => {
    if (!confirm('⚠️ This will delete ALL documents and chunks. Continue?')) return;
    
    try {
      console.log('🧹 Starting complete cleanup...');
      
      // Delete all chunks first (foreign key constraint)
      const { data: allChunks } = await client.models.DocumentChunk.list();
      console.log(`🧹 Deleting ${allChunks.length} chunks...`);
      for (const chunk of allChunks) {
        await client.models.DocumentChunk.delete({ id: chunk.id });
      }
      
      // Delete all documents
      const { data: allDocs } = await client.models.Document.list();
      console.log(`🧹 Deleting ${allDocs.length} documents...`);
      for (const doc of allDocs) {
        await client.models.Document.delete({ id: doc.id });
      }
      
      // Reset user profile counts
      if (userProfile) {
        await client.models.UserProfile.update({
          id: userProfile.id,
          totalDocuments: 0,
          totalChunks: 0,
          storageUsed: 0
        });
      }
      
      console.log('✅ Database cleanup complete!');
      alert(`✅ Database cleaned! 
      
Next steps:
1. Go to S3 console
2. Delete all files in: documents/ folder
3. Come back and start fresh testing!`);
      
      // Force refresh
      forceRefresh();
      
    } catch (error) {
      console.error('🧹 Cleanup error:', error);
      alert('❌ Cleanup failed. Check console for details.');
    }
  };

  // 💾 Export data
  const exportData = () => {
    const data = {
      profile: userProfile,
      documents: uploadedFiles,
      chunks: documentChunks,
      messages: messages || [],
      exportedAt: new Date().toISOString()
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `rag-chat-export-stage4-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // 📊 Get processing status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return '#28A745';
      case 'processing': return '#FFC107';
      case 'failed': return '#DC3545';
      default: return '#6C757D';
    }
  };

  // 📊 Get processing status icon
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
              📄 Stage 4: Document Processing
            </h1>
            <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.9rem', opacity: 0.8 }}>
              👤 {user.signInDetails?.loginId} | 
              📄 {userProfile?.totalDocuments || 0} docs | 
              🧩 {userProfile?.totalChunks || 0} chunks | 
              💬 {messages?.length || 0} messages
            </p>
          </div>
          
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              onClick={debugStage4}
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
              🔍 Debug DB
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
              onClick={resetEverything}
              style={{
                padding: '0.5rem 1rem',
                backgroundColor: '#DC3545',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '0.9rem'
              }}
            >
              🧹 Reset All
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
          <button
            onClick={() => setActiveTab('chat')}
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: activeTab === 'chat' ? '#FF9900' : 'transparent',
              color: 'white',
              border: '1px solid #FF9900',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            💬 AI Chat
          </button>
          <button
            onClick={() => setActiveTab('upload')}
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: activeTab === 'upload' ? '#FF9900' : 'transparent',
              color: 'white',
              border: '1px solid #FF9900',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            📁 Upload Files
          </button>
          <button
            onClick={() => setActiveTab('documents')}
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: activeTab === 'documents' ? '#FF9900' : 'transparent',
              color: 'white',
              border: '1px solid #FF9900',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            📄 Document Processing
          </button>
        </div>
      </header>

      {/* 📄 Main Content */}
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        
        {activeTab === 'chat' && (
          <>
            {/* Chat Interface */}
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
                🔄 Stage 4: Chat + document processing (search in Stage 5)
              </div>
            </div>

            {/* Messages Area */}
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
                  <h3>📄 Welcome to Stage 4, {user.signInDetails?.loginId?.split('@')[0]}!</h3>
                  <p>I'm Claude 3 Haiku. You can now upload documents and watch them being processed into text chunks!</p>
                  <p>🔍 <strong>First, click "Debug DB" to test database operations</strong></p>
                  <p>Upload files in the "Upload Files" tab, then check "Document Processing" to see the results.</p>
                  <p>Document search and retrieval will be added in Stage 5!</p>
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

            {/* Message Input */}
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
              borderBottom: '1px solid #DEE2E6',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <div>
                <strong style={{ color: '#232F3E' }}>📁 Document Upload</strong>
                <span style={{ marginLeft: '1rem', color: '#6C757D', fontSize: '0.9rem' }}>
                  Upload PDF, TXT, DOC files for processing
                </span>
              </div>
              <div style={{ fontSize: '0.8rem', color: '#6C757D' }}>
                📊 Storage: {Math.round((userProfile?.storageUsed || 0) / 1024 / 1024 * 100) / 100} MB
              </div>
            </div>

            <div style={{ flex: 1, padding: '2rem', overflow: 'auto' }}>
              <div style={{ marginBottom: '2rem' }}>
                <h3 style={{ marginBottom: '1rem' }}>📤 Upload New Documents</h3>
                <StorageManager
                  acceptedFileTypes={['.pdf', '.txt', '.doc', '.docx']}
                  path="documents/"
                  maxFileCount={10}
                  maxFileSize={10 * 1024 * 1024} // 10MB
                  onUploadSuccess={handleUploadSuccess}
                  onUploadError={(error) => {
                    console.error('Upload error:', error);
                    alert('❌ Upload failed. Please try again.');
                  }}
                />
              </div>

              {/* Processing Status Overview */}
              <div style={{ marginBottom: '2rem' }}>
                <h3 style={{ marginBottom: '1rem' }}>📊 Processing Status Overview</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1rem' }}>
                  {['pending', 'processing', 'completed', 'failed'].map(status => {
                    const count = uploadedFiles.filter(doc => doc.processingStatus === status).length;
                    return (
                      <div key={status} style={{
                        padding: '1rem',
                        backgroundColor: '#F8F9FA',
                        borderRadius: '8px',
                        textAlign: 'center',
                        border: `2px solid ${getStatusColor(status)}`
                      }}>
                        <div style={{ fontSize: '1.5rem' }}>{getStatusIcon(status)}</div>
                        <div style={{ fontWeight: 'bold', color: getStatusColor(status) }}>
                          {status.charAt(0).toUpperCase() + status.slice(1)}
                        </div>
                        <div style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>{count}</div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Uploaded Files List */}
              <div>
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
                    <p>Upload your first document above to get started!</p>
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
                            {doc.type} • {Math.round(doc.size / 1024)} KB • 
                            {new Date(doc.uploadedAt).toLocaleDateString()}
                          </div>
                          <div style={{ 
                            fontSize: '0.8rem', 
                            color: getStatusColor(doc.processingStatus), 
                            marginTop: '0.25rem',
                            fontWeight: 'bold'
                          }}>
                            {getStatusIcon(doc.processingStatus)} Status: {doc.processingStatus}
                            {doc.totalChunks > 0 && ` • ${doc.totalChunks} chunks`}
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
                              📄 View
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
            </div>
          </>
        )}

        {activeTab === 'documents' && (
          <div style={{ flex: 1, padding: '2rem', overflow: 'auto' }}>
            <h3 style={{ marginBottom: '1rem' }}>📄 Document Processing Debug</h3>
            <p style={{ color: '#6C757D', marginBottom: '2rem' }}>
              1. Click "🔍 Debug DB" to test database operations<br/>
              2. Upload a file to test Lambda processing<br/>
              3. Watch status change: pending → processing → completed
            </p>
            
            {uploadedFiles.length > 0 && (
              <div>
                <h4>Recent Documents:</h4>
                {uploadedFiles.slice(0, 5).map(doc => (
                  <div key={doc.id} style={{ 
                    padding: '0.5rem', 
                    border: '1px solid #DEE2E6', 
                    margin: '0.5rem 0',
                    borderRadius: '4px'
                  }}>
                    <strong>{doc.name}</strong> - 
                    <span style={{ color: getStatusColor(doc.processingStatus), marginLeft: '0.5rem' }}>
                      {getStatusIcon(doc.processingStatus)} {doc.processingStatus}
                    </span>
                    {doc.totalChunks > 0 && <span> ({doc.totalChunks} chunks)</span>}
                  </div>
                ))}
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
          🚀 <strong>Next:</strong> Stage 5 - Embeddings + Vector Search
        </div>
        <div>
          📄 Files: {uploadedFiles.length} | 🧩 Chunks: {uploadedFiles.reduce((sum, doc) => sum + (doc.totalChunks || 0), 0)} | 💬 Messages: {messages?.length || 0}
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
          console.log('✅ Stage 4: User authenticated:', user?.signInDetails?.loginId);
          return <Stage4Interface />;
        }}
      </Authenticator>
    </div>
  );
}

export default App;

console.log('✅ Stage 4: Document Processing app loaded');
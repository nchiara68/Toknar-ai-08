import React, { useState, useEffect } from 'react';
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
console.log('🔧 Amplify configured for Stage 3: AI Conversation + File Upload');

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
          📁 RAG Chat - Stage 3: File Upload
        </h1>
        <p style={{ margin: '0.5rem 0 0 0', opacity: 0.8 }}>
          AI conversation + document uploads to S3
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
        📁 File uploads + 🤖 AI Conversation | Stage 3: Document Management
      </div>
    );
  }
};

// 📄 Stage 3 Interface Component
function Stage3Interface() {
  console.log('📁 Stage 3: Interface component rendered');
  
  const { user, signOut } = useAuthenticator((context) => [context.user]);
  const [currentMessage, setCurrentMessage] = useState('');
  const [activeTab, setActiveTab] = useState<'chat' | 'upload'>('chat');
  const [uploadedFiles, setUploadedFiles] = useState<any[]>([]);
  const [userProfile, setUserProfile] = useState<any>(null);
  
  // 🤖 Use AI Conversation Hook
  const [
    {
      data: { messages },
      isLoading,
    },
    sendMessage,
  ] = useAIConversation('ragChat');

  useEffect(() => {
    console.log('🚀 Stage 3: Interface mounted');
    console.log('👤 Current user:', user.signInDetails?.loginId);
    loadUserProfile();
    loadUploadedFiles();
  }, [user]);

  // 👤 Load user profile
  const loadUserProfile = async () => {
    try {
      const { data: profiles } = await client.models.UserProfile.list({
        filter: { owner: { eq: user.username } } // Use username instead of userId
      });
      
      if (profiles.length > 0) {
        setUserProfile(profiles[0]);
      } else {
        // Create new profile
        const newProfile = await client.models.UserProfile.create({
          email: user.signInDetails?.loginId || '',
          totalDocuments: 0,
          storageUsed: 0,
          lastActiveAt: new Date().toISOString(),
          owner: user.username // Use username instead of userId
        });
        setUserProfile(newProfile.data);
      }
    } catch (error) {
      console.error('Error loading user profile:', error);
    }
  };

  // 📄 Load uploaded files
  const loadUploadedFiles = async () => {
    try {
      const { data: documents } = await client.models.Document.list({
        filter: { owner: { eq: user.username } } // Use username instead of userId
      });
      setUploadedFiles(documents);
    } catch (error) {
      console.error('Error loading uploaded files:', error);
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
  const handleUploadSuccess = async (event: any) => {
    console.log('📁 File uploaded successfully:', event);
    console.log('📁 Event keys:', Object.keys(event));
    console.log('📁 User info:', { userId: user.userId, username: user.username });
    
    try {
      // Handle different event structures
      const fileKey = event.key || event.result?.key || 'unknown';
      const fileName = fileKey.split('/').pop() || 'Unknown';
      const fileExtension = fileName.split('.').pop()?.toUpperCase() || 'UNKNOWN';
      const fileSize = event.size || event.result?.size || 0;
      
      console.log('📁 Creating document record with:', {
        name: fileName,
        key: fileKey,
        size: fileSize,
        type: fileExtension,
        owner: user.username
      });

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

      // Update user profile
      if (userProfile) {
        const profileResult = await client.models.UserProfile.update({
          id: userProfile.id,
          totalDocuments: (userProfile.totalDocuments || 0) + 1,
          storageUsed: (userProfile.storageUsed || 0) + fileSize,
          lastActiveAt: new Date().toISOString()
        });
        console.log('📁 Profile updated:', profileResult);
      }

      // Reload data
      await loadUserProfile();
      await loadUploadedFiles();
      
      alert('✅ File uploaded successfully! Document processing will be added in Stage 4.');
    } catch (error: any) {
      console.error('Error creating document record:', error);
      
      // Better error logging
      if (error instanceof Error) {
        console.error('Error message:', error.message);
        console.error('Error stack:', error.stack);
      }
      
      // Try to extract GraphQL errors
      if (error && typeof error === 'object' && 'errors' in error) {
        console.error('GraphQL errors:', error.errors);
      }
      
      alert('File uploaded to S3 but failed to create database record. Check console for details.');
    }
  };

  // 🗑️ Handle file deletion
  const handleDeleteFile = async (document: any) => {
    if (!confirm(`Delete "${document.name}"?`)) return;
    
    try {
      await client.models.Document.delete({ id: document.id });
      loadUploadedFiles();
      loadUserProfile();
      alert('✅ File deleted successfully!');
    } catch (error) {
      console.error('Error deleting file:', error);
      alert('❌ Error deleting file.');
    }
  };

  // 💾 Export data
  const exportData = () => {
    const data = {
      profile: userProfile,
      documents: uploadedFiles,
      messages: messages || [],
      exportedAt: new Date().toISOString()
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `rag-chat-export-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
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
              📁 Stage 3: File Upload + AI Chat
            </h1>
            <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.9rem', opacity: 0.8 }}>
              👤 {user.signInDetails?.loginId} | 
              📄 {userProfile?.totalDocuments || 0} docs | 
              💬 {messages?.length || 0} messages
            </p>
          </div>
          
          <div style={{ display: 'flex', gap: '0.5rem' }}>
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
                🔄 Stage 3: Chat + file uploads (processing in Stage 4)
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
                  <h3>📁 Welcome to Stage 3, {user.signInDetails?.loginId?.split('@')[0]}!</h3>
                  <p>I'm Claude 3 Haiku. You can now chat with me AND upload documents!</p>
                  <p>Try uploading a PDF or TXT file using the "Upload Files" tab, then come back here to chat.</p>
                  <p>Document processing will be added in Stage 4!</p>
                </div>
              ) : (
                <div>
                  {messages.map((message, index) => (
                    <div
                      key={index}
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
            {/* Upload Interface */}
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
                  Upload PDF, TXT, DOC files
                </span>
              </div>
              <div style={{ fontSize: '0.8rem', color: '#6C757D' }}>
                📊 Storage: {Math.round((userProfile?.storageUsed || 0) / 1024 / 1024 * 100) / 100} MB
              </div>
            </div>

            <div style={{ flex: 1, padding: '2rem', overflow: 'auto' }}>
              {/* Storage Manager */}
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
                        <div>
                          <div style={{ fontWeight: 'bold', color: '#232F3E' }}>
                            📄 {doc.name}
                          </div>
                          <div style={{ fontSize: '0.9rem', color: '#6C757D', marginTop: '0.25rem' }}>
                            {doc.type} • {Math.round(doc.size / 1024)} KB • 
                            {new Date(doc.uploadedAt).toLocaleDateString()}
                          </div>
                          <div style={{ fontSize: '0.8rem', color: '#28A745', marginTop: '0.25rem' }}>
                            Status: {doc.status} • Processing: {doc.processingStatus}
                          </div>
                        </div>
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
                    ))}
                  </div>
                )}
              </div>
            </div>
          </>
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
          🚀 <strong>Next:</strong> Stage 4 - Document Processing
        </div>
        <div>
          📁 Files: {uploadedFiles.length} | 💬 Messages: {messages?.length || 0}
        </div>
      </footer>
    </div>
  );
}

// 📄 Main App Component
function App() {
  console.log('🚀 Stage 3: App component rendered');

  return (
    <div className="App">
      <Authenticator 
        components={components}
        hideSignUp={true}
        loginMechanisms={['email']}
      >
        {({ user }) => {
          console.log('✅ Stage 3: User authenticated:', user?.signInDetails?.loginId);
          return <Stage3Interface />;
        }}
      </Authenticator>
    </div>
  );
}

export default App;

console.log('✅ Stage 3: File Upload + AI Conversation app loaded');
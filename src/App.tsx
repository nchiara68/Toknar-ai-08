// src/App.tsx - Refactored Stage 5 Application
import { Amplify } from 'aws-amplify';
import { Authenticator, useAuthenticator } from '@aws-amplify/ui-react';
import '@aws-amplify/ui-react/styles.css';
import './App.css';

import outputs from '../amplify_outputs.json';
import { useAIConversation } from './client';
import { generateClient } from 'aws-amplify/api';
import type { Schema } from '../amplify/data/resource';

// Components
import { authenticatorComponents } from './components/auth';
import { Header } from './components/layout/Header';
import { MainLayout } from './components/layout/MainLayout';
import { AIConversation } from './components/conversation/AIConversation';
import { DocumentUpload } from './components/documents/DocumentUpload';
import { DocumentList } from './components/documents/DocumentList';
import { DocumentChunks } from './components/documents/DocumentChunks';
import { EmbeddingsInterface } from './components/embeddings/EmbeddingsInterface';

// Hooks and utilities
import { useAppState } from './hooks/useAppState';
import { exportAppData } from './utils/functions';
import { UploadEvent, DocumentType, DocumentChunkType, EmbeddingType } from './types';

// Configure Amplify
Amplify.configure(outputs);
console.log('🔧 Amplify configured for Stage 5: Complete Document Processing + Embeddings + Vector Search');

const client = generateClient<Schema>();

// Main Stage 5 Interface Component
function Stage5Interface() {
  const { user } = useAuthenticator((context) => [context.user]);
  
  // Use custom hook for state management
  const {
    activeTab,
    setActiveTab,
    embeddingProgress,
    userProfile,
    uploadedFiles,
    selectedDocument,
    setSelectedDocument,
    documentChunks,
    embeddings,
    totalChunksCount,
    processingStats,
    isLoadingChunks,
    isGeneratingEmbeddings,
    forceRefresh,
    loadDocumentChunks,
    generateEmbeddings,
    handleDeleteFile,
    embeddingsCount
  } = useAppState(user.username, user.signInDetails?.loginId || '');

  // AI Conversation Hook
  const [
    {
      data: { messages },
      isLoading,
    },
    sendMessage,
  ] = useAIConversation('ragChat');

  // Handle successful file upload
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
        embeddingsGenerated: false,
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

  // View document details
  const viewDocumentDetails = (document: DocumentType) => {
    setSelectedDocument(document);
    setActiveTab('chunks');
    if (document.processingStatus === 'completed') {
      loadDocumentChunks(document.id);
    }
  };

  // Debug Stage 5
  const debugStage5 = async () => {
    console.log('🔍 Starting Stage 5 Debug Tests...');
    
    try {
      const { data: documents } = await client.models.Document.list();
      
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
      
      console.log('✅ Database Status:');
      console.log(`  - Documents: ${documents.length}`);
      console.log(`  - Chunks: ${chunks.length}`);
      console.log(`  - Embeddings: ${embeddings.length}`);
      console.log(`  - Profiles: ${profiles.length}`);
      
      const processingCounts = {
        pending: documents.filter(d => d.processingStatus === 'pending').length,
        processing: documents.filter(d => d.processingStatus === 'processing').length,
        completed: documents.filter(d => d.processingStatus === 'completed').length,
        failed: documents.filter(d => d.processingStatus === 'failed').length
      };

      const embeddedDocs = documents.filter(d => d.embeddingsGenerated);
      const embeddingCoverage = processingCounts.completed > 0 ? 
        (embeddedDocs.length / processingCounts.completed * 100).toFixed(1) : '0';

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
}`;
      
      alert(statusMessage);
      
    } catch (error) {
      console.error('❌ Stage 5 Debug FAILED:', error);
      alert(`❌ Debug Test Failed:\n\n${error instanceof Error ? error.message : 'Unknown error'}\n\nCheck console for details.`);
    }
  };

  // Export data
  const handleExportData = () => {
    const result = exportAppData({
      profile: userProfile,
      documents: uploadedFiles,
      chunks: documentChunks,
      embeddings: embeddings,
      messages: messages || [],
      processingStats,
      totalChunksCount,
      searchResults: []
    });
    
    alert(`✅ ${result}`);
  };

  return (
    <MainLayout
      totalDocuments={uploadedFiles.length}
      totalChunksCount={totalChunksCount}
      embeddingsCount={embeddingsCount}
      messagesCount={messages?.length || 0}
      processingStats={processingStats}
    >
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        userProfile={userProfile}
        totalChunksCount={totalChunksCount}
        embeddingsCount={embeddingsCount}
        messagesCount={messages?.length || 0}
        processingStats={processingStats}
        embeddingProgress={embeddingProgress}
        onDebug={debugStage5}
        onRefresh={forceRefresh}
        onExport={handleExportData}
      />

      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {activeTab === 'chat' && (
          <AIConversation
            messages={messages || []}
            isLoading={isLoading}
            onSendMessage={sendMessage}
          />
        )}

        {activeTab === 'upload' && (
          <DocumentUpload
            processingStats={processingStats}
            onUploadSuccess={handleUploadSuccess}
          />
        )}

        {activeTab === 'documents' && (
          <DocumentList
            documents={uploadedFiles}
            onViewChunks={viewDocumentDetails}
            onDeleteDocument={handleDeleteFile}
          />
        )}

        {activeTab === 'chunks' && (
          <DocumentChunks
            selectedDocument={selectedDocument}
            chunks={documentChunks}
            isLoading={isLoadingChunks}
            onBack={() => setSelectedDocument(null)}
          />
        )}

        {activeTab === 'embeddings' && (
          <EmbeddingsInterface
            documents={uploadedFiles}
            embeddings={embeddings}
            totalChunksCount={totalChunksCount}
            onGenerateEmbeddings={generateEmbeddings}
            isGeneratingEmbeddings={isGeneratingEmbeddings}
          />
        )}
      </main>
    </MainLayout>
  );
}

// Main App Component
function App() {
  return (
    <div className="App">
      <Authenticator 
        components={authenticatorComponents}
        hideSignUp={true}
        loginMechanisms={['email']}
      >
        {({ user }) => {
          console.log('✅ Stage 5: User authenticated:', user?.signInDetails?.loginId);
          return <Stage5Interface />;
        }}
      </Authenticator>
    </div>
  );
}

export default App;

console.log('✅ Stage 5: Complete document processing + embeddings + vector search app loaded');
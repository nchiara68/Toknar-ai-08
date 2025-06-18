// src/hooks/useAppState.ts - Main application state management hook

import { useState, useEffect, useCallback } from 'react';
import { generateClient } from 'aws-amplify/api';
import type { Schema } from '../../amplify/data/resource';
import { 
  UserProfileType, 
  DocumentType, 
  DocumentChunkType, 
  EmbeddingType, 
  ProcessingStats,
  TabType 
} from '../types';
import { calculateProcessingStats } from '../utils/functions';

const client = generateClient<Schema>();

export const useAppState = (username: string, userEmail: string) => {
  // UI State
  const [activeTab, setActiveTab] = useState<TabType>('chat');
  const [refreshKey, setRefreshKey] = useState(0);
  const [embeddingProgress, setEmbeddingProgress] = useState('');

  // Data State
  const [userProfile, setUserProfile] = useState<UserProfileType | null>(null);
  const [uploadedFiles, setUploadedFiles] = useState<DocumentType[]>([]);
  const [selectedDocument, setSelectedDocument] = useState<DocumentType | null>(null);
  const [documentChunks, setDocumentChunks] = useState<DocumentChunkType[]>([]);
  const [embeddings, setEmbeddings] = useState<EmbeddingType[]>([]);
  const [totalChunksCount, setTotalChunksCount] = useState(0);
  const [processingStats, setProcessingStats] = useState<ProcessingStats>({
    pending: 0,
    processing: 0,
    completed: 0,
    failed: 0
  });

  // Loading States
  const [isLoadingChunks, setIsLoadingChunks] = useState(false);
  const [isGeneratingEmbeddings, setIsGeneratingEmbeddings] = useState(false);

  // Force refresh function
  const forceRefresh = useCallback(() => {
    setRefreshKey(prev => prev + 1);
  }, []);

  // Load user profile
  const loadProfile = useCallback(async () => {
    try {
      const { data: profiles } = await client.models.UserProfile.list({
        filter: { owner: { eq: username } }
      });
      
      if (profiles.length > 0) {
        setUserProfile(profiles[0] as UserProfileType);
      } else {
        const newProfile = await client.models.UserProfile.create({
          email: userEmail,
          totalDocuments: 0,
          totalEmbeddings: 0,
          storageUsed: 0,
          lastActiveAt: new Date().toISOString(),
          owner: username
        });
        setUserProfile(newProfile.data as UserProfileType);
      }
    } catch (error) {
      console.error('Error loading user profile:', error);
    }
  }, [username, userEmail]);

  // Load documents and related data
  const loadDocuments = useCallback(async () => {
    try {
      const { data: documents } = await client.models.Document.list({
        filter: { owner: { eq: username } }
      });
      const docs = documents as DocumentType[];
      setUploadedFiles(docs);
      setProcessingStats(calculateProcessingStats(docs));

      // Load chunks count
      try {
        const { data: chunks } = await client.models.DocumentChunk.list({
          filter: { owner: { eq: username } }
        });
        setTotalChunksCount(chunks.length);
      } catch (error) {
        console.log('DocumentChunk model not yet available');
        setTotalChunksCount(0);
      }

      // Load embeddings
      try {
        const { data: embeddingData } = await client.models.Embedding.list({
          filter: { owner: { eq: username } }
        });
        setEmbeddings(embeddingData as EmbeddingType[]);
      } catch (error) {
        console.log('Embedding model not yet available');
        setEmbeddings([]);
      }
    } catch (error) {
      console.error('Error loading documents:', error);
    }
  }, [username]);

  // Load document chunks for a specific document
  const loadDocumentChunks = useCallback(async (documentId: string) => {
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
      console.warn('DocumentChunk model may not be deployed yet');
    } finally {
      setIsLoadingChunks(false);
    }
  }, []);

  // Generate embeddings (simulated for Stage 5)
  const generateEmbeddings = useCallback(async () => {
    setIsGeneratingEmbeddings(true);
    setEmbeddingProgress('🔢 Starting embeddings generation...');
    
    try {
      setEmbeddingProgress('🔢 Processing document chunks...');
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
  }, [uploadedFiles, forceRefresh]);

  // Handle file deletion
  const handleDeleteFile = useCallback(async (document: DocumentType) => {
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

      // Delete all embeddings
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
      
      console.log(`✅ "${document.name}" and all its chunks and embeddings deleted successfully!`);
    } catch (error) {
      console.error('Error deleting file:', error);
      console.error('❌ Error deleting file. Please try again.');
    }
  }, [selectedDocument, forceRefresh]);

  // Initial load effect
  useEffect(() => {
    console.log('🚀 Stage 5: Interface mounted for user:', userEmail);
    
    const initializeData = async () => {
      await loadProfile();
      await loadDocuments();
    };
    
    initializeData();
  }, [userEmail, loadProfile, loadDocuments]);

  // Manual refresh effect
  useEffect(() => {
    if (refreshKey > 0) {
      const refreshData = async () => {
        await loadProfile();
        await loadDocuments();
      };
      refreshData();
    }
  }, [refreshKey, loadProfile, loadDocuments]);

  // Auto-refresh effect for processing status
  useEffect(() => {
    const interval = setInterval(loadDocuments, 5000);
    return () => clearInterval(interval);
  }, [loadDocuments]);

  return {
    // UI State
    activeTab,
    setActiveTab,
    embeddingProgress,
    
    // Data State
    userProfile,
    uploadedFiles,
    selectedDocument,
    setSelectedDocument,
    documentChunks,
    embeddings,
    totalChunksCount,
    processingStats,
    
    // Loading States
    isLoadingChunks,
    isGeneratingEmbeddings,
    
    // Actions
    forceRefresh,
    loadDocumentChunks,
    generateEmbeddings,
    handleDeleteFile,
    
    // Computed Values
    embeddingsCount: embeddings.length,
  };
};
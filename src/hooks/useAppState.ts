// src/hooks/useAppState.ts - Main application state orchestrator

import { useCallback, useEffect } from 'react';
import { useUserProfile } from './useUserProfile';
import { useUIState } from './useUIState';
import { useDocuments } from './useDocuments';
import { useDocumentChunks } from './useDocumentChunks';
import { useEmbeddings } from './useEmbeddings';
import { useFileOperations } from './useFileOperations';
import { DocumentType } from '../types';

export const useAppState = (username: string, userEmail: string) => {
  // Specialized hooks
  const { userProfile, loadProfile } = useUserProfile(username, userEmail);
  
  const { 
    activeTab, 
    setActiveTab, 
    refreshKey, 
    forceRefresh, 
    embeddingProgress, 
    updateEmbeddingProgress 
  } = useUIState();

  const { 
    uploadedFiles, 
    totalChunksCount, 
    processingStats
  } = useDocuments(username, refreshKey);

  const {
    selectedDocument,
    setSelectedDocument,
    documentChunks,
    isLoadingChunks,
    loadDocumentChunks,
    clearSelection
  } = useDocumentChunks();

  const {
    embeddings,
    embeddingsCount,
    isGeneratingEmbeddings,
    generateEmbeddings
  } = useEmbeddings(
    username, 
    refreshKey, 
    uploadedFiles, 
    updateEmbeddingProgress, 
    forceRefresh
  );

  const { deleteFileCompletely } = useFileOperations();

  // Enhanced file deletion with UI state management
  const handleDeleteFile = useCallback(async (document: DocumentType) => {
    const success = await deleteFileCompletely(document, updateEmbeddingProgress);
    
    if (success) {
      // Update UI state if the deleted document was selected
      if (selectedDocument?.id === document.id) {
        clearSelection();
      }
      // Force refresh to update the UI
      forceRefresh();
    }
  }, [deleteFileCompletely, selectedDocument, clearSelection, forceRefresh, updateEmbeddingProgress]);

  // Initialize data on mount
  useEffect(() => {
    console.log('🚀 Stage 5: Interface mounted for user:', userEmail);
    loadProfile();
  }, [userEmail, loadProfile]);

  // Return the same interface as before for compatibility
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
    embeddingsCount,
  };
};

// Security note: All data transmission in this application is secured through HTTPS
// via AWS Amplify's built-in encryption for data in transit (addressing CWE-319)
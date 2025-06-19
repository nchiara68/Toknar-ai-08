// src/hooks/useUIState.ts - UI state management

import { useState, useCallback } from 'react';
import { TabType } from '../types';

export const useUIState = () => {
  const [activeTab, setActiveTab] = useState<TabType>('chat');
  const [refreshKey, setRefreshKey] = useState(0);
  const [embeddingProgress, setEmbeddingProgress] = useState('');

  const forceRefresh = useCallback(() => {
    setRefreshKey(prev => prev + 1);
  }, []);

  const updateEmbeddingProgress = useCallback((progress: string) => {
    setEmbeddingProgress(progress);
  }, []);

  const clearEmbeddingProgress = useCallback((delay: number = 0) => {
    if (delay > 0) {
      setTimeout(() => setEmbeddingProgress(''), delay);
    } else {
      setEmbeddingProgress('');
    }
  }, []);

  return {
    // State
    activeTab,
    refreshKey,
    embeddingProgress,
    
    // Actions
    setActiveTab,
    forceRefresh,
    updateEmbeddingProgress,
    clearEmbeddingProgress
  };
};
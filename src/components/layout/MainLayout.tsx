// src/components/layout/MainLayout.tsx
import React from 'react';
import { ProcessingStats } from '../../types';

interface MainLayoutProps {
  children: React.ReactNode;
  totalDocuments: number;
  totalChunksCount: number;
  embeddingsCount: number;
  messagesCount: number;
  processingStats: ProcessingStats;
}

export const MainLayout: React.FC<MainLayoutProps> = ({
  children,
  totalDocuments,
  totalChunksCount,
  embeddingsCount,
  messagesCount,
  processingStats
}) => {
  return (
    <div style={{ 
      height: '100vh', 
      display: 'flex', 
      flexDirection: 'column',
      fontFamily: 'Arial, sans-serif'
    }}>
      {children}
      
      {/* Enhanced Status Bar */}
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
          📄 Docs: {totalDocuments} | 
          🧩 Total Chunks: {totalChunksCount} | 
          🔢 Embeddings: {embeddingsCount} |
          💬 Messages: {messagesCount} |
          ⚙️ Processing: {processingStats.processing}
        </div>
      </footer>
    </div>
  );
};
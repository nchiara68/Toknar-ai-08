// src/components/layout/Header.tsx
import React from 'react';
import { useAuthenticator } from '@aws-amplify/ui-react';
import { TabType, UserProfileType, ProcessingStats } from '../../types';

interface HeaderProps {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
  userProfile: UserProfileType | null;
  totalChunksCount: number;
  embeddingsCount: number;
  messagesCount: number;
  processingStats: ProcessingStats;
  embeddingProgress: string;
  onDebug: () => void;
  onRefresh: () => void;
  onExport: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  userProfile,
  totalChunksCount,
  embeddingsCount,
  messagesCount,
  processingStats,
  embeddingProgress,
  onDebug,
  onRefresh,
  onExport
}) => {
  const { user, signOut } = useAuthenticator((context) => [context.user]);

  return (
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
            🔢 {embeddingsCount} embeddings | 
            💬 {messagesCount} messages
          </p>
        </div>
        
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button
            onClick={onDebug}
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
            onClick={onRefresh}
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
            onClick={onExport}
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
        <span>🔢 Embedded: {embeddingsCount}</span>
      </div>

      {/* Progress Message */}
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
  );
};
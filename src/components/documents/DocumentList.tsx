// src/components/documents/DocumentList.tsx
import React from 'react';
import { DocumentType } from '../../types';

interface DocumentListProps {
  documents: DocumentType[];
  onViewChunks: (document: DocumentType) => void;
  onDeleteDocument: (document: DocumentType) => Promise<void>;
}

export const DocumentList: React.FC<DocumentListProps> = ({
  documents,
  onViewChunks,
  onDeleteDocument
}) => {
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

  const getEmbeddingStatusColor = (hasEmbeddings: boolean) => {
    return hasEmbeddings ? '#28A745' : '#FFC107';
  };

  const getEmbeddingStatusIcon = (hasEmbeddings: boolean) => {
    return hasEmbeddings ? '🔢' : '⏳';
  };

  return (
    <div style={{ flex: 1, padding: '2rem', overflow: 'auto' }}>
      <h3 style={{ marginBottom: '1rem' }}>📄 Your Documents ({documents.length})</h3>
      
      {documents.length === 0 ? (
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
          {documents.map((doc) => (
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
                    onClick={() => onViewChunks(doc)}
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
                  onClick={() => onDeleteDocument(doc)}
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
  );
};
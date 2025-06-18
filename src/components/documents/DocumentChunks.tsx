// src/components/documents/DocumentChunks.tsx
import React from 'react';
import { DocumentType, DocumentChunkType } from '../../types';

interface DocumentChunksProps {
  selectedDocument: DocumentType | null;
  chunks: DocumentChunkType[];
  isLoading: boolean;
  onBack: () => void;
}

export const DocumentChunks: React.FC<DocumentChunksProps> = ({
  selectedDocument,
  chunks,
  isLoading,
  onBack
}) => {
  if (!selectedDocument) {
    return (
      <div style={{ 
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem',
        color: '#6C757D'
      }}>
        <div style={{ textAlign: 'center' }}>
          <h3>🧩 Document Chunks</h3>
          <p>Select a completed document from the "Documents" tab to view its chunks.</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ flex: 1, padding: '2rem', overflow: 'auto' }}>
      <div style={{ marginBottom: '2rem' }}>
        <h3 style={{ margin: 0 }}>🧩 Document Chunks: {selectedDocument.name}</h3>
        <p style={{ color: '#6C757D', margin: '0.5rem 0' }}>
          {chunks.length} chunks • 
          Total words: {chunks.reduce((sum, chunk) => sum + chunk.wordCount, 0)}
          {isLoading && ' • Loading...'}
        </p>
        <button
          onClick={onBack}
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

      {isLoading ? (
        <div style={{ 
          textAlign: 'center', 
          padding: '2rem',
          color: '#6C757D'
        }}>
          <div>🔄 Loading chunks...</div>
        </div>
      ) : chunks.length === 0 ? (
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
          {chunks.map((chunk) => (
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
    </div>
  );
};
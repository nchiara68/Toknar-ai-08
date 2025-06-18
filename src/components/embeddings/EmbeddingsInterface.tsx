// src/components/embeddings/EmbeddingsInterface.tsx
import React, { useState } from 'react';
import { DocumentType, EmbeddingType, SearchResult } from '../../types';

interface EmbeddingsInterfaceProps {
  documents: DocumentType[];
  embeddings: EmbeddingType[];
  totalChunksCount: number;
  onGenerateEmbeddings: () => Promise<void>;
  isGeneratingEmbeddings: boolean;
}

export const EmbeddingsInterface: React.FC<EmbeddingsInterfaceProps> = ({
  documents,
  embeddings,
  totalChunksCount,
  onGenerateEmbeddings,
  isGeneratingEmbeddings
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const getEmbeddingStatusColor = (hasEmbeddings: boolean) => {
    return hasEmbeddings ? '#28A745' : '#FFC107';
  };

  const getEmbeddingStatusIcon = (hasEmbeddings: boolean) => {
    return hasEmbeddings ? '🔢' : '⏳';
  };

  const searchDocuments = async () => {
    if (!searchQuery.trim()) {
      console.warn('Please enter a search query');
      return;
    }

    setIsSearching(true);
    
    try {
      // Simulate vector search for Stage 5
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const embeddedDocs = documents.filter(d => d.embeddingsGenerated);
      const mockResults: SearchResult[] = embeddedDocs.slice(0, 3).map((doc, index) => ({
        chunkId: `${doc.id}-chunk-${index}`,
        documentId: doc.id,
        content: `This is a relevant chunk from "${doc.name}" that matches your search query "${searchQuery}". This content demonstrates how vector similarity search would work with your uploaded documents. Similarity score: ${(0.9 - index * 0.1).toFixed(2)}`,
        similarity: 0.9 - index * 0.1,
        chunkIndex: index
      }));
      
      setSearchResults(mockResults);
      
    } catch (error) {
      console.error('Error searching documents:', error);
      console.error('Error searching documents');
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <>
      {/* Embeddings Header */}
      <div style={{
        padding: '0.75rem 1rem',
        backgroundColor: '#F8F9FA',
        borderBottom: '1px solid #DEE2E6'
      }}>
        <strong style={{ color: '#232F3E' }}>🔢 Embeddings & Vector Search</strong>
        <span style={{ marginLeft: '1rem', color: '#6C757D', fontSize: '0.9rem' }}>
          Amazon Titan + FAISS Vector Database
        </span>
      </div>

      <div style={{ flex: 1, padding: '2rem', overflow: 'auto' }}>
        
        {/* Embeddings Generation Section */}
        <div style={{ marginBottom: '3rem' }}>
          <h3 style={{ marginBottom: '1rem' }}>🔢 Generate Embeddings</h3>
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', 
            gap: '1.5rem' 
          }}>
            <div style={{
              padding: '1.5rem',
              border: '1px solid #DEE2E6',
              borderRadius: '8px',
              backgroundColor: '#FFFFFF'
            }}>
              <h4 style={{ margin: '0 0 1rem 0', color: '#4A90E2' }}>Embedding Generation</h4>
              <p style={{ color: '#666', fontSize: '0.9rem', margin: '0 0 1rem 0' }}>
                Convert your document chunks into searchable vectors using Amazon Titan Embeddings
              </p>
              <button
                onClick={onGenerateEmbeddings}
                disabled={isGeneratingEmbeddings || totalChunksCount === 0}
                style={{
                  padding: '0.75rem 1.5rem',
                  backgroundColor: isGeneratingEmbeddings ? '#ccc' : '#4A90E2',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: isGeneratingEmbeddings ? 'not-allowed' : 'pointer',
                  width: '100%',
                  fontSize: '1rem',
                  fontWeight: 'bold'
                }}
              >
                {isGeneratingEmbeddings ? '🔢 Generating...' : '🔢 Generate Embeddings'}
              </button>
              {totalChunksCount === 0 && (
                <p style={{ color: '#DC3545', fontSize: '0.8rem', margin: '0.5rem 0 0 0' }}>
                  No document chunks available. Upload and process documents first.
                </p>
              )}
            </div>

            <div style={{
              padding: '1.5rem',
              border: '1px solid #DEE2E6',
              borderRadius: '8px',
              backgroundColor: '#F8F9FA'
            }}>
              <h4 style={{ margin: '0 0 1rem 0', color: '#232F3E' }}>Embedding Status</h4>
              <div style={{ fontSize: '0.9rem' }}>
                <div style={{ marginBottom: '0.5rem' }}>
                  📄 <strong>Total Documents:</strong> {documents.length}
                </div>
                <div style={{ marginBottom: '0.5rem' }}>
                  🧩 <strong>Total Chunks:</strong> {totalChunksCount}
                </div>
                <div style={{ marginBottom: '0.5rem' }}>
                  🔢 <strong>Total Embeddings:</strong> {embeddings.length}
                </div>
                <div style={{ marginBottom: '0.5rem' }}>
                  📊 <strong>Coverage:</strong> {totalChunksCount > 0 ? 
                    (embeddings.length / totalChunksCount * 100).toFixed(1) + '%' : '0%'}
                </div>
                <div>
                  🤖 <strong>Model:</strong> Amazon Titan Embeddings v1
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Vector Search Section */}
        <div style={{ marginBottom: '3rem' }}>
          <h3 style={{ marginBottom: '1rem' }}>🔍 Vector Search</h3>
          <div style={{
            padding: '1.5rem',
            border: '1px solid #DEE2E6',
            borderRadius: '8px',
            backgroundColor: '#FFFFFF'
          }}>
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search your documents using vector similarity..."
                onKeyPress={(e) => e.key === 'Enter' && searchDocuments()}
                style={{
                  flex: 1,
                  padding: '0.75rem',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  fontSize: '1rem'
                }}
              />
              <button
                onClick={searchDocuments}
                disabled={isSearching || !searchQuery.trim() || embeddings.length === 0}
                style={{
                  padding: '0.75rem 1.5rem',
                  backgroundColor: isSearching ? '#ccc' : '#28A745',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: isSearching ? 'not-allowed' : 'pointer',
                  fontSize: '1rem',
                  fontWeight: 'bold'
                }}
              >
                {isSearching ? '🔍 Searching...' : '🔍 Search'}
              </button>
            </div>
            
            {embeddings.length === 0 && (
              <p style={{ color: '#DC3545', fontSize: '0.9rem', margin: '0 0 1rem 0' }}>
                No embeddings available. Generate embeddings first to enable vector search.
              </p>
            )}

            {/* Search Results */}
            {searchResults.length > 0 && (
              <div style={{ marginTop: '1.5rem' }}>
                <h4 style={{ margin: '0 0 1rem 0', color: '#232F3E' }}>
                  Search Results ({searchResults.length}):
                </h4>
                {searchResults.map((result, index) => (
                  <div key={index} style={{
                    padding: '1rem',
                    backgroundColor: '#F8F9FA',
                    border: '1px solid #E9ECEF',
                    borderRadius: '6px',
                    marginBottom: '1rem'
                  }}>
                    <div style={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'center',
                      marginBottom: '0.5rem'
                    }}>
                      <span style={{ fontWeight: 'bold', color: '#4A90E2' }}>
                        Similarity: {(result.similarity * 100).toFixed(1)}%
                      </span>
                      <span style={{ fontSize: '0.8rem', color: '#6C757D' }}>
                        Chunk {result.chunkIndex + 1}
                      </span>
                    </div>
                    <div style={{ 
                      fontSize: '0.95rem',
                      lineHeight: '1.5',
                      color: '#333'
                    }}>
                      {result.content}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Document Embedding Status */}
        <div>
          <h3 style={{ marginBottom: '1rem' }}>📄 Document Embedding Status</h3>
          {documents.length === 0 ? (
            <div style={{ 
              textAlign: 'center', 
              padding: '2rem',
              backgroundColor: '#F8F9FA',
              borderRadius: '8px',
              color: '#6C757D'
            }}>
              <p>📄 No documents uploaded yet.</p>
              <p>Upload documents first to generate embeddings.</p>
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
                      Processing: {doc.processingStatus} • 
                      Chunks: {doc.totalChunks || 0} • 
                      Embeddings: {getEmbeddingStatusIcon(doc.embeddingsGenerated || false)} 
                      {doc.embeddingsGenerated ? 'Generated' : 'Pending'}
                    </div>
                  </div>
                  <div style={{
                    padding: '0.25rem 0.75rem',
                    borderRadius: '12px',
                    fontSize: '0.8rem',
                    fontWeight: 'bold',
                    backgroundColor: getEmbeddingStatusColor(doc.embeddingsGenerated || false),
                    color: 'white'
                  }}>
                    {doc.embeddingsGenerated ? '🔢 EMBEDDED' : '⏳ PENDING'}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
};
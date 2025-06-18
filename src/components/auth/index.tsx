// src/components/auth/index.tsx

export const authenticatorComponents = {
  Header() {
    return (
      <div style={{ 
        textAlign: 'center', 
        padding: '2rem 1rem 1rem 1rem',
        backgroundColor: '#232F3E',
        color: 'white'
      }}>
        <h1 style={{ margin: 0, fontSize: '1.8rem' }}>
          🔢 RAG Chat - Stage 5: Complete System + Embeddings + Vector Search
        </h1>
        <p style={{ margin: '0.5rem 0 0 0', opacity: 0.8 }}>
          AI conversation + file uploads + document processing + text chunking + embeddings + vector search
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
        🔢 Stage 5: Complete Document Processing + Embeddings + Vector Search | Next: Stage 6 RAG Integration
      </div>
    );
  }
};
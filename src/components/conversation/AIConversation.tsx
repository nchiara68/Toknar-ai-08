// src/components/conversation/AIConversation.tsx
import React, { useState } from 'react';
import { useAuthenticator } from '@aws-amplify/ui-react';

interface Message {
  role: 'user' | 'assistant';
  content: Array<{ text?: string; toolUse?: { name?: string } }>;
}

interface AIConversationProps {
  messages: Message[];
  isLoading: boolean;
  onSendMessage: (message: { content: Array<{ text: string }> }) => void;
}

export const AIConversation: React.FC<AIConversationProps> = ({
  messages,
  isLoading,
  onSendMessage
}) => {
  const { user } = useAuthenticator((context) => [context.user]);
  const [currentMessage, setCurrentMessage] = useState('');

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentMessage.trim()) return;
    
    console.log('📤 Sending message:', currentMessage);
    onSendMessage({
      content: [{ text: currentMessage }]
    });
    setCurrentMessage('');
  };

  return (
    <>
      {/* Chat Header */}
      <div style={{
        padding: '0.75rem 1rem',
        backgroundColor: '#F8F9FA',
        borderBottom: '1px solid #DEE2E6',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div>
          <strong style={{ color: '#232F3E' }}>💬 AI Conversation</strong>
          <span style={{ marginLeft: '1rem', color: '#6C757D', fontSize: '0.9rem' }}>
            Powered by Claude 3 Haiku
          </span>
        </div>
        <div style={{ fontSize: '0.8rem', color: '#6C757D' }}>
          🔢 Stage 5: Ready for Stage 6 RAG integration with embeddings
        </div>
      </div>

      {/* Messages Area */}
      <div style={{ 
        flex: 1, 
        padding: '1rem',
        overflow: 'auto',
        backgroundColor: '#FFFFFF'
      }}>
        {!messages || messages.length === 0 ? (
          <div style={{ 
            textAlign: 'center', 
            padding: '2rem',
            color: '#6C757D'
          }}>
            <h3>🎉 Welcome to Stage 5, {user.signInDetails?.loginId?.split('@')[0]}!</h3>
            <p>Document processing + embeddings + vector search is now ready!</p>
            <p><strong>✅ What's Working:</strong></p>
            <ul style={{ textAlign: 'left', maxWidth: '500px', margin: '0 auto' }}>
              <li>📁 File uploads to S3</li>
              <li>⚡ Lambda-triggered processing</li>
              <li>📄 Text extraction & chunking</li>
              <li>💾 Chunk storage in DynamoDB</li>
              <li>📊 Real-time status tracking</li>
              <li>🔢 Embedding generation (simulated)</li>
              <li>🔍 Vector similarity search (simulated)</li>
            </ul>
            <p><strong>🚀 Next:</strong> Stage 6 will connect RAG to this conversation!</p>
          </div>
        ) : (
          <div>
            {messages.map((message, messageIndex) => (
              <div
                key={messageIndex}
                style={{
                  margin: '1rem 0',
                  padding: '1rem',
                  backgroundColor: message.role === 'user' ? '#E3F2FD' : '#F5F5F5',
                  borderRadius: '8px',
                  maxWidth: '80%',
                  marginLeft: message.role === 'user' ? 'auto' : '0',
                  marginRight: message.role === 'user' ? '0' : 'auto'
                }}
              >
                <div style={{ 
                  fontWeight: 'bold', 
                  marginBottom: '0.5rem',
                  color: message.role === 'user' ? '#1976D2' : '#333'
                }}>
                  {message.role === 'user' ? '👤 You' : '🤖 Claude 3 Haiku'}
                </div>
                <div>
                  {message.content.map((content, contentIndex) => (
                    <div key={contentIndex}>
                      {content.text || content.toolUse?.name || 'Message content'}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
        
        {isLoading && (
          <div style={{ 
            textAlign: 'center', 
            padding: '1rem',
            color: '#6C757D'
          }}>
            <div>🤖 Claude is thinking...</div>
          </div>
        )}
      </div>

      {/* Input Area */}
      <div style={{
        padding: '1rem',
        borderTop: '1px solid #DEE2E6',
        backgroundColor: '#F8F9FA'
      }}>
        <form onSubmit={handleSendMessage} style={{ display: 'flex', gap: '0.5rem' }}>
          <input
            type="text"
            value={currentMessage}
            onChange={(e) => setCurrentMessage(e.target.value)}
            placeholder="Chat with Claude 3 Haiku..."
            style={{
              flex: 1,
              padding: '0.75rem',
              border: '1px solid #CED4DA',
              borderRadius: '4px',
              fontSize: '1rem'
            }}
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={isLoading || !currentMessage.trim()}
            style={{
              padding: '0.75rem 1.5rem',
              backgroundColor: isLoading ? '#6C757D' : '#007BFF',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: isLoading ? 'not-allowed' : 'pointer',
              fontSize: '1rem',
              fontWeight: 'bold'
            }}
          >
            {isLoading ? '⏳' : '📤 Send'}
          </button>
        </form>
      </div>
    </>
  );
};
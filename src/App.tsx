import React, { useState, useEffect } from 'react';
import { Amplify } from 'aws-amplify';
import { Authenticator, useAuthenticator } from '@aws-amplify/ui-react';
import '@aws-amplify/ui-react/styles.css';
import './App.css';
import outputs from '../amplify_outputs.json';
import { useAIConversation } from './client';

// 🔧 Configure Amplify
Amplify.configure(outputs);
console.log('🔧 Amplify configured for Stage 2: AI Conversation');

// 🎨 Custom Authenticator Components
const components = {
  Header() {
    return (
      <div style={{ 
        textAlign: 'center', 
        padding: '2rem 1rem 1rem 1rem',
        backgroundColor: '#232F3E',
        color: 'white'
      }}>
        <h1 style={{ margin: 0, fontSize: '1.8rem' }}>
          🤖 RAG Chat - Stage 2: AI Conversation
        </h1>
        <p style={{ margin: '0.5rem 0 0 0', opacity: 0.8 }}>
          Testing AI conversation with Claude 3 Haiku
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
        🤖 AI Conversation powered by Claude 3 Haiku | Stage 2: Chat Interface
      </div>
    );
  }
};

// 📄 Stage 2 Chat Interface Component
function Stage2ChatInterface() {
  console.log('🤖 Stage 2: Chat Interface component rendered');
  
  const { user, signOut } = useAuthenticator((context) => [context.user]);
  const [currentMessage, setCurrentMessage] = useState('');
  
  // 🤖 Use AI Conversation Hook
  const [
    {
      data: { messages },
      isLoading,
    },
    sendMessage,
  ] = useAIConversation('ragChat');

  useEffect(() => {
    console.log('🚀 Stage 2: Chat Interface mounted');
    console.log('👤 Current user:', user.signInDetails?.loginId);
    console.log('💬 ragChat conversation ready');
  }, [user]);

  // 📤 Handle sending messages
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentMessage.trim()) return;
    
    console.log('📤 Sending message:', currentMessage);
    await sendMessage({
      content: [
        {
          text: currentMessage
        }
      ]
    });
    setCurrentMessage('');
  };

  // 💾 Export Conversation
  const exportConversation = () => {
    console.log('💾 Exporting conversation...');
    alert(`Conversation export feature coming in Stage 7! 
Current user: ${user.signInDetails?.loginId}
Messages: ${messages?.length || 0}`);
  };

  return (
    <div style={{ 
      height: '100vh', 
      display: 'flex', 
      flexDirection: 'column',
      fontFamily: 'Arial, sans-serif'
    }}>
      
      {/* 🏷️ Header */}
      <header style={{ 
        padding: '1rem', 
        backgroundColor: '#232F3E', 
        color: 'white',
        borderBottom: '2px solid #FF9900',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '1.5rem' }}>
            🤖 Stage 2: AI Conversation
          </h1>
          <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.9rem', opacity: 0.8 }}>
            👤 {user.signInDetails?.loginId} | Messages: {messages?.length || 0}
          </p>
        </div>
        
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button
            onClick={exportConversation}
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: '#007BFF',
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
      </header>

      {/* 🤖 AI CONVERSATION INTERFACE */}
      <main style={{ 
        flex: 1, 
        display: 'flex', 
        flexDirection: 'column',
        overflow: 'hidden'
      }}>
        
        {/* Conversation Info Bar */}
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
            🔄 Stage 2: Basic chat responses (no documents yet)
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
              <h3>🤖 Welcome to Stage 2, {user.signInDetails?.loginId?.split('@')[0]}!</h3>
              <p>I'm Claude 3 Haiku, ready to chat with you.</p>
              <p>Start a conversation by typing a message below!</p>
            </div>
          ) : (
            <div>
              {messages.map((message, index) => (
                <div
                  key={index}
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

        {/* Message Input */}
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
              placeholder="Type your message to Claude 3 Haiku..."
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
      </main>

      {/* 📊 Status Bar */}
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
          🚀 <strong>Next:</strong> Stage 3 - File Upload
        </div>
        <div>
          💬 Connected to ragChat conversation
        </div>
      </footer>
    </div>
  );
}

// 📄 Main App Component
function App() {
  console.log('🚀 Stage 2: App component rendered');

  return (
    <div className="App">
      <Authenticator 
        components={components}
        hideSignUp={true}
        loginMechanisms={['email']}
      >
        {({ user }) => {
          console.log('✅ Stage 2: User authenticated:', user?.signInDetails?.loginId);
          return <Stage2ChatInterface />;
        }}
      </Authenticator>
    </div>
  );
}

export default App;

console.log('✅ Stage 2: AI Conversation app component loaded');
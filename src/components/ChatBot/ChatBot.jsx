import React, { useState, useEffect, useRef } from 'react';
import { Send, Heart, ThumbsUp, Laugh, MessageCircle, AlertCircle, RefreshCw, Sparkles, Zap, Brain } from 'lucide-react';
import { useChat } from '../../hooks/useChat';
import { useAuth } from '../../hooks/useAuth';
import { resetApiFailure } from '../../utils/openRouterAI';
import './ChatBot.css';

function ChatBot() {
  const { user } = useAuth();
  const { messages, loading: chatLoading, error: chatError, sendMessage, clearChat } = useChat(user?.id);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);

  const quickReplies = [
    { text: "Saya merasa cemas", icon: Heart },
    { text: "Butuh saran dukungan", icon: MessageCircle },
    { text: "Hanya ingin bercerita", icon: ThumbsUp },
    { text: "Mengelola stres harian", icon: Sparkles }
  ];

  const handleSendMessage = async () => {
    if (!inputValue.trim() || !user) return;

    const messageText = inputValue;
    setInputValue('');
    setIsLoading(true);
    setIsTyping(true);

    try {
      await sendMessage(messageText);
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setIsLoading(false);
      setTimeout(() => setIsTyping(false), 500);
    }
  };

  const handleQuickReply = (text) => {
    setInputValue(text);
    setTimeout(() => {
      handleSendMessage();
    }, 100);
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Create a Set to track unique message IDs and prevent duplicates
  const uniqueMessageIds = new Set();

  // Process and sort messages by timestamp to ensure proper order, removing duplicates
  let processedMessages = [...messages]
    .filter(msg => {
      if (uniqueMessageIds.has(msg.id)) {
        return false;
      }
      uniqueMessageIds.add(msg.id);
      return true;
    })
    .sort((a, b) => new Date(a.created_at) - new Date(b.created_at))
    .map((msg, index) => ({
      id: msg.id || `msg-${Date.now()}-${index}`,
      text: msg.message,
      sender: msg.sender,
      timestamp: new Date(msg.created_at)
    }));

  // Add initial message if no messages exist
  if (processedMessages.length === 0 && !chatLoading && !chatError && user) {
    processedMessages = [{
      id: 'initial-message-' + Date.now(),
      text: "Halo! Saya adalah pendamping emosional AI Anda. Bagaimana perasaan Anda hari ini?",
      sender: 'bot',
      timestamp: new Date()
    }, ...processedMessages];
  }

  const displayMessages = processedMessages;

  return (
    <div className="chatbot-container-v2">
      {/* Animated Background */}
      <div className="chat-bg-animation"></div>

      <div className="chat-header-v2">
        <div className="chat-header-content">
          <div className="ai-avatar-small">
            <div className="avatar-glow"></div>
            <Brain className="avatar-icon" />
          </div>
          <div className="header-text">
            <h2>Dukungan Emosional AI</h2>
            <p className="status-text">
              <span className="status-dot"></span>
              Online & Siap Membantu
            </p>
          </div>
        </div>
        <button
          className="retry-api-btn-v2"
          onClick={() => {
            resetApiFailure();
            console.log('API failure state reset. Refresh page to ensure full reset.');
          }}
          title="Reset API connection"
        >
          <RefreshCw size={18} />
        </button>
      </div>

      <div className="chat-messages-v2">
        {chatError && (
          <div className="message-wrapper bot">
            <div className="message-v2 bot-message-v2 error-message-v2">
              <AlertCircle size={18} />
              <div className="message-content-v2">
                {chatError.message}
              </div>
            </div>
          </div>
        )}

        {displayMessages.map((message, index) => (
          <div
            key={message.id}
            className={`message-wrapper ${message.sender === 'user' ? 'user' : 'bot'}`}
            style={{ animationDelay: `${index * 0.1}s` }}
          >
            {message.sender === 'bot' && (
              <div className="ai-avatar">
                <div className="avatar-glow"></div>
                <div className="avatar-inner">
                  <Brain size={22} />
                </div>
              </div>
            )}

            <div className={`message-v2 ${message.sender === 'user' ? 'user-message-v2' : 'bot-message-v2'}`}>
              <div className="message-content-v2">
                {message.text}
              </div>
              <div className="message-timestamp-v2">
                {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>

            {message.sender === 'user' && (
              <div className="user-avatar">
                {user?.user_metadata?.avatar_url ? (
                  <img
                    src={user.user_metadata.avatar_url}
                    alt="User Avatar"
                    className="user-avatar-img"
                  />
                ) : (
                  <div className="user-avatar-inner">
                    {user?.email?.charAt(0).toUpperCase() || 'U'}
                  </div>
                )}
              </div>
            )}
          </div>
        ))}

        {(isLoading || chatLoading || isTyping) && (
          <div className="message-wrapper bot">
            <div className="ai-avatar">
              <div className="avatar-glow pulsing"></div>
              <div className="avatar-inner">
                <Brain size={22} />
              </div>
            </div>
            <div className="message-v2 bot-message-v2">
              <div className="typing-indicator-v2">
                <div className="typing-dot"></div>
                <div className="typing-dot"></div>
                <div className="typing-dot"></div>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      <div className="quick-replies-v2">
        {quickReplies.map((reply, index) => {
          const IconComponent = reply.icon;
          return (
            <button
              key={index}
              className="quick-reply-btn-v2"
              onClick={() => handleQuickReply(reply.text)}
              disabled={!user}
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className="quick-reply-icon">
                <IconComponent size={18} />
              </div>
              <span>{reply.text}</span>
            </button>
          );
        })}
      </div>

      <div className="chat-input-container-v2">
        <div className="input-wrapper">
          <textarea
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={user ? "Type your message here..." : "Please log in to chat with the AI"}
            className="chat-input-v2"
            rows="1"
            disabled={!user || isLoading || chatLoading}
          />
          <button
            id="send-button"
            onClick={handleSendMessage}
            className="send-button-v2"
            disabled={!user || isLoading || chatLoading || !inputValue.trim()}
          >
            <Send size={20} />
            <span className="button-glow"></span>
          </button>
        </div>
      </div>
    </div>
  );
}

export default ChatBot;
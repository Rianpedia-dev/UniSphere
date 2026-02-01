import React from 'react';
import ChatBot from '../../components/ChatBot/ChatBot.jsx';
import { Brain, Sparkles, Heart } from 'lucide-react';
import './ChatPage.css';

function ChatPage() {
  return (
    <div className="chat-page-container-v2">
      {/* Animated Background Layer */}
      <div className="page-bg-layer"></div>
      <div className="page-gradient-orb orb-1"></div>
      <div className="page-gradient-orb orb-2"></div>
      <div className="page-gradient-orb orb-3"></div>

      {/* Header */}
      <header className="chat-page-header">
        <div className="header-content-wrapper">
          <div className="header-icon-wrapper">
            <div className="icon-glow"></div>
            <Brain className="header-icon" size={32} />
          </div>
          <div className="header-text-content">
            <h1 className="page-title">
              Dukungan Emosional AI
              <Sparkles className="title-sparkle" size={24} />
            </h1>
            <p className="page-subtitle">
              <Heart size={16} className="subtitle-icon" />
              Pendamping AI pribadi Anda untuk kesejahteraan emosional
            </p>
          </div>
        </div>
      </header>

      {/* Main Chat Area */}
      <main className="chat-page-main">
        <ChatBot />
      </main>

      {/* Footer Info */}
      <footer className="chat-page-footer">
        <div className="footer-content">
          <p className="footer-text">
            Powered by AI · Private & Secure · Available 24/7
          </p>
        </div>
      </footer>
    </div>
  );
}

export default ChatPage;
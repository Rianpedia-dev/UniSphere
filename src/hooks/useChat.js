// src/hooks/useChat.js
import { useState, useEffect } from 'react';
import { supabase } from '../utils/supabase';
import { analyzeSentiment, generateEmpatheticResponse } from '../utils/openRouterAI';

export const useChat = (userId) => {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Check if environment variables are properly set
  useEffect(() => {
    if (!import.meta.env.VITE_OPENROUTER_API_KEY || import.meta.env.VITE_OPENROUTER_API_KEY.includes('xxxxxxxxxx')) {
      console.warn('OpenRouter API key is not properly configured. AI features will be limited.');
    }
  }, []);

  // Load chat history
  useEffect(() => {
    if (!userId) return;

    const loadChatHistory = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('chat_sessions')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: true });

        if (error) throw error;
        setMessages(data || []);
      } catch (err) {
        setError(err.message);
        console.error('Error loading chat history:', err);
      } finally {
        setLoading(false);
      }
    };

    loadChatHistory();

    // Set up real-time subscription
    const subscription = supabase
      .channel('chat-updates')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_sessions',
          filter: `user_id=eq.${userId}`
        },
        (payload) => {
          // Only add the message if it's not already in the state (to prevent duplicates)
          setMessages(prev => {
            const exists = prev.some(msg => msg.id === payload.new.id);
            if (!exists) {
              // Ensure no duplicate IDs exist by filtering first
              const filteredPrev = prev.filter(msg => msg.id !== payload.new.id);
              return [...filteredPrev, payload.new];
            }
            return prev;
          });
        }
      )
      .subscribe();

    // Clean up subscription on unmount
    return () => {
      if (subscription) {
        supabase.removeChannel(subscription);
      }
    };
  }, [userId]);

  const sendMessage = async (messageText) => {
    if (!messageText.trim() || !userId) {
      if (!userId) {
        setError('User not authenticated');
      }
      return;
    }

    if (!import.meta.env.VITE_OPENROUTER_API_KEY || import.meta.env.VITE_OPENROUTER_API_KEY.includes('xxxxxxxxxx')) {
      setError('AI services are not configured. Please set up your OpenRouter API key.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Add user message to local state immediately with a temporary ID
      let sentiment = 'neutral';
      try {
        sentiment = await analyzeSentiment(messageText);
      } catch (sentimentError) {
        console.warn('Sentiment analysis failed:', sentimentError);
        // Default to neutral if sentiment analysis fails
        sentiment = 'neutral';
      }

      const temporaryUserMessageId = `temp-${Date.now()}-${Math.random()}`; // Add random component to ensure uniqueness
      const temporaryUserMessage = {
        id: temporaryUserMessageId,
        user_id: userId,
        message: messageText,
        sender: 'user',
        created_at: new Date().toISOString(),
        sentiment: sentiment
      };

      setMessages(prev => [...prev, temporaryUserMessage]);

      // Save to database - the database will generate the proper UUID
      const { data: insertedMessage, error: insertError } = await supabase
        .from('chat_sessions')
        .insert([{
          user_id: userId,
          message: messageText,
          sender: 'user',
          sentiment: sentiment
        }])
        .select()
        .single();

      if (insertError) {
        console.error('Error saving user message:', insertError);
        // Remove the temporary message if insertion fails
        setMessages(prev => prev.filter(msg => msg.id !== temporaryUserMessageId));
        throw insertError;
      }

      // Update the message in state with the one from the database (with real ID)
      setMessages(prev =>
        prev.map(msg =>
          msg.id === temporaryUserMessageId ? insertedMessage : msg
        )
      );

      // Generate AI response
      let aiResponse = "I'm unable to respond right now. Please try again later.";
      try {
        aiResponse = await generateEmpatheticResponse(
          messageText,
          messages.map(msg => ({
            sender: msg.sender,
            text: msg.message
          })).slice(-10) // Limit to last 10 messages for context
        );
      } catch (responseError) {
        console.error('Error generating AI response:', responseError);
        aiResponse = "I'm having trouble responding right now. Can you tell me more about what you're feeling?";
      }

      // Analyze sentiment of AI response
      let aiSentiment = 'neutral';
      try {
        aiSentiment = await analyzeSentiment(aiResponse);
      } catch (sentimentError) {
        console.warn('AI response sentiment analysis failed:', sentimentError);
        // Default to neutral if analysis fails
        aiSentiment = 'neutral';
      }

      // Save AI response to database - the database will generate the proper UUID
      const { data: aiMessageData, error: aiInsertError } = await supabase
        .from('chat_sessions')
        .insert([{
          user_id: userId,
          message: aiResponse,
          sender: 'ai',
          sentiment: aiSentiment
        }])
        .select()
        .single();

      if (aiInsertError) {
        console.error('Error saving AI response:', aiInsertError);
        throw aiInsertError;
      }

      // Update local state with AI response
      setMessages(prev => {
        // Make sure we don't add duplicate AI messages
        const exists = prev.some(msg => msg.id === aiMessageData.id);
        if (!exists) {
          // Also filter out any existing message with the same ID to prevent duplicates
          const filteredPrev = prev.filter(msg => msg.id !== aiMessageData.id);
          return [...filteredPrev, aiMessageData];
        }
        return prev;
      });
    } catch (err) {
      setError(err.message);
      console.error('Error sending message:', err);
    } finally {
      setLoading(false);
    }
  };

  const clearChat = async () => {
    if (!userId) {
      setError('User not authenticated');
      return;
    }

    try {
      const { error } = await supabase
        .from('chat_sessions')
        .delete()
        .eq('user_id', userId);

      if (error) throw error;

      setMessages([]);
    } catch (err) {
      setError(err.message);
      console.error('Error clearing chat:', err);
    }
  };

  return {
    messages,
    loading,
    error,
    sendMessage,
    clearChat
  };
};